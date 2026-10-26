# Ateliê — Arquitetura de sincronização com Supabase

> **Status:** Fases 1–4 concluídas e validadas; Fase 5 (pull/merge) **em implementação** (merge + pull prontos, testados em simulação; validação real pendente). Timer fica para a Fase 6.
> **Base:** decisões do usuário (Magic Link, local-first, timer, lixeira, IDs, modelagem híbrida, logo, segurança, migração) + código atual.
> **Documentos relacionados:** `SUPABASE_DATA_MAPPING.md` (dados), `SUPABASE_IMPLEMENTATION_PLAN.md` (etapas).
> **Estado atual:** schema/RLS validados; autenticação validada; onboarding validado; importação inicial validada em conta de teste; outbox/push validada manualmente (encerrada); pull/merge (`merge.js` + `sync.js`) implementados e testados em simulação (validação real pendente).

## 1. Decisões de arquitetura

| # | Decisão |
|---|---|
| 1 | **Auth:** Supabase Auth com **Magic Link** por e-mail; acesso restrito à conta do usuário (cadastro público desabilitado após a criação da conta ou lista de e-mails permitidos). Sessão persistida com refresh automático. |
| 2 | **Sync:** **local-first**. `localStorage` continua sendo a fonte para a UI; gravação local primeiro; sincronização em segundo plano com fila persistente, retry e reconexão. |
| 3 | **Timer:** sincronizar a sessão ativa em uma única linha por conta; continua funcionando offline. |
| 4 | **Lixeira:** local na v1; exclusões sincronizadas usam tombstones para não ressuscitar tarefas. Tabela de lixeira é evolução futura. |
| 5 | **IDs:** preservar os IDs textuais atuais; `user_id` + RLS; chaves compostas `(user_id, id)` para isolamento e integridade. |
| 6 | **Modelagem:** híbrida — tabelas relacionais para entidades principais; JSONB para `subs`, `logs`, `goals`, `interactions`, `stage_history`; arrays `text[]` para `skills`/`labels`. |
| 7 | **Logo:** em `user_settings.data.logo` (data URI), limite flexível ~2 MB, compressão no cliente; Storage só se necessário. |
| 8 | **Segurança:** Auth + RLS em todas as tabelas; `service_role` nunca no frontend; sem PIN local nesta fase. |
| 9 | **Migração:** a partir de backup JSON externo, idempotente, preservando IDs; validar contagens, relações, derivados e datas ausentes. |

## 2. Visão geral

```text
┌────────────────────────────── Navegador (PWA) ──────────────────────────────┐
│  UI (interface.js/app.js)                                                  │
│      │                                                                     │
│      ▼                                                                     │
│  Estado S em memória ──save()──► localStorage['atelier']                   │
│      │                              │                                      │
│      │ mudança                     ▼                                      │
│      └──────────────► Sync engine (novo módulo)                            │
│                         ├─ outbox persistente (fila)                       │
│                         ├─ cursor de pull                                  │
│                         ├─ device_id                                       │
│                         └─ cliente Supabase (Auth + REST/PostgREST)        │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                    │ HTTPS
                                    ▼
┌──────────────────────────── Supabase ──────────────────────────────────────┐
│  Auth (Magic Link)  │  Postgres (tabelas + RLS)  │  Storage (opcional)     │
└────────────────────────────────────────────────────────────────────────────┘
```

O app **não deixa de funcionar** se o Supabase estiver indisponível: a UI opera sobre `S`/`localStorage`; a sincronização é um processo paralelo.

## 3. Autenticação (Magic Link)

- Login por e-mail (Magic Link), sem senha. O link redireciona de volta para a URL do GitHub Pages.
- **Cadastro restrito:** desabilitar “Allow new users to sign up” no Supabase Auth após criar a conta, ou usar lista de e-mails permitidos. Não há tela de cadastro aberta no app.
- **Sessão:** o cliente Supabase persiste a sessão (`persistSession: true`) e renova o token automaticamente (`autoRefreshToken: true`). O usuário não deve relogar a cada uso.
- **Offline:** o app continua utilizável sem sessão válida; a sincronização pausa. Ao voltar online, se a sessão expirou, o app pede novo Magic Link de forma discreta; nada é perdido (fila local permanece).
- **Logout:** limpa a sessão; a fila e os dados locais permanecem (o app volta ao modo local). O usuário decide se limpa dados locais.
- **Sem `service_role` no navegador.** A chave pública (publishable/anon) é esperada; a autorização é feita por RLS.

## 4. Fluxo local-first

### 4.1 Escrita (push)

1. Ação do usuário muta `S` e chama `save()` (já existente) — gravação local síncrona.
2. A camada de sync detecta a mudança (ou é chamada explicitamente pela mutação) e grava uma entrada na **outbox** (`atelier_sync_outbox`), com `table`, `id`, `op` (`upsert`/`delete`), `payload`, `updated_at`, `device_id`.
3. Entradas são **coalescidas** por `(table, id)`: a última operação vence; `delete` substitui `upsert` anterior.
4. Ao ficar online/autenticado, a outbox é enviada em ordem de dependência (pais antes de filhos) com `upsert` idempotente por `(user_id, id)`.
5. Falhas: retry com backoff exponencial; após N tentativas, item marcado como erro e o indicador mostra “erro”; a fila não é descartada.

### 4.2 Leitura (pull)

- **Polling simples** (sem Realtime na v1): pull ao iniciar, ao ficar online, ao voltar o foco/aba visível e a cada ~30 s enquanto online. Realtime pode substituir o polling no futuro sem mudar o modelo.
- Consulta incremental por `server_updated_at > cursor` (cursor persistido em `atelier_sync_cursor`), em lotes ordenados.
- Para cada registro remoto: aplicar a política de conflito (seção 6), atualizar `S`, chamar `save()` e `render()` (ou atualização parcial).
- O cursor usa `updated_at` (mantido pelo servidor via trigger), evitando depender do relógio do cliente para não perder linhas.

### 4.3 Indicador de sincronização

Reutilizar o pill existente (4C), com precedência:

`bloqueado (4A) > erro local (4C) > offline > pendente > sincronizando > sincronizado`

- **sincronizado:** outbox vazia e último pull concluído.
- **sincronizando:** envio/recebimento em andamento.
- **offline:** sem rede; alterações continuam na fila.
- **pendente:** há itens na outbox (ex.: aguardando reconexão).
- **erro:** falha persistente de sync (após retries); ação sugerida: tentar novamente/ver detalhes.
- Textos curtos e discretos, no mesmo componente visual; não criar tela nova.

## 5. Fila, estado e retomada

- Chaves locais (separadas de `S`): `atelier_sync_outbox`, `atelier_sync_cursor`, `atelier_sync_device_id`, `atelier_sync_last_error`.
- A fila sobrevive a recarregar/fechar o app.
- **Ordem:** `clients`, `areas`, `labels`, `skills`, `projects`, `tasks`, `applications`, `contacts`, `work_logs`, `user_settings`, `active_timer`.
- **Idempotência:** todo envio é `upsert` por `(user_id, id)`; reenviar não duplica. Exclusões são tombstones (`deleted_at`), não `DELETE` físico.
- **Concorrência:** um único flush por vez (mutex simples em memória + flag persistida), para não duplicar envios.
- **Auth expirada:** pausa a fila, preserva os itens e sinaliza “offline/pendente”; retoma após novo login.

## 6. Conflitos e exclusões

### 6.1 Política de conflito

Para um único usuário em vários dispositivos, a regra é **Last-Write-Wins por registro**, com desempate determinístico:

1. Cada registro tem `client_updated_at` (epoch ms do cliente, o `updatedAt` local).
2. Vence o maior `client_updated_at`; empate → maior `updated_at` do servidor.
3. Campos **append-only** são mesclados antes da decisão, para não perder informação:
   - `tasks.logs[]` e `tasks.subs[]`: união por `id`; para o mesmo `id`, vence o item com `updated_at`/timestamp maior; logs nunca são removidos por conflito.
   - `contacts.interactions[]`: união por `at/type/direction/note` (mantendo os mais recentes até o limite de 100).
4. `user_settings.data`: LWW do objeto inteiro pelo `updated_at`; conflito é raro (preferências). O perdedor pode ser guardado em um backup local de conflito (opcional) para inspeção.
5. `active_timer`: LWW; ver seção 7.

Justificativa: previsível, sem merge automático arriscado de campos semanticamente diferentes, e com proteção extra para registros append-only (tempo/interações), que são os dados mais valiosos.

### 6.2 Exclusões e tombstones

- Todas as tabelas sincronizadas têm `deleted_at timestamptz` (inclusive `tasks`).
- O app local continua com hard delete de tarefas; a camada de sync envia `deleted_at` no lugar de apagar a linha remota.
- Pull de um tombstone remove o registro local (ou marca `deletedAt` nas entidades que já usam soft delete).
- **Restaurar** (ex.: lixeira local futura) = upsert com `deleted_at = null` e `updated_at` novo; vence o tombstone anterior.
- `work_logs` não têm exclusão; snapshots permanecem.
- **Lixeira:** permanece local na v1. Exclusões continuam sincronizando como tombstones, então tarefas excluídas **não reaparecem** em outro dispositivo. Futuro: tabela `trash` (`id`, `user_id`, `task jsonb`, `deleted_at`) sincronizada; a lógica de tombstones já cobre o caso, sem reescrever o restante.

## 7. Timer (sessão ativa)

- Tabela `active_timer` com **uma linha por usuário** (`user_id` PK, linha persistente — `task_id = null` indica “sem timer”): `task_id`, `sub_id`, `started_at`, `accumulated_seconds`, `paused`, `target_min`, `phase`, `focus_min`, `rest_min`, `cycle_count`, `device_id`, `updated_at`, `client_updated_at`.
- Sincroniza ao iniciar, pausar, retomar, trocar fase, trocar subtarefa e parar.
- **Adoção em outro dispositivo:** ao receber uma linha remota mais nova, o app adota o timer (se o task/sub existir localmente; caso contrário, aguarda o pull das tarefas).
- **Conflito:** vence o `updated_at` mais recente; o timer perdedor é descartado (estado efêmero), sem gerar log. Ao parar/concluir fase, os minutos entram em `tasks.logs` e são sincronizados como parte da tarefa.
- **Offline:** o timer roda localmente; o `active_timer` é atualizado na fila e enviado depois.
- **Push notifications:** fora do escopo; a tabela não impede adicionar notificações depois.

## 8. Segurança e RLS

- **Auth obrigatório** para sync; sem usuário autenticado, o app opera apenas localmente.
- **RLS habilitado em todas as tabelas.** Políticas por operação:
  - `select`/`update`/`delete`: `using (user_id = auth.uid())`;
  - `insert`: `with check (user_id = auth.uid())`;
  - `update`: `using (...)` + `with check (...)`.
- **`user_id`:** `uuid not null default auth.uid()`; nunca confiar em valor vindo do cliente.
- **Chaves compostas:** PK `(user_id, id)` nas entidades; FKs compostas `(user_id, parent_id)` para garantir que uma referência não atravesse usuários. `user_settings`/`active_timer` usam `user_id` como PK.
- **`work_logs`:** único `(user_id, task_id, date)` quando `task_id` não é nulo (índice parcial).
- **Arrays (`skills`/`labels`):** sem FK; a integridade é mantida por soft delete e validação no cliente. Se necessário no futuro, tabelas de junção `task_skills`/`task_labels` podem ser adicionadas sem mudar o modelo principal.
- **Chaves:** publishable/anon é pública e não autoriza sozinha; RLS é a autorização. **`service_role` nunca no navegador**; operações privilegiadas, se existirem, ficam em Edge Functions.
- **Storage (futuro):** bucket privado com políticas por pasta do usuário.
- **Testes de segurança:** dois usuários de teste; verificar que A não lê/atualiza/apaga dados de B; tentativas de inserir `user_id` de outro usuário devem falhar.

## 9. Modelo de tabelas (resumo)

Detalhes de campos em `SUPABASE_DATA_MAPPING.md`.

| Tabela | Papel | PK |
|---|---|---|
| `user_settings` | cfg, energy, xpPool, commands (JSONB) | `user_id` |
| `tasks` | tarefas + subs/logs JSONB | `(user_id, id)` |
| `projects` | projetos + goals JSONB | `(user_id, id)` |
| `clients` | clientes | `(user_id, id)` |
| `contacts` | contatos + interactions JSONB | `(user_id, id)` |
| `applications` | vagas + históricos JSONB | `(user_id, id)` |
| `skills` | habilidades/XP | `(user_id, id)` |
| `goals` | metas | `(user_id, id)` |
| `labels` | etiquetas | `(user_id, id)` |
| `areas` | áreas | `(user_id, id)` |
| `work_logs` | registros de trabalho | `(user_id, id)` |
| `active_timer` | sessão de timer ativa | `user_id` |

Todas as tabelas têm `user_id`, `created_at`, `updated_at` (servidor, cursor) e `client_updated_at` (LWW). `deleted_at` existe apenas onde há exclusão (tasks, projects, clients, contacts, applications, skills, goals). `work_logs` não têm FK (histórico sobrevive à exclusão).

## 10. Migração (resumo)

1. Backup JSON externo + cópia do estado.
2. Normalizar com `migrate()` local; validar contagens/IDs.
3. Schema + RLS em projeto de desenvolvimento; usuário de teste.
4. Import idempotente na ordem de dependências; `upsert` por IDs atuais.
5. Validar contagens, FKs, derivados, datas nulas, ausência de duplicatas.
6. Manter o app local funcionando (sem sync) até a validação.
7. Ativar sync por feature flag; testar dois dispositivos simulados.
8. Reversão: desligar a flag, manter JSON; dados locais intactos.

Critérios detalhados e fases em `SUPABASE_IMPLEMENTATION_PLAN.md`.

## 11. Fora de escopo (v1)

- Notificações push.
- Realtime/colaboração ao vivo.
- PIN/trava local.
- Sincronização da lixeira.
- Supabase Storage para o logo (só se necessário).
- Sincronização de XP por eventos (v1 usa LWW em `skills.xp`).

## 12. Hipóteses e pendências assumidas

- **Supabase JS:** cliente oficial v2 via import dinâmico ESM (jsDelivr), sem build; se o CDN estiver indisponível, o app continua funcionando e a área de conta mostra indisponibilidade.
- **Polling** em vez de Realtime na v1; intervalo configurável (~30 s).
- **Relógio do dispositivo:** `client_updated_at` é do cliente; conflitos usam esse valor. Aceitável para um único usuário; empate é desfeito pelo `updated_at` do servidor. `updated_at` (servidor) é usado apenas para o cursor de pull.
- **Sem tela nova:** configuração de conta/sync dentro de Configurações, reutilizando componentes existentes.

## 13. Autenticação implementada (Fase 2)

- **Arquivos:** `supabase-config.js` (URL, chave publishable e redirect), `auth.js` (módulo de autenticação), `index.html` (carrega os dois após `app.js`), `interface.js` (seção **Conta** em Configurações), `app.js` (ações `authSendLink`/`authLogout`), `service-worker.js` (precache e `CACHE_VERSION` v21 atual).
- **Fluxo:** `signInWithOtp({ email, options: { shouldCreateUser: false, emailRedirectTo } })`; sessão persistida (`persistSession`), renovação automática (`autoRefreshToken`) e detecção do retorno do link (`detectSessionInUrl`); `onAuthStateChange` atualiza a UI.
- **Restrição de cadastro:** `shouldCreateUser: false` e cadastro público desabilitado no painel; não há tela pública de registro.
- **Logout:** `signOut()` encerra apenas a sessão; `localStorage['atelier']` e backups permanecem intactos.
- **Offline:** o app inicia e funciona sem autenticação; a área de conta mostra aviso e tenta novamente ao voltar online.
- **Segurança:** apenas chave publishable/anon no frontend; `service_role` nunca no navegador; tokens do Magic Link são removidos da URL após o login.
- **Configuração manual:** preencher `supabase-config.js`; adicionar a URL de produção (e a de teste local, se usar) em Authentication → URL Configuration → Redirect URLs; manter o cadastro público desabilitado.
- **Escopo:** o login/logout foi integrado a Configurações na Fase 2; o onboarding (apresentação/tema) foi implementado na Fase 2.5 — ver seção 14.
- **Validação:** UI de auth coberta por `_auth_ui_test.js` (13/13); Magic Link validado manualmente no desktop e no celular (2026-10-24); logout testado no celular; offline ainda não testado em dispositivo real. Limite do Supabase Auth no plano atual: 2 e-mails/hora.

## 14. Onboarding implementado (Fase 2.5)

- **Referência:** `ATELIE_ONBOARDING.md` (guia externo ao repositório, em `...\Docs`).
- **Arquivos:** `onboarding.js`, `paginas.css` (overlay `.ob-*`), `index.html`, `app.js` (ação `onboardingOpen`), `interface.js` (seção **Ajuda**), `service-worker.js` (`CACHE_VERSION` v20). Teste: `_onboarding_test.js`.
- **Fluxo:** overlay com 3 passos — **login opcional** (Magic Link), **apresentação** (logo + Tarefas/Projetos, Planejamento, Pomodoro) e **escolha de tema**; “Pular” em qualquer etapa; conclusão salva em `localStorage['atelier_onboarding_v1']`; botão “Rever apresentação inicial” em Configurações.
- **Decisões:** login não bloqueia o app (pode continuar sem conta); estado de onboarding é local por dispositivo (sincronização por conta fica para a fase de sync); tema usa `S.cfg.theme`/`applyTheme()` existentes; “Rever” permite testar novamente.
- **Limitações:** conclusão não sincronizada entre dispositivos; um usuário existente verá o onboarding uma vez após esta atualização (pode pular). Validação visual concluída (desktop e celular, 2026-10-24).
- **Validação:** `_onboarding_test.js` (12/12) e suítes existentes; nenhum Magic Link foi solicitado nos testes automatizados; validado visualmente no desktop e no celular.

## 15. Importação inicial (Fase 3)

- **Arquivos:** `import-data.js` (mapeamento + `upsert` + `verify` + seção **Sincronização**), `auth.js` (expõe `__auth.getClient()`), `index.html`, `interface.js`, `app.js` (ação `dataImport`), `service-worker.js` (`CACHE_VERSION` v21). Teste: `_import_mapping_test.js`.
- **Modelo:** executa **no navegador, com a sessão do usuário autenticado** e a chave publishable; o RLS autoriza cada linha (`auth.uid() = user_id`). **Nenhuma `service_role`** é usada, em nenhum arquivo.
- **Ordem:** `user_settings` → `labels` → `areas` → `skills` → `clients` → `projects` → `tasks` → `contacts` → `applications` → `goals` → `work_logs`.
- **Idempotência:** `upsert` com `onConflict: 'user_id'` (user_settings) e `'user_id,id'` (demais).
- **Conversões:** ms→ISO; `''`→`NULL` em FKs/datas; `where`→`where_`; `spent_minutes` somado dos logs; `doneAt` nulo preservado; `created_at`/`updated_at` pelo servidor; `client_updated_at` = `updatedAt` local.
- **Fora do escopo desta fase:** `timer`/`active_timer` (Fase 6), `trash` (local), sincronização contínua, outbox e conflitos.
- **Correção aplicada:** campos inteiros arredondados com `int()` (XP fracionário em `skills` causava erro de tipo na importação).
- **Validação:** `_import_mapping_test.js` (27/27, cliente simulado); importação real executada e validada na conta de teste (2026-10-25): todas as tabelas gravadas, `user_id` 100% conferente, inteiros sem erro.
- **Fase 4:** ver seção 16.

## 16. Outbox e envio — push (Fase 4)

- **Arquivos:** `sync.js` (novo), `import-data.js` (expõe `mapOne`/`settingsRow`/`settingsPayload`), `estado.js` (hook `__sync.onSave()` após `save()`), `auth.js` (hook `__sync.onAuth()`), `index.html` (`cloudPill` + script), `componentes.css`, `app.js` (ações `syncFlushNow`/`syncForceFull`), `service-worker.js` (`CACHE_VERSION` v23). Teste: `_sync_outbox_test.js`.
- **Modelo:** somente local → Supabase. Fila `atelier_sync_outbox` (`{seq, ops[]}`), mapa `atelier_sync_seen` (hash de conteúdo + `flushed`), `atelier_sync_device_id`, `atelier_sync_owner`.
- **Detecção:** hash de conteúdo por entidade (independe de `updatedAt`; cobre `labels`/`workLogs`); o diff no `save()` gera upserts/tombstones. Entidade criada+excluída antes de enviar → descartada, sem tombstone.
- **Coalescência:** 1 op por `(table, id)`; tombstone substitui upsert e vice-versa.
- **Envios:** ordem de FKs; `upsert` com `onConflict user_id,id`; tombstone mínimo `{user_id, id, deleted_at, client_updated_at}`; gate por conta (`owner` == uid) e offline.
- **Retry:** falha transiente → mantém op + backoff (5s→30min cap, jitter ±20%); falha de dados → fallback linha a linha; ops nunca descartadas.
- **Concorrência:** `navigator.locks` serializa a leitura-escrita da outbox/seen entre abas.
- **Segurança:** chave publishable + RLS; sem `service_role`; `sync.js` nunca escreve em `S`.
- **Validação:** `_sync_outbox_test.js` (22/22, simulado) + suítes existentes; **validação manual do usuário no app publicado (PC + celular, 2026-10-25)**: offline detectado; edição offline com pendência; envio automático na reconexão; pausa sem sessão; criação sem login preservada e enviada no login (`user_id` correto); logout com operação pendente sem perda; mesma conta em outro dispositivo sem tarefas/tema (esperado — push-only).
- **Verificação de código:** logout não limpa a outbox nem o dono; o envio exige `owner == uid` atual — nenhuma operação de uma conta é enviada para outra.
- **Limitações registradas:** sem pull (Fase 5); tema/cfg sobem mas não descem; fila vinculada à conta dona (troca de conta → “pausada” até o dono voltar).
- **Incidente Supabase (22–23/10/2026, Management API):** afeta a **Management API** (painel/Studio, operações de projeto, pagamentos), separada de PostgREST e Auth; sem evidência de impacto na sincronização; incerteza registrada (página oficial renderizada por JS, detalhes não totalmente legíveis). Nenhuma mudança de infraestrutura necessária.

## 17. Pull, merge e conflitos (Fase 5 — em implementação)

- **Arquivos:** `merge.js` (mapeamento reverso `fromRow` + `decide` + união + `mergeEntity`/`mergeWorkLog`), `sync.js` (pull incremental com cursor, ativação inicial, anti-loop, id determinístico + reconciliação 23505 de `work_logs`), `estado.js` (`_seedId` no seed). Testes: `_sync_merge_test.js` (20/20), `_sync_pull_test.js` (10/10).
- **LWW determinístico:** vence o maior `client_updated_at`; empate → `updated_at` do servidor; empate final → remoto. Deleção/restauração são **estados** com `client_updated_at`.
- **Merge de conteúdo:** campos escalares por LWW; `logs`/`subs`/`interactions`/`stage_history` por **união por id/at** (histórico append-only não se perde); derivados recalculados.
- **Pull inicial:** merge (nunca substituir); substituição apenas do **seed marcado** (`_seedId` + forma intacta), com gate de outbox vazia; interrompido → re-executável (cursor só avança após aplicar + `save()`).
- **Cursor:** por tabela (`updated_at`), paginação 500, por conta (`atelier_sync_cursors`); ciclo **pull → merge → flush**.
- **Anti-loop:** após aplicar, `seen` é atualizado (hash + `flushed=true`) e `updatedAt = client_updated_at` — o `save()` não reenfileira o que veio do servidor.
- **`work_logs`:** id determinístico `wl_<hash(task_id|date)>` (órfãos mantêm id aleatório); dedupe por `(task_id, date)` sem somar; reconciliação reativa de 23505 (local vence → renomeia/sobrescreve em uma linha; remoto vence → descarta op e aplica remoto) — sem loop, sem perda do mais novo.
- **Validação:** simulada (`_sync_merge_test.js` + `_sync_pull_test.js`, 30 asserções); **validação real pendente** (dois dispositivos, cenários 1–10).
- **Propriedade da conta:** `resolveOwner()` unifica a regra em `pullOnce`/`flushOnce`. Outbox vazia + dono diferente → adota o novo UID (reseta `seen`/`settings_cu`/`seed`, preserva `S` e outbox; cursores por-conta isolados). Outbox pendente + dono diferente → estado `paused-account` (fila preservada, sem envio cruzado), com a ação explícita `clearSyncQueue` (“Descartar fila pendente e usar esta conta”) para destravar com confirmação — remove apenas outbox/owner/`seen`/`settings_cu`/`seed`, sem tocar em `S` nem nos dados remotos.
- **Reset local controlado:** `resetLocalData()` (ação “Restaurar dados da conta”, com confirmação) volta `S` a `seed()`, limpa outbox/`seen`/cursores/`settings_cu`/`seed` (preserva autenticação/owner/deviceId) e **executa o pull diretamente sob o lock** (seed → substituição). **Não altera o Supabase.** Robustez: `fetchRows` tem timeout de 20s (não trava o lock); `pullOnce` agenda retry (30s) e retorna `false` em falha, para o `syncCycle` não mascarar o erro como “Sincronizado”.
