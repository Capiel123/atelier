# Ateliê — Plano de implementação da sincronização com Supabase

> **Status:** Fases 0–3 concluídas e validadas; Fase 4 (outbox/push) **implementada e testada em simulação** (`_sync_outbox_test.js` 20/20), com **validação real no Supabase pendente** (conta de teste). Pull/merge/conflitos/timer ficam para as Fases 5/6.
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
- **Testes:** `_sync_outbox_test.js` (**20/20**, cliente simulado) + `node --check` + suítes existentes.
- **Status:** **Implementada; validação real no Supabase pendente** (editar offline → reconectar → conferir; exclusão → tombstone; recarga com fila; isolamento entre contas).

## Fase 5 — Pull, merge e conflitos

- **Objetivo:** receber mudanças de outro dispositivo e aplicá-las com a política definida.
- **Arquivos prováveis:** `sync.js` (cursor, polling, apply), `merge.js` (LWW + união de logs/subs/interactions).
- **Conteúdo:** `server_updated_at` como cursor; LWW por `updated_at` + `device_id`; merge append-only; tombstones; atualização de `S` + `save()` + `render()`.
- **Concluído quando:** dois dispositivos simulados convergem; logs de tempo não se perdem em conflito; exclusão em A remove em B; restauração vence tombstone.
- **Testes:** cenários de conflito (mesma tarefa, logs diferentes, delete/update concorrentes), cursor sem lacunas, pull incremental.
- **Risco principal:** relógio do dispositivo; mitigado por desempate e merge append-only.

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

**Validar a Fase 4 no navegador com a conta de teste** (editar offline → reconectar → conferir; excluir → tombstone; recarregar com fila pendente; trocar de conta → pausado) e então seguir para a **Fase 5 — pull/merge**, somente após aprovação.
