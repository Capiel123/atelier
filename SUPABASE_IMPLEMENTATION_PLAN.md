# Ateliê — Plano de implementação da sincronização com Supabase

> **Status:** Fases 0, 1, 2 e 2.5 concluídas; Fase 3 (importação inicial) implementada e testada com dados fictícios, com importação real pendente de conta de teste. Sincronização contínua ainda não iniciada; o app continua local.
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
- **Testes executados:** `_import_mapping_test.js` (26/26) com cliente simulado + `node --check` + suítes existentes.
- **Pendente:** importação real com **conta de teste e dados controlados** (backup JSON atualizado), seguida de `verify()` e comparação de contagens; depois, autorização para dados reais.
- **Status:** **Preparada e testada com dados fictícios; NÃO executada com dados reais.**
- **Critério de reversão:** backup JSON intacto; dados remotos do usuário de teste podem ser apagados sem afetar o app.

## Fase 4 — Outbox e envio (push)

- **Objetivo:** toda mudança local entra numa fila persistente e é enviada quando online/autenticado.
- **Arquivos prováveis:** novo `sync.js` (outbox, coalescência, flush, retry), gancho em `estado.js`/`app.js` após `save()`.
- **Conteúdo:** chaves `atelier_sync_outbox`, `atelier_sync_device_id`; `upsert` idempotente; tombstones; ordem de dependências; backoff; pausa offline/auth.
- **Concluído quando:** alterações offline ficam na fila e são enviadas na reconexão; reenvio não duplica; falhas não descartam itens; fila sobrevive a reload.
- **Testes (futuros, isolados):** fila com falha simulada, retry, coalescência, ordem, idempotência.
- **Não fazer:** ainda sem pull; o app não deve receber dados remotos.

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

**Validar o onboarding no navegador** (desktop e celular, temas) e marcar a Fase 2.5 como concluída. Em seguida, iniciar a **Fase 3 — camada de dados + importação**, a partir de um backup JSON externo, com importação idempotente e validação de contagens, relações e datas nulas.
