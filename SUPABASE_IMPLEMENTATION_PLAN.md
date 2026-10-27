# Ateliê — Plano de implementação da sincronização com Supabase

> **Contexto central:** [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md) · índice: [`docs/README.md`](docs/README.md) · roadmap: [`docs/ROADMAP.md`](docs/ROADMAP.md).
>
> **Status:** Fases 0–6 concluídas. A **Fase 6 (timer sincronizado)** está implementada, testada automaticamente (`_sync_timer_test.js`) e **validada manualmente em PC + celular** (cenários principais). Tema e accent são locais por dispositivo; ver `docs/TIMER.md` e `docs/TABS.md`.
> **Arquitetura:** `SUPABASE_ARCHITECTURE.md` · **Dados:** `SUPABASE_DATA_MAPPING.md`
> **Princípio:** cada fase entrega algo verificável sem quebrar o uso diário; o app permanece funcional offline e sem sync até a fase 7.

## Fase 0 — Documentação e decisões

- **Objetivo:** registrar mapeamento, arquitetura e plano.
- **Arquivos:** `SUPABASE_DATA_MAPPING.md`, `SUPABASE_ARCHITECTURE.md`, `SUPABASE_IMPLEMENTATION_PLAN.md`.
- **Concluído quando:** documentos revisados e decisões sem pendências bloqueantes.
- **Testes:** revisão manual; nenhum teste de software.
- **Status:** feito nesta etapa.

## Fase 1 — Schema e RLS em projeto de desenvolvimento

- **Objetivo:** criar as tabelas, chaves compostas, FKs, índices e políticas RLS em um projeto Supabase **de desenvolvimento**, com dois usuários de teste.
- **Arquivos criados:** `supabase/migrations/0001_schema.sql`, `supabase/migrations/0002_rls.sql`, `supabase/tests/001_schema_rls_test.sql`, `supabase/tests/README.md`, `SUPABASE_SCHEMA.md`.
- **Conteúdo:** as 12 tabelas; PK `(user_id, id)`; FKs compostas; `deleted_at` nas entidades com exclusão; índice único de `work_logs`; `work_logs` sem FK; `active_timer` com uma linha por usuário; RLS por operação.
- **Concluído quando:** schema aplicado no dev; usuário A não lê/escreve dados de B; inserir `user_id` de outro usuário falha; todas as FKs válidas; teste `001_schema_rls_test.sql` executado e passando.
- **Testes:** dois usuários de teste via SQL/Supabase Studio (`001_schema_rls_test.sql`); tentativas de acesso cruzado.
- **Status:** **Concluída em 2026-10-24.** Migrações aplicadas manualmente no projeto de desenvolvimento; `001_schema_rls_test.sql` executado no SQL Editor e retornou `TESTE CONCLUÍDO — todos os blocos passaram`. Cobertura comportamental: 8 tabelas; `skills`/`goals`/`labels`/`areas` apenas estruturais.
- **Não fazer:** não aplicar em produção; não conectar o app ainda.

## Fase 2 — Auth Magic Link e sessão

- **Objetivo:** login por e-mail, sessão persistente e cadastro restrito, **sem sync ainda**.
- **Arquivos criados/modificados:** `supabase-config.js` (URL/chave publishable/redirect), `auth.js` (módulo de auth), `index.html` (carregamento), `interface.js` (seção Conta em Configurações), `app.js` (ações de login/logout), `service-worker.js` (precache + `CACHE_VERSION` v19). Teste: `_auth_ui_test.js` (fora do app).
- **Decisões:** import dinâmico ESM do `@supabase/supabase-js` v2 (jsDelivr, sem build); apenas chave publishable/anon; `shouldCreateUser: false`; `persistSession`, `autoRefreshToken`, `detectSessionInUrl`; logout apenas encerra a sessão.
- **Concluído quando:** Magic Link funciona; sessão persiste entre recarregamentos; logout funciona; app continua utilizável offline; nenhuma escrita remota de dados de tarefas.
- **Testes:** UI de auth isolada (`_auth_ui_test.js`, 13/13) e suítes existentes; **validação manual concluída** no desktop e no celular (login/logout); offline ainda não testado em dispositivo real.
- **Status:** **Concluída em 2026-10-24.** Login validado no desktop e no celular (mesma conta); logout testado no celular; sessão persistente. Limite do Supabase Auth no plano atual: 2 e-mails/hora. Não valida sincronização de dados.
- **Risco principal:** configuração de URL de redirecionamento e restrição de cadastro.

## Fase 2.5 — Onboarding (primeira utilização)

- **Objetivo:** apresentar o app, permitir login opcional e escolher tema uma única vez, sem bloquear o uso local.
- **Referência:** `ATELIE_ONBOARDING.md` (guia externo ao repositório).
- **Arquivos criados/modificados:** `onboarding.js`, `paginas.css` (overlay), `index.html`, `app.js` (ação `onboardingOpen`), `interface.js` (seção Ajuda), `service-worker.js` (`CACHE_VERSION` v20). Teste: `_onboarding_test.js`.
- **Conteúdo:** 3 passos — login opcional (Magic Link), apresentação (logo + Tarefas/Projetos, Planejamento, Pomodoro), escolha de tema reutilizando `THEMES`; pular em qualquer etapa; conclusão em `localStorage['atelier_onboarding_v1']`; botão “Rever apresentação inicial”.
- **Decisões:** login não bloqueia o app; estado de onboarding local (sync por conta fica para a fase de sync); tema em `S.cfg.theme`/`applyTheme()`.
- **Status:** **Concluída em 2026-10-24** — validada visualmente no desktop e celular (fluxo e temas).
- **Testes:** `_onboarding_test.js` (12/12) e suítes existentes; nenhum Magic Link solicitado.

## Fase 3 — Camada de dados + importação inicial

- **Objetivo:** mapear `S` ↔ linhas e importar o estado local de forma idempotente e verificável.
- **Arquivos criados/modificados:** `import-data.js` (mapeamento + `upsert` + `verify` + seção Sincronização), `auth.js` (expõe `getClient()`), `index.html`, `interface.js`, `app.js` (ação `dataImport`), `service-worker.js` (`CACHE_VERSION` v21). Teste: `_import_mapping_test.js`.
- **Decisões:** importação **pelo cliente autenticado** (sessão + RLS), **sem `service_role`**; `upsert` por `user_id,id`; ordem de FKs; `created_at`/`updated_at` pelo servidor; `client_updated_at` = `updatedAt` local; `spent_minutes` recalculado dos logs; `doneAt` nulo preservado; não importa `timer`/`trash`.
- **Concluído quando:** importar um backup de teste duas vezes não duplica; contagens por tabela conferem; FKs válidas; `doneAt` nulos preservados; derivados conferem; usuário de teste isolado.
- **Testes executados:** `_import_mapping_test.js` (**27/27** — inclui arredondamento de inteiros) com cliente simulado + `node --check` + suítes existentes.
- **Correção aplicada (2026-10-25):** XP fracionário (o app divide XP entre habilidades → `xp` decimal) causava `invalid input syntax for type integer` em `skills`; o mapeador agora arredonda campos inteiros com `int()` (`xp`, `sort_order`, contadores, `client_updated_at` etc.).
- **Status:** **Concluída e validada em 2026-10-25.** Importação real executada na conta de teste `joba.jobiel@gmail.com` com sucesso total: todas as tabelas gravadas; `user_id` de 100% dos registros confere com o UID da conta; inteiros salvos sem erro (verificado no Table Editor e SQL Editor).
- **Critério de reversão:** backup JSON intacto; dados remotos do usuário de teste podem ser apagados sem afetar o app.

## Fase 4 — Outbox e envio (push)

- **Objetivo:** registrar mudanças locais numa fila persistente e enviá-las (upsert/tombstone) ao Supabase quando online e autenticado — **somente local → remoto**.
- **Arquivos criados/modificados:** `sync.js` (novo), `import-data.js` (expõe `mapOne`/`settingsRow`/`settingsPayload`), `estado.js` (hook `__sync.onSave()` após `save()`), `auth.js` (hook `__sync.onAuth()`), `index.html` (`cloudPill` + script), `componentes.css` (estados do cloud pill), `app.js` (ações `syncFlushNow`/`syncForceFull`), `service-worker.js` (`CACHE_VERSION` v23). Teste: `_sync_outbox_test.js`.
- **Outbox:** `atelier_sync_outbox` = `{seq, ops[]}`; op = `{seq, table, id, kind: upsert|tombstone, ts, attempts, nextAttemptAt, lastError}`. **Coalescência:** 1 op por `(table, id)`.
- **Detecção de mudanças:** `atelier_sync_seen` com **hash de conteúdo** por entidade (funciona para `labels`/`workLogs`, que não têm `updatedAt`); a cada `save()`, o diff gera upserts (novos/alterados) e tombstones (removidos de tabelas com `deleted_at`). Entidade **criada e excluída antes de enviar** → op descartada, sem tombstone.
- **Envios:** debounce + evento `online`/`login`/`visibilitychange`; pré-condições = online + sessão + `atelier_sync_owner` == uid atual (senão **pausa**). Ordem de FKs da Fase 3, lote por tabela, `upsert` com `onConflict user_id,id` (user_settings: `user_id`); tombstone = `{user_id, id, deleted_at, client_updated_at}`.
- **Retry/backoff:** falha transiente (rede/auth/rate) mantém ops com `attempts++` e `nextAttemptAt` (5s→20s→2min→10min→30min cap, jitter ±20%); **falha de dados** dispara fallback **linha a linha** isolando o registro ruim.
- **Concorrência:** `navigator.locks` ('atelier_sync_v1') serializa a leitura-escrita da outbox/seen entre abas (fallback sem lock se indisponível).
- **Reuso:** mapeadores e `ORDER` da Fase 3 (`window.__importer`); sem `service_role`; RLS no servidor; não importa `active_timer`/`trash`.
- **Fora do escopo:** pull, merge/conflitos, timer (Fases 5/6).
- **Testes:** `_sync_outbox_test.js` (**22/22**, cliente simulado) + `node --check` + suítes existentes.
- **Validação manual do usuário (2026-10-25, app publicado, PC + celular):** (1) offline detectado e indicado rapidamente; (2) edição offline → indicador de pendência; (3) reconexão → envio automático e indicador sincronizado; (4) sem sessão → sincronização pausada; (5) criação de tarefa sem login preservada; (6) login → dados offline enviados à conta com `user_id` correto (sincronização demorou, mas concluiu); (7) logout com operação pendente → fila preservada, sem perda aparente; (8) mesma conta em outro dispositivo → login OK, mas tarefas/tema do PC não aparecem e o indicador ficou pausado.
- **Verificação de código (logout × fila):** o logout **não** limpa `atelier_sync_outbox` nem `atelier_sync_owner`; `flushOnce` só envia quando o usuário atual é o dono da fila — operações pendentes de uma conta nunca são enviadas para outra.
- **Comportamentos conhecidos (intencionais):** tarefas/tema não aparecem em outro dispositivo porque a Fase 4 é **push-only** (pull é Fase 5); tema/cfg sincronizam **para cima** (`user_settings`) mas não **para baixo**; a fila é vinculada à conta dona — entrando com outra conta, o indicador fica “pausada” até o dono voltar (ponto do teste 8; confirmar com `window.__sync.getState()` se o teste 6 usou outra conta).
- **Incidente Supabase (22–23/10/2026, “Elevated Mgmt API Error Rates in Multiple Regions”):** afeta a **Management API** (painel/Studio, operações de projeto, pagamentos), **separada** da API de dados (PostgREST) e do Auth. Sem evidência de impacto nos upserts/login do Ateliê (os testes acima passaram). A lentidão do teste 6 não pôde ser atribuída ao incidente (sem evidência); detalhes oficiais não totalmente legíveis (página renderizada por JS) — incerteza registrada. Nenhuma mudança de infraestrutura necessária por causa do aviso.
- **Status:** **Concluída (encerrada em 2026-10-25).**

## Fase 5 — Pull, merge e conflitos

> **Em implementação** — Etapa 1 (merge) e Etapa 2 (pull) concluídas no código; validação real pendente.

- **Objetivo:** baixar e reconciliar os dados da conta em outros dispositivos, mantendo o push (Fase 4) intacto.
- **Arquitetura:** `sync.js` ganha `pull()` (cursor incremental por tabela + poll ~30s + eventos) e ativação inicial; novo `merge.js` (mapeamento reverso + políticas); `import-data.js` ganha `fromRow` (remoto→local).

### Pull inicial seguro (nunca descarta dados)
- **Nunca substituir indiscriminadamente.** Regra geral é **merge**: uma linha remota é aplicada só se (a) não existe local com aquele id, ou (b) o remoto vence no LWW. Entidade local sem correspondente remoto é **mantida e enfileirada para push** — jamais descartada.
- **Gate de segurança:** o pull inicial só roda com a **outbox vazia** (flush totalmente bem-sucedido). Flush parcial/falha → pull inicial **adiado** para o próximo ciclo; nada é descartado.
- **Único caso de substituição (seed de demonstração):** `seed()` passará a gravar um marcador **nonce** `S._seedId` (criado só no seed; nunca em `migrate()` nem em dados do usuário). Um dispositivo é tratado como seed intacto **somente se**: `S._seedId` existe e bate com `atelier_sync_seedId` registrado no dispositivo **e** a forma do conteúdo é a do seed original (1 tarefa “Bloco A: prospecção ativa”, projeto `p1` “Prospecção internacional”, meta `g1` “2-3 clientes recorrentes”, e **zero** contatos/clientes/vagas/workLogs). Coincidência de contagem **não** dispara substituição; qualquer edição real (título ou item novo) quebra a forma e cai no merge seguro.
- **Interrupção/pull parcial:** o pull aplica por tabela e **só avança o cursor depois de aplicar todas as linhas da tabela e gravar `save()` com sucesso**. Interrompido no meio → o cursor daquela tabela não avança → as mesmas linhas são re-buscadas e re-aplicadas (LWW/união idempotentes). O `seen` só é gravado ao final; até lá o pull inicial pode ser re-executado do zero com segurança.
- **Registros não reconciliados:** nunca apagamos entidades locais sem um tombstone mais novo; registros não confirmados permanecem em `S` e na outbox até serem enviados e re-confirmados.

### LWW determinístico e relógios divergentes
- **Regra:** vence o maior `client_updated_at` (epoch ms gravado pelo dispositivo no momento da edição). **Empate** → maior `updated_at` do servidor. **Empate final** → vence o remoto (servidor é o ponto de convergência). Função pura/determinística — não depende de hora de chegada nem da ordem de rede.
- **O que `client_updated_at` NÃO é:** não é a ordem real das edições quando os relógios divergem — um dispositivo adiantado vence um atrasado mesmo editando depois. **Não usamos `updated_at` do servidor como ordem real** (ele reflete a chegada da escrita, não o momento da edição); serve só de desempate.
- **Limitações aceitas:** relógio enviesado pode inverter a vitória em campos escalares. A **união de histórico** (logs/subs/interactions) protege a parte append-only, a mais provável de ser editada em paralelo. Para app pessoal, risco baixo. Mitigação futura (não agora): carimbar a edição no servidor.

### Merge de conteúdo
- LWW por entidade para campos escalares.
- **União por id/at** para `tasks.logs`/`tasks.subs` e `contacts.interactions`/`applications.interactions`/`applications.stage_history` — histórico não se perde e não duplica (dedupe por id; no mesmo id, vence o da versão mais nova).
- Derivados (`spent`, contadores) recalculados localmente; não são fonte de verdade.
- **Tombstone:** ver subseção própria abaixo.

### Exclusão e restauração (tombstone × restore)
- **Toda mutação carrega um timestamp:** criação/edição usa `updatedAt`; exclusão usa o `ts` do tombstone (vira `client_updated_at` e `deleted_at`); restauração usa um `updatedAt` novo e `deleted_at = null`. Deleção é um **estado**, não um caso especial.
- **Regra determinística:** entre local e remoto, vence o **maior `client_updated_at`** para decidir `deleted_at` (e os demais campos). Empate → `updated_at` do servidor → remoto.
- **Ordem de chegada é irrelevante:** cada estado carrega seu próprio timestamp e comparamos por timestamp (não por chegada), então tombstone e restauração fora de ordem convergem para o mesmo vencedor.
- **Ciclo pull→push:** o ciclo passa a ser **pull primeiro, depois flush**. Ao puxar, o merge já reconcilia o `deleted_at` (LWW). Assim o flush nunca empurra um tombstone/restauração **obsoleto**: se o remoto é mais novo, o pull o traz de volta (ou o remove) e o diff do `seen` corrige a op (tombstone vira upsert, ou vice-versa) antes de enviar — sem ressuscitar um registro mais novo excluído, nem re-excluir um mais novo restaurado.

### Colisões em `work_logs`
- `work_logs` é um **resumo diário** (snapshot por `task_id`+`date`), não um contador aditivo. O índice único `uq_work_logs_task_date (user_id, task_id, date) where task_id is not null` reflete isso: dois registros para a mesma tarefa+data são **duas versões do mesmo resumo**, não dois trabalhos distintos.
- **Política: deduplicar por `(task_id, date)` mantendo o mais novo** (LWW por `client_updated_at`, empate `updated_at`, empate remoto). **Nunca somar** `text`/`ts`/campos.
- **ID determinístico (preventivo):** `work_logs` novos passam a ter `id` estável derivado de `(task_id, date)` (ex.: `wl_<taskId>_<date>`); órfãos (`task_id` nulo) mantêm id aleatório. Dois dispositivos produzem o **mesmo id** para o mesmo resumo → `upsert` por `(user_id,id)` substitui; o 23505 deixa de ocorrer para registros novos.
- **No pull:** aplicar um `work_log` remoto com mesmo `(task_id, date)` de um local → substitui o local só se o remoto for mais novo; senão ignora. Resultado: no máximo um `work_log` local por `(task_id, date)`.
- **No push:** coalescer os locais por `(task_id, date)` mantendo o mais novo e normalizando o id determinístico (migra ids antigos).
- **`task_id` nulo (órfão):** fora do índice único; LWW por id normalmente.
- **Reconciliação reativa de 23505 (sem loop, sem perda silenciosa):** o fallback atual **não** resolve o 23505 — só mantém a op em backoff e repete para sempre. A Fase 5 adiciona um caminho dedicado para `work_logs`: ao receber 23505, busca a linha remota com o mesmo `(task_id, date)`, compara por LWW e (a) se o local for mais novo, re-upserta o conteúdo local **com o id determinístico** (vira uma linha só) — op resolvida; (b) se o remoto for mais novo/igual, **descarta a op local e aplica o remoto** (marca `seen`/`flushed`), sem retry. Em ambos, a op sai da outbox (sem loop) e **o conteúdo mais novo é sempre preservado**; o mais antigo é a versão anterior do mesmo resumo, não trabalho independente.

### Preferências (`user_settings`)
- LWW no `data` (tema incluído); ao aplicar, preserva `lastBackupAt`/`backupReminderDismissedAt` locais.

### Cursor, isolamento e anti-loop
- Cursor por tabela (`updated_at` do servidor), sobreposição de 1s, apply idempotente; cursor por conta (`atelier_sync_cursors`).
- Pull só quando online + autenticado + `owner == uid`; troca de conta não baixa dados de outra conta.
- Anti-loop: após aplicar, atualiza `seen` (hashes = estado final, `flushed=true`) e usa `updatedAt = client_updated_at` — o diff do `save()` não reenfileira o que veio do servidor.
- **Ordem do ciclo:** pull → merge → flush (nunca empurra estado que o pull já provou ser obsoleto).

- **Arquivos:** `merge.js` (mapeamento reverso `fromRow` + LWW/união/tombstone/dedupe de `work_logs`), `sync.js` (pull com cursor, ativação inicial, anti-loop, id determinístico + reconciliação 23505 de `work_logs`), `estado.js` (`_seedId` no seed), `index.html`/`service-worker.js` (carregar/precache, `CACHE_VERSION` v24). Testes: `_sync_merge_test.js`, `_sync_pull_test.js`.
- **Decisões a aprovar (1–7):** (1) pull inicial por **merge** (nunca substituir), com substituição apenas do **seed marcado** (`_seedId` + forma intacta); (2) **LWW determinístico** `client_updated_at` → `updated_at` → remoto, com ciclo **pull→push**; (3) **exclusão/restauração** como estados com `client_updated_at` (vence o maior; sem ressuscitar/re-excluir fora de ordem); (4) **união de histórico** (`logs`/`subs`/`interactions`/`stage_history`) por id/at; (5) **`work_logs`** por id determinístico `(task_id, date)` + dedupe LWW **sem somar** + reconciliação reativa de 23505; (6) **cursor** por tabela (`updated_at`, sobreposição 1s, por conta) + poll 30s/eventos; (7) **`user_settings`** LWW com campos locais preservados.
- **Riscos:** loop de sync (anti-loop + id determinístico de `work_logs`); relógio dos dispositivos (LWW determinístico, tolerância pessoal); colisão de `work_logs` (id determinístico + reconciliação de 23505); conflito na mesma tarefa (LWW por entidade, logs protegidos por união).
- **Concluído quando:** os 10 cenários de aceitação passarem (simulados + validação real na conta de teste com dois dispositivos) e as suítes das Fases 3–4 continuarem verdes.
- **Testes executados (simulados):** `_sync_merge_test.js` (**20/20**) e `_sync_pull_test.js` (**10/10**) + `node --check` + suítes existentes (12 suítes verdes).
- **Status:** **Etapas 1–2 implementadas** (merge + pull) + **correção de propriedade** (reatribuição de conta). **Pendente:** validação real no Supabase (dois dispositivos, cenários 1–10) e eventuais ajustes de UI (estado “baixando” no pill).
- **Correção de propriedade (2026-10-25/26):** `atelier_sync_owner` era “write-once” e travava em “Sync pausado” ao trocar de conta. Agora: outbox vazia + owner diferente → **adota o novo UID** (reseta `seen`/`settings_cu`/`seed`, sem tocar em `S` nem na outbox); outbox pendente + owner diferente → **pausa preservada** (`paused-account`) sem envio cruzado. **Escape hatch:** ação “Descartar fila pendente e usar esta conta” (`clearSyncQueue`, com confirmação) remove outbox/owner/`seen`/`settings_cu`/`seed` (sem tocar em `S` nem no remoto) e retoma a sync para a conta atual. Cursores já são por-conta (isolados por uid). Teste: `_sync_owner_test.js` (23/23).
- **Reset local controlado (2026-10-26):** ação “Restaurar dados da conta” (`resetLocalData`, com confirmação) descarta o `S` local (volta a `seed()`), limpa outbox/`seen`/cursores/`settings_cu`/`seed` (preserva autenticação, `owner` e `deviceId`) e **executa o pull diretamente sob o lock** (pull inicial com seed → substituição). **Não altera o Supabase.** Robustez: `fetchRows` com timeout de 20s (busca travada não segura mais o lock), `pullOnce` agenda retry (30s) em falha e retorna `false` para o `syncCycle` não mascarar o erro com “Sincronizado”. Teste: `_sync_reset_test.js` (15/15).
- **Tema e accent locais por dispositivo (estabilização, 2026-10-26):** `cfg.theme` e `cfg.accentColor` deixaram de ser sincronizados — excluídos do payload (`cfgForImport`), preservados no pull/merge (`applyUserSettings`) e no reset (`resetLocalData`). Mudá-los **não** gera operação nem escrita remota; as demais configurações (`usdRate`, densidade, energia, XP pool, comandos etc.) continuam sincronizando. Teste: `_theme_local_test.js` (8/8).

## Fase 6 — Timer sincronizado

- **Objetivo:** sessão ativa única por conta, retomável em outro dispositivo.
- **Arquivos prováveis:** `logica.js` (start/pause/resume/stop/advancePhase), `sync.js` (`active_timer`), `interface.js`/`app.js` (adoção e aviso discreto).
- **Concluído quando:** iniciar em A e abrir B retoma corretamente; pausa/retomada refletem; offline funciona; parar grava minutos em `tasks.logs` e limpa o timer; conflito resolve por LWW sem log duplicado.
- **Testes:** dois dispositivos simulados, timer offline, pausa/retomada, troca de fase, parada.
- **Fora de escopo:** push notifications.

## Fase 7 — Indicador de sincronização e modo de erro

- **Objetivo:** mostrar de forma discreta e honesta: sincronizado, sincronizando, offline, pendente, erro — sem conflitar com os estados locais da 4C.
- **Arquivos prováveis:** `app.js` (mapeamento dos estados), `interface.js`/`componentes.css` (pill existente), `sync.js` (eventos).
- **Concluído quando:** cada estado é distinguível; falha de sync não aparece como “sincronizado”; bloqueio local (4A) tem precedência; nada de tela nova.
- **Testes:** simulação de cada estado; regressão visual nos temas/mobile.

## Fase 8 — Validação final, feature flag e ativação

- **Objetivo:** ligar a sincronização com segurança e validar em uso real controlado.
- **Arquivos prováveis:** `sync.js`/`app.js` (flag local `atelier_sync_enabled`, desligada por padrão), documentação.
- **Conteúdo:** migração de ensaio com o backup real (em usuário de teste), checklist de aceitação, rollback documentado.
- **Concluído quando:** checklist de `docs/TEST-CHECKLIST.md` aplicável + critérios abaixo passam; flag pode ser desligada a qualquer momento.
- **Rollback:** flag off; app volta ao modo local; JSON externo preservado; dados remotos de teste podem ser apagados.

## Critérios objetivos de aceitação da migração

- Contagens por entidade conferem entre JSON e banco (tasks, projects, clients, contacts, applications, skills, goals, labels, areas, work_logs).
- Nenhuma FK não nula aponta para registro inexistente; FKs vazias viraram `NULL`.
- `sum(logs[].minutes)` = `spent` por tarefa; amostras de `projectEarnings` conferem.
- Tarefas com `doneAt` nulo continuam nulas (nenhuma data inventada).
- Datas convertidas corretamente (`date`, `time`, `timestamptz`).
- Importação executada duas vezes mantém as mesmas contagens (idempotência).
- RLS: usuário A não acessa dados de B; tentativa de forjar `user_id` falha.
- Fila offline: alterações feitas sem rede são aplicadas ao reconectar, sem duplicar.
- Conflito controlado: dois dispositivos convergem; logs append-only não somem.
- Exclusão em um dispositivo não ressuscita no outro (tombstone).
- App funciona offline e com sync desligado.

## Futuro (não faz parte da v1)

- Sincronizar a lixeira (`trash` table) — a base de tombstones já cobre as exclusões.
- Supabase Realtime para substituir o polling.
- Push notifications de timer/lembretes.
- Supabase Storage para logo (se o data URI crescer).
- Ledger de XP por eventos (evitar perda de XP em concorrência).
- PIN/trava local opcional.

## Próximo passo concreto

**Aprovar a proposta da Fase 5** (decisões 1–6 acima) e, após aprovação, implementar pull + merge + testes isolados (`_sync_merge_test.js`, `_sync_pull_test.js`). A validação real com dois dispositivos na conta de teste fica para depois da implementação.
