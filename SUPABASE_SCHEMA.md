# Ateliê — Schema do Supabase (desenvolvimento)

> **Status:** schema e RLS **aplicados e validados** em um projeto Supabase de desenvolvimento (2026-10-24). Detalhes e limitações na seção 6.
> **Relacionados:** `SUPABASE_DATA_MAPPING.md` (modelo de dados), `SUPABASE_ARCHITECTURE.md` (decisões), `SUPABASE_IMPLEMENTATION_PLAN.md` (etapas).

## 1. Arquivos de migração (ordem de execução)

| Ordem | Arquivo | Conteúdo |
|---|---|---|
| 1 | `supabase/migrations/0001_schema.sql` | Tabelas, PKs, FKs compostas, índices, checks, trigger `set_server_updated_at`, comentários. |
| 2 | `supabase/migrations/0002_rls.sql` | Habilita RLS e cria as políticas por operação. |

Aplicar sempre em ordem. As migrações usam `if not exists`, `or replace` e `drop ... if exists` para serem reexecutáveis sem duplicar.

## 2. Convenções do schema

- **PK composta** `(user_id, id)` nas entidades; `user_id uuid not null default auth.uid() references auth.users(id) on delete cascade`.
- **Colunas de sincronização** presentes em todas as tabelas:
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()` — mantido por trigger (cursor de pull).
  - `client_updated_at bigint not null default 0` — epoch ms do app (Last-Write-Wins).
- **`deleted_at timestamptz`** (tombstone) apenas onde há exclusão: `tasks`, `projects`, `clients`, `contacts`, `applications`, `skills`, `goals`.
- **FKs compostas** `(user_id, parent_id)` para impedir referência entre usuários; `on delete no action` porque o modelo usa tombstones e nunca apaga fisicamente os pais.
- **`work_logs` sem FK** (histórico sobrevive à exclusão de tarefa/projeto); `task_id`/`project_id` são `text` opcionais.
- **`active_timer`** tem `user_id` como PK → no máximo uma linha por usuário; `task_id = null` representa “sem timer ativo”.

## 3. Tabelas e campos

### 3.1 `user_settings`
`user_id` (PK) · `data jsonb` · `updated_at` · `client_updated_at`
Armazena `cfg` (tema, accent, timers, taxas, moeda, densidade, seções, reviewChecks, weekPriority, logo), `energy`, `xpPool`, `commands`. Exceções **locais**: `cfg.lastBackupAt`, `cfg.backupReminderDismissedAt`.

### 3.2 `clients`
`user_id` · `id` · `name` · `notes` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`

### 3.3 `projects`
`user_id` · `id` · `name` · `area` · `due_date` · `reward` · `claimed` · `archived` · `client_id` · `legacy_client` · `billing_type` (check `none|fixed|hourly|minute`) · `billing_value` · `actual_value` · `completed_at` · `manual_hours` · `currency` · `goals jsonb` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`
FK composta `(user_id, client_id) → clients(user_id, id)`. Índice `(user_id, client_id)`.

### 3.4 `tasks`
`user_id` · `id` · `title` · `description` · `priority` (0–2) · `estimate_minutes` · `spent_minutes` (derivado) · `day` (0–6 ou null) · `sort_order` · `is_next` · `done` · `done_at` (pode ser null) · `area` · `skills text[]` · `project_id` · `due_date` · `due_time` · `section` · `subs jsonb` · `logs jsonb` · `xp_claimed` · `type` · `color` · `labels text[]` · `postponed_count` · `last_postponed_at` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`
FK composta `(user_id, project_id) → projects(user_id, id)`. Índices `(user_id, project_id)`, `(user_id, day)`.

### 3.5 `contacts`
`user_id` · `id` · `name` · `type` (`pro|personal`) · `category` · `where_` (o campo local `where` vira `where_`, palavra reservada) · `url` · `role` · `context` · `interests` · `notes` · `priority` · `last_contact` · `next_contact` · `next_action` · `cadence` · `archived` · `last_conversation` · `waiting_for` · `waiting_since` · `tags text[]` · `birthday` · `important_dates jsonb` · `snoozed_until` · `snooze_reason` · `interactions jsonb` · `sent_count` · `received_count` · `client_id` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`
FK composta `(user_id, client_id) → clients(user_id, id)`.

### 3.6 `applications`
`user_id` · `id` · `client` · `role` · `url` · `contact_name` · `contact_info` · `platform` · `area` · `subarea` · `ticket` · `priority` · `notes` · `stage` · `stage_history jsonb` · `found_at` · `applied_at` · `first_response_at` · `next_follow_up` · `last_interaction_at` · `linked_task_id` · `project_id` · `interactions jsonb` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`
FKs compostas `(user_id, project_id) → projects`, `(user_id, linked_task_id) → tasks`.

### 3.7 `skills`
`user_id` · `id` · `name` · `color` · `archived` · `xp` · `sort_order` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`

### 3.8 `goals`
`user_id` · `id` · `title` · `progress` (0–100) · `due_date` · `deleted_at` · `created_at` · `updated_at` · `client_updated_at`

### 3.9 `labels`
`user_id` · `id` · `name` · `color` · `sort_order` · `created_at` · `updated_at` · `client_updated_at`

### 3.10 `areas`
`user_id` · `id` · `name` · `color` · `archived` · `sort_order` · `created_at` · `updated_at` · `client_updated_at`

### 3.11 `work_logs`
`user_id` · `id` · `date` · `ts` · `task_id` (opcional) · `task_title` · `project_id` (opcional) · `project_name` · `area` · `text` · `created_at` · `updated_at` · `client_updated_at`
Índice `(user_id, date)`; índice **único parcial** `(user_id, task_id, date) where task_id is not null`.

### 3.12 `active_timer`
`user_id` (PK) · `task_id` · `sub_id` · `started_at` · `accumulated_seconds` · `paused` · `target_min` · `phase` · `focus_min` · `rest_min` · `cycle_count` · `device_id` · `updated_at` · `client_updated_at`

## 4. Políticas RLS

Todas as 12 tabelas têm RLS habilitado e quatro políticas por operação:

- `select`: `using (auth.uid() = user_id)`
- `insert`: `with check (auth.uid() = user_id)`
- `update`: `using (auth.uid() = user_id) with check (auth.uid() = user_id)`
- `delete`: `using (auth.uid() = user_id)`

O papel `anon` não recebe política → acesso negado por padrão. A chave `service_role` **não** deve ser usada no navegador; a autorização é o RLS + `auth.uid()`.

## 5. Como executar os testes

Veja `supabase/tests/README.md` e `supabase/tests/001_schema_rls_test.sql`. Resumo:

1. Criar/ter um projeto Supabase **de desenvolvimento**.
2. Aplicar `0001_schema.sql` e `0002_rls.sql`.
3. Executar `001_schema_rls_test.sql` no SQL editor (como postgres/service role).
4. Esperado: `NOTICE: OK: ...` para cada bloco e, ao final, `TESTE CONCLUÍDO`.

## 6. Resultado da validação (Fase 1)

- Em **2026-10-24**, as migrações foram aplicadas manualmente em um projeto Supabase **de desenvolvimento** e o teste `supabase/tests/001_schema_rls_test.sql` foi executado no SQL Editor.
- **Resultado:** `TESTE CONCLUÍDO — todos os blocos passaram` (todos os blocos `OK`).
- **Validado:** existência das 12 tabelas; RLS habilitado; 48 políticas com nome/operação/expressões (`auth.uid() = user_id`); PKs compostas e PKs de `user_settings`/`active_timer`; FKs compostas; índice único de `work_logs`; isolamento de leitura, UPDATE e DELETE entre dois usuários; bloqueio de INSERT com `user_id` alheio; FK composta impedindo vínculo entre usuários; uma sessão de timer por usuário; nulos legítimos preservados; permissões da role `authenticated` (controle positivo).
- **Cobertura comportamental:** 8 tabelas (`clients`, `projects`, `tasks`, `contacts`, `applications`, `work_logs`, `user_settings`, `active_timer`). `skills`, `goals`, `labels` e `areas` foram verificadas **apenas estruturalmente** (existência, RLS e políticas), não com leitura/escrita.
- **Usuários de teste:** `teste-a@exemplo.com` e `teste-b@exemplo.com`, criados manualmente em Authentication → Users. O `ROLLBACK` do teste desfaz os dados, mas **não remove** esses usuários.
- **Limitação:** a validação cobre o banco/RLS; **não** cobre a integração do aplicativo nem a sincronização (fases seguintes).

## 7. Reversão (ambiente de desenvolvimento)

- As migrações são reexecutáveis (`if not exists`/`or replace`/`drop if exists`); não contêm `drop table` nem operações destrutivas.
- Para recomeçar do zero em dev: `supabase db reset` (recria o schema local/remoto a partir das migrações) ou apagar as tabelas do usuário de teste.
- Nada é apagado dos dados reais do Ateliê (que continuam em `localStorage`).

## 8. Decisões técnicas registradas

- `contacts.where` → coluna `where_` (evitar palavra reservada do SQL).
- `deleted_at` presente apenas onde há exclusão (tasks, projects, clients, contacts, applications, skills, goals); `labels`/`areas` usam `archived`/sem exclusão.
- `work_logs` sem FK (preservar histórico após exclusão).
- `active_timer` com PK `user_id` (uma sessão por usuário), linha persistente onde `task_id = null` indica “sem timer”.
- Índices mínimos voltados a consultas/sincronização: `tasks(user_id, project_id)`, `tasks(user_id, day)`, `projects(user_id, client_id)`, `contacts(user_id, client_id)`, `applications(user_id, project_id)`, `applications(user_id, linked_task_id)`, `work_logs(user_id, date)` e único parcial em `work_logs`.
