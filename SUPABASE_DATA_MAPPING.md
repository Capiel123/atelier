# Ateliê — Mapeamento de dados para o Supabase

> **Status:** mapeamento de planejamento + mecanismo de importação inicial implementado em `import-data.js` (Fase 3). A sincronização contínua ainda não existe; o app continua usando `localStorage['atelier']` como fonte local.
> **Fonte de verdade:** código atual (`estado.js`, `logica.js`) e o relatório de auditoria de persistência. Campos marcados como “aparente” derivam da leitura das fábricas e do `migrate()`.
> **Data:** 2026-10-24 · **Versão do estado local:** `v = 15.9`

## 1. Estado local atual

O app persiste um único objeto `S` em `localStorage['atelier']`. O objeto contém coleções de primeiro nível, configurações, estado de UI persistido e metadados. `migrate()` normaliza dados antigos e é idempotente.

## 2. Entidades e campos

| Entidade / coleção | Campos (tipos aparentes) | Observações |
|---|---|---|
| `tasks` | `id` text, `t` text, `desc` text, `pr` 0–2, `est` min, `spent` min (derivado), `day` 0–6 ou `null`, `order` int, `next` bool, `done` bool, `doneAt` ms ou `null`, `area` text, `skills[]` IDs, `proj` ID ou `''`, `due` `YYYY-MM-DD`, `time` `HH:MM`, `section` `work`/`commitment`/`personal`/`''`, `subs[]`, `logs[]`, `xpClaimed` bool, `type` text, `color` text, `labels[]` IDs, `createdAt`/`updatedAt` ms, `postponedCount` int, `lastPostponedAt` ms | Tarefas são hard delete no app. Sem `deletedAt` local. |
| `tasks.subs[]` | `id`, `t`, `d` bool, `xpClaimed` bool, `est` min, `order` int, `logs[]` | Aninhado dentro da tarefa. |
| `tasks.logs[]` | `id`, `minutes` num, `start`/`end` ms ou `null`, `subId` ID ou `null`, `note` text | Logs migrados de v1 podem ter `start`/`end` nulos. Fonte do tempo. |
| `projects` | `id`, `n`, `area`, `due`, `reward`, `claimed` bool, `archived` bool, `clientId`, `client` text (legado), `billingType` `none`/`fixed`/`hourly`/`minute`, `billingValue` num, `actualValue` num/null, `completedAt` ms/null, `manualHours` num/null, `currency` text, `goals[]`, `deletedAt`, `createdAt`/`updatedAt` | `completedAt` pode ser automático. |
| `projects.goals[]` | `id`, `t`, `d` bool, `order` int | Etapas independentes de tarefas. |
| `clients` | `id`, `n`, `notes`, `createdAt`, `updatedAt`, `deletedAt` | Soft delete. |
| `contacts` | `id`, `n`, `type` `pro`/`personal`, `cat`, `where`, `url`, `role`, `context`, `interests`, `notes`, `priority` int, `lastContact` data, `nextContact` data, `nextAction`, `cadence` int, `archived` bool, `lastConversation`, `waitingFor` bool, `waitingSince` ms, `tags[]`, `birthday` text (`MM-DD` ou `AAAA-MM-DD`), `importantDates[]`, `snoozedUntil` data, `snoozeReason`, `interactions[]`, `sentCount` int, `receivedCount` int, `clientId`/null, `deletedAt`, `createdAt`/`updatedAt` | `interactions[]` = `{at, type, direction, outcome, note}` (máx. 100); contadores derivados. |
| `applications` | `id`, `client`, `role`, `url`, `contactName`, `contactInfo`, `platform`, `area`, `subarea`, `ticket` num, `priority` int, `notes`, `stage`, `stageHistory[]`, `foundAt` ms, `appliedAt` ms/null, `firstResponseAt` ms/null, `nextFollowUp` data, `lastInteractionAt` ms/null, `linkedTaskId`/null, `projectId`/null, `interactions[]`, `deletedAt`, `createdAt`/`updatedAt` | `stageHistory[]` = `{stage, at}`; `interactions[]` = `{at, note}`. |
| `skills` | `id`, `n`, `color`, `archived` bool, `xp` num, `order` int, `deletedAt`, `createdAt`/`updatedAt` | XP absoluto por habilidade. |
| `goals` | `id`, `t`, `p` 0–100, `due`, `deletedAt`, `createdAt`/`updatedAt` | Metas independentes. |
| `labels` | `id`, `n`, `color`, `order` | Sem timestamps. Referenciada por `tasks.labels[]`. |
| `areas` | `id`, `n`, `color`, `archived` bool, `order` int, `updatedAt` | `tasks.area` usa id/nome. |
| `commands` | `id`, `n`, `cat`, `cmd`, `example`, `order` int, `updatedAt` | Biblioteca editável; sem relações. |
| `workLogs` | `id`, `date` `YYYY-MM-DD`, `ts` ms, `taskId`, `taskTitle` (snapshot), `projId`, `projName` (snapshot), `area`, `text` | Um por `taskId + date`; snapshots sobrevivem à exclusão da tarefa/projeto. |
| `cfg` | `focus`, `brk`, `cap`, `logo` data URI/null, `notif` bool, `autoPriority` bool, `reviewChecks` obj, `weekPriority` obj, `theme`, `accentColor`/null, `focusDurations[]`, `defaultFocus`, `usdRate`, `eurRate`, `currency`, `primaryCurrency`, `lastBackupAt` ms/null, `backupReminderDismissedAt` ms, `focusNoStop` bool, `taskDensity`, `sectionsCollapsed` obj | Preferências e estado de UI persistido. |
| `energy` | `{ 'YYYY-MM-DD': { morning, afternoon, evening } }` | Níveis por data. |
| `timer` | `taskId`, `subId`, `startedAt` ms/null, `accumulated` seg, `paused` bool, `targetMin`, `phase`, `focusMin`, `restMin`, `cycleCount` | Sessão ativa; específica de dispositivo. |
| `trash` | `[{ id, task (snapshot), deletedAt }]` | Lixeira local de tarefas, limite 200. |
| `xpPool` | num | XP sem habilidade. |
| `lastModified` | ms | Timestamp da última gravação. |
| `v` | num | Versão do esquema local. |

## 3. IDs, datas, exclusão e derivados

- **IDs:** `uid()` = 8 caracteres base36 aleatórios (`Math.random`), **não UUID**. IDs fixos: labels `l_easy`, `l_quick`, `l_creative`, `l_admin`, `l_deep`, `l_comm`, `l_learn`, `l_maint`; áreas `Carreira`, `Autoral`, `Negócio`, `Ponte`, `Trabalho`, `Pessoal`.
- **Referências:** `task.proj` → `projects.id`; `task.skills[]` → `skills.id`; `task.labels[]` → `labels.id`; `task.area` → `areas.id` (ou nome); `log.subId` → `sub.id`; `project.clientId` → `clients.id`; `contact.clientId` → `clients.id`; `application.projectId` → `projects.id`; `application.linkedTaskId` → `tasks.id`; `workLog.taskId`/`projId` → IDs (com snapshots).
- **Datas:** mistura de `YYYY-MM-DD` (`due`, `nextContact`, `workLog.date`, `snoozedUntil`), `HH:MM` (`time`) e epoch ms (`doneAt`, `createdAt`, `updatedAt`, `ts`, `interaction.at`, `lastModified`). `doneAt` pode ser `null` (dados v1 — **não inventar data**).
- **Exclusão:** soft delete (`deletedAt`) em projects, clients, contacts, applications, skills, goals; tarefas são hard delete localmente; `workLogs` nunca são apagados automaticamente; `trash` guarda snapshots de tarefas removidas por “Limpar concluídas”.
- **Derivados:** `spent` = soma de `logs[].minutes`; `projectEarnings` calcula horas/valor/taxa (a partir de logs ou `manualHours`); `sentCount`/`receivedCount` derivam de `interactions`; `completedAt` pode ser automático; contadores de metas são calculados.

## 4. Classificação para a sincronização (v1)

| Entidade/campo | v1 | Observação |
|---|---|---|
| `tasks` (campos + `subs`/`logs` JSONB) | **Sincroniza** | `deleted_at` remoto funciona como tombstone, mesmo com hard delete local. |
| `projects` (+ `goals` JSONB) | **Sincroniza** | Soft delete já existe. |
| `clients`, `contacts`, `applications` | **Sincroniza** | Interações/histórico em JSONB. |
| `skills`, `goals`, `labels`, `areas` | **Sincroniza** | Labels/áreas são referenciadas por arrays/texto. |
| `workLogs` | **Sincroniza** | Tabela própria; snapshots preservados; sem exclusão. |
| `cfg` (tema, accent, timers, taxas, densidade, seções, reviewChecks, weekPriority, logo) | **Sincroniza** em `user_settings.data` | Exceções locais abaixo. |
| `cfg.lastBackupAt`, `cfg.backupReminderDismissedAt` | **Local-only** | Lembretes de backup são por dispositivo. |
| `energy`, `xpPool`, `commands` | **Sincroniza** em `user_settings.data` | Pequenos e não relacionais. |
| `logo` | **Sincroniza** em `user_settings.data.logo` | Limite flexível ~2 MB; compressão no cliente; Storage só se necessário. |
| `timer` | **Sincroniza** em `active_timer` (1 linha/conta) | Tratamento especial; ver arquitetura. |
| `trash` | **Local-only** na v1 | Sincronização futura sem reescrita (tabela própria). |
| `lastModified`, `v` | **Local-only** | Metadados de dispositivo/esquema. |
| Metadados de sync (fila, cursor, device_id) | **Local-only** | Chaves separadas do estado do app. |

## 5. Mapeamento local → remoto

### 5.1 `tasks` → `tasks`
`id→id`, `t→title`, `desc→description`, `pr→priority`, `est→estimate_minutes`, `spent→spent_minutes` (derivado), `day→day`, `order→sort_order`, `next→is_next`, `done→done`, `doneAt→done_at`, `area→area`, `skills→skills text[]`, `proj→project_id`, `due→due_date`, `time→due_time`, `section→section`, `subs→subs jsonb`, `logs→logs jsonb`, `xpClaimed→xp_claimed`, `type→type`, `color→color`, `labels→labels text[]`, `createdAt→created_at`, `updatedAt→updated_at`, `postponedCount→postponed_count`, `lastPostponedAt→last_postponed_at`. Novo: `user_id`, `deleted_at` (tombstone).

### 5.2 `projects` → `projects`
`id→id`, `n→name`, `area→area`, `due→due_date`, `reward→reward`, `claimed→claimed`, `archived→archived`, `clientId→client_id`, `client→legacy_client`, `billingType→billing_type`, `billingValue→billing_value`, `actualValue→actual_value`, `completedAt→completed_at`, `manualHours→manual_hours`, `currency→currency`, `goals→goals jsonb`, `deletedAt→deleted_at`, `createdAt/updatedAt→created_at/updated_at`.

### 5.3 Demais tabelas
- `clients`: `n→name`, `notes`, timestamps, `deletedAt→deleted_at`.
- `contacts`: nomes de campos em snake_case; `cat→category`; `where→where_` (palavra reservada do SQL); `tags→tags text[]`; `importantDates→important_dates jsonb`; `interactions→interactions jsonb`; `sentCount/receivedCount→sent_count/received_count` (derivados); `clientId→client_id`.
- `applications`: `contactName→contact_name`, `contactInfo→contact_info`, `stageHistory→stage_history jsonb`, `linkedTaskId→linked_task_id`, `projectId→project_id`, `interactions→interactions jsonb`, demais em snake_case.
- `skills`, `goals`, `labels`, `areas`: campos diretos em snake_case.
- `workLogs` → `work_logs`: `date→date`, `ts→ts`, `taskId→task_id`, `taskTitle→task_title`, `projId→project_id`, `projName→project_name`, `text→text`.
- `cfg`/`energy`/`xpPool`/`commands` → `user_settings.data` (JSONB), com `updated_at`.
- `timer` → `active_timer` (`user_id` PK) com colunas explícitas.

**Colunas universais em todas as tabelas sincronizadas** (além dos campos mapeados acima): `user_id`, `created_at`, `updated_at` (mantido pelo servidor, usado como cursor de pull), `client_updated_at` (epoch ms do app, usado no Last-Write-Wins) e `deleted_at` apenas onde há exclusão.

## 6. Tratamentos especiais

1. **`doneAt = null`** (tarefas v1): preservar `null`; a UI já trata como “data desconhecida”. Nunca preencher com data atual.
2. **Strings vazias em FKs:** `proj: ''`, `clientId: ''`, `linkedTaskId: null` etc. → `NULL` no banco.
3. **Datas ausentes:** manter `NULL`; não inferir.
4. **Tarefas excluídas:** localmente somem; no remoto viram `deleted_at` (tombstone) para não reaparecerem em outro dispositivo. Restaurar da lixeira local = upsert com `deleted_at = null` e `updated_at` novo.
5. **`workLogs`:** não são apagados; `task_id` vira `NULL` se a tarefa for excluída, mantendo `task_title`/`project_name`.
6. **Arrays `skills`/`labels`:** sem FK (arrays); referências são mantidas por soft delete de skills/labels. Validação no cliente.
7. **`area`:** texto; FK opcional para `areas.id` (a app aceita área textual).
8. **Derivados:** `spent`, `sent_count`, `received_count`, `completed_at` não são fonte de verdade; recalcular no cliente (ou views futuras).
9. **`logo`:** data URI em `user_settings.data.logo`; limite flexível ~2 MB, compressão no cliente; Storage apenas se necessário.
10. **Timer:** uma única sessão ativa por conta; `active_timer` com uma linha por usuário; ao parar/concluir fase, os minutos entram em `tasks.logs` e o timer é limpo.
11. **Lixeira:** local na v1; futura tabela `trash` (`id`, `user_id`, `task jsonb`, `deleted_at`) sem reescrever o restante.

## 7. Hipóteses e pendências

- **Hipótese:** `contacts.importantDates[]` é uma lista de objetos com data/descrição; o formato exato não é validado no código. Preservar como JSONB sem transformar.
- **Hipótese:** `birthday` é `MM-DD` ou `AAAA-MM-DD`; manter `text` para não perder formatos parciais.
- **Pendência:** formato final do `logo` (data URI vs Storage) fica para a implementação; a v1 usa data URI comprimido.
- **Pendência:** sincronizar a lixeira no futuro (fora da v1).
- **Fora de escopo:** notificações push, colaboração em tempo real, PIN local.

## 8. Importação inicial (Fase 3 — implementada)

- **Mecanismo:** `import-data.js` (script clássico, sem build) lê o estado local `S` e faz `upsert` nas tabelas pela **sessão do usuário autenticado**. Não usa `service_role`; o RLS autoriza cada inserção (`auth.uid() = user_id`).
- **Ordem (dependências):** `user_settings` → `labels` → `areas` → `skills` → `clients` → `projects` → `tasks` → `contacts` → `applications` → `goals` → `work_logs`.
- **Conflito:** `upsert` com `onConflict: 'user_id'` em `user_settings` e `'user_id,id'` nas demais (idempotente por chave).
- **Conversões:** epoch ms → `timestamptz` (ISO); strings vazias em FKs/datas → `NULL` (`proj`, `clientId`, `linkedTaskId`, `due`, `time`, `lastContact`, `nextContact`, `snoozedUntil`, `nextFollowUp`…); `where` → `where_`; `spent_minutes` recalculado da soma de `logs[].minutes` (não copia o derivado); `doneAt = null` preservado.
- **`created_at`/`updated_at`:** deixados para o servidor (default `now()` / trigger); `client_updated_at` recebe `updatedAt` local (LWW). Registros sem `updatedAt` (labels) usam `0`.
- **Não importado nesta fase:** `timer`/`active_timer` (Fase 6), `trash` (local-only), `lastModified`/`v`.
- **Validação:** `verify()` compara contagens locais × remotas por tabela; `_import_mapping_test.js` cobre mapeamento, ordem, conversões, idempotência e o contrato de upsert com cliente simulado (26/26). Importação real ainda não executada.
