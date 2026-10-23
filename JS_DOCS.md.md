# Documentação do JavaScript — Atelier

## 1. Mapa do Código (por funcionalidade)

### 🎨 Fundação / Constantes
- `VERSION`, `LS_KEY`, `LS_BACKUP`, `LEVEL_XP` — identificadores gerais
- `AREAS_DEFAULT`, `CURRENCIES`, `THEMES` — dados fixos de configuração
- `PR`, `PRC`, `DAYS`, `DAYS_FULL` — listas curtas (prioridade, dias)
- `DEF_SKILLS`, `COLOR_PALETTE`, `TASK_TYPES`, `ENERGY_LEVELS` — dados de domínio
- `CAT_PRO`, `CAT_PERSONAL`, `CADENCE_DEFAULT` — categorias de contato
- `POMODORO_OPTIONS`, `BILLING_TYPES` — opções de UI
- `JOB_STAGES`, `JOB_STAGE_PROB`, `JOB_SUBAREAS`, `JOB_PLATFORMS`, `JOB_TERMINAL` — vagas
- `INTERACTION_TYPES`, `SNOOZE_REASONS` — contatos
- `SECTION_META`, `SECTION_ORDER` — agrupamento de tarefas

### 🧰 Utilitários
- `$`, `uid`, `esc` — atalhos DOM/segurança
- `iso`, `todayI`, `dv`, `num` — conversões de data/número
- `fmtMin`, `fmtClock`, `fmtDate`, `fmtBRL`, `fmtUSD`, `daysBetween` — formatação
- `initials`, `weekStart` — utilidades
- `alive`, `touch` — filtros de "vivo" e timestamp
- `getAreas`, `getAllAreas`, `areaColor`, `areaLabel` — áreas
- `convertTo`, `fmtMoney` — moedas

### 💾 Estado e Persistência
- `S` — objeto-raiz (tarefas, projetos, contatos, config, etc.)
- Estado de UI (muitas variáveis: `tab`, `day`, `filterState`, etc.)
- `applyTheme` — aplica o tema atual
- `save`, `backupLocal`, `snapshot`, `undo` — persistência
- `softDelete`, `hardDelete`, `restoreItem`, `listAllDeleted` — lixeira
- `seed`, `migrate` — criação e migração de dados

### 🧱 Modelos (fábricas)
- `mkTask`, `mkSkill`, `mkContact`, `mkCommand`, `mkJob`, `mkClient`, `mkProject`, `mkGoal`
- `defaultLabels`, `defaultCommands`

### ⚙️ Regras de Negócio
- **XP**: `xpToNextLevel`, `levelInfo`, `globalXp`, `taskBaseXp`, `subXp`, `awardTaskXp`, `awardSubXp`
- **Métricas de tarefa**: `taskMinutes`, `subMinutes`, `skillMinutes`, etc.
- **Seções**: `taskSection`, `sectionMeta`, `taskWeight`, `sectionProgress`
- **Projetos**: `projectEarnings`, `clientById`, `projectsByClient`, `clientName`
- **Energia**: `currentEnergySlot`, `defaultEnergyForSlot`, `getTodayEnergy`, `currentEnergy`, `setEnergy`
- **Score de tarefa**: `computeTaskScore`, `scoreBreakdown`, `scoreClass`, `buildCtx`, `isStuck`, `isUrgentStuck`, `isOverEstimate`
- **Vagas**: `jobScore`, `changeJobStage`, `recordJobInteraction`, `parseJobLine`, `createFollowUpTask`, `jobStats`
- **Contatos**: `contactStatus`, `contactScore`, `connectionDepth`, `logInteraction`, `snoozeContact`, etc.
- **Timer**: `startTimer`, `pauseTimer`, `resumeTimer`, `advancePhase`, `stopTimer`, `timerElapsedSec`
- **Tarefas helpers**: `T`, `dayTasks`, `parseQuickLine`, `addQuick`, `addBulk`, `postponeTask`, `reorderTask`

### 🖥️ Interface (Views e Cards)
- **Views de aba**: `viewWeek`, `viewQueue`, `viewJobs`, `viewProjects`, `viewClients`, `viewEarnings`, `viewHistory`, `viewCalendar`, `viewGoals`, `viewSkills`, `viewStats`, `viewReview`, `viewContacts`, `viewCommands`, `viewConfig`
- **Builders de card**: `cardTask`, `cardTaskCompact`, `cardQueue`, `cardJob`, `projectCard`, `contactCard`
- **Helpers de UI**: `adder`, `filterBar`, `getTaskCompactMode`, `renderFilteredTasks`, `refreshTaskList`, `bar`
- **Modais e overlays**: `renderFocus`, `openFocus`, `closeFocus`, `showSnoozeMenu`, `openInteractionSheet`, `showShortcutsHelp`, `openSearch`, `showMoreSheet`
- **Renderizadores de seção**: `renderThemePreview`, `renderAreasSection`, `renderTrashSection`, `renderHeatmap`, `renderOrbit`

### 🔌 Orquestração (eventos + init)
- `MUTATING_ACTIONS` — lista de ações que geram snapshot
- Listeners: `toggle`, `click`, `change`, `input`, `keydown`, `blur`
- `doImport` — importação de backup
- `init` — inicialização
- `window.__atelier` — API pública para console
- IIFEs: FAB, PWA

---

## 2. Tabela de Variáveis e Estados Globais

| Variável | Tipo | Guarda / Controla |
|---|---|---|
| `S` | objeto | **Estado inteiro do app** — tarefas, projetos, contatos, config, etc. Persistido em `localStorage` sob `LS_KEY` |
| `LS_KEY` | string | Chave do localStorage principal (`'atelier'`) |
| `LS_BACKUP` | string | Chave do backup local (`'atelier_backup_prev'`) |
| `tab` | string | Aba atual (`'week'`, `'jobs'`, `'stats'`…) |
| `day` | number | Dia da semana selecionado (0–6) |
| `cal` | Date | Mês exibido no calendário |
| `dbDoc` | objeto | Referência ao documento do banco remoto (Claude DB) |
| `dirty` | boolean | Sinaliza alterações desde a última sincronização |
| `saveTmr` | number | Timer de debounce do save para o banco |
| `undoStack` | array | Até 30 snapshots JSON do estado (Ctrl+Z) |
| `filterState` | objeto | Filtros de tarefas (`text`, `type`, `area`, `proj`, `labels`) |
| `jobFilter` | objeto | Filtros de vagas (`stage`, `area`, `text`) |
| `contactFilterState` | objeto | Filtros de contatos por tipo (`pro`, `personal`) |
| `contactView` | objeto | Modo de visualização dos contatos (`list`, `orbit`) |
| `skillsFilter` | string | Período das habilidades (`all`, `30`, `7`) |
| `earningsFilter` | string | Período do rendimento (`month`, `all`) |
| `historyFilter` | string | Período do histórico (`7d`, `30d`, `all`) |
| `focusTaskId` | string | ID da tarefa aberta no modo foco |
| `focusTargetMin` | number | Duração do bloco de foco selecionada |
| `selectedTaskId` | string | ID da tarefa destacada |
| `expandedTasks` | Set | IDs das tarefas expandidas no card |
| `expandedSubs` | Set | IDs das tarefas com subtarefas abertas |
| `subsCollapsed` | Set | IDs das tarefas com subtarefas colapsadas |
| `forcedCompact` | boolean/null | Força modo compacto (`true`) ou completo (`false`); `null` = automático |
| `openEdits` | Set | IDs de `<details>` abertos (persistência do estado aberto) |
| `toastTmr` | number | Timer do toast |
| `searchQuery` | string | Último texto buscado |
| `lastSlot` | string | Último slot de energia detectado (`morning`/`afternoon`/`evening`) |
| `showQuickAdd`, `showFilters` | boolean | Painéis abertos da aba Semana |
| `mobileFiltersOpen` | boolean | Estado dos filtros mobile |

### Dados persistidos dentro de `S`
| Campo de `S` | O que guarda |
|---|---|
| `tasks` | Tarefas (com subtarefas e logs de tempo) |
| `projects`, `clients`, `applications` | Projetos, clientes, vagas |
| `contacts` | Contatos profissionais e pessoais |
| `skills`, `goals`, `labels`, `commands` | Habilidades, metas, labels, atalhos |
| `areas` | Áreas customizáveis |
| `energy` | Energia por dia e slot |
| `timer` | Timer em andamento (para retomar ao recarregar) |
| `trash` | Tarefas deletadas (soft delete) |
| `xpPool` | XP sem habilidade vinculada |
| `cfg` | Configurações (tema, moeda, câmbio, focus, backup…) |
| `v` | Versão do schema (para migração) |

---

## 3. Relação de Funções e Fluxos

### 🔄 Ciclo principal
```
clicar em qualquer coisa → listener 'click' →
  [se ação mutante] snapshot() → undoStack
  → executa ação (switch) → save() → render()
```

### 💾 Fluxo de salvar
```
save() →
  dirty = true → localStorage.setItem(LS_KEY) → clearTimeout(saveTmr)
  → setTimeout(1500ms) → dbDoc.set({json: JSON.stringify(S)})
```

### ✅ Fluxo de concluir tarefa
```
clique em "chk" → case 'tog' → t.done = true → awardTaskXp(t)
  → (se personal) nada → (se subtarefas) awardSubXp por sub
  → (se habilidade) sk.xp += xp/n → (senão) S.xpPool += xp
```

### ⏱️ Fluxo do timer
```
startTimer() → S.timer = {...} → save() → renderTimer() + render()
a cada 800ms → se elapsed >= targetMin → advancePhase()
  → se fase 'focus' → registra log → vai para 'rest'
  → se fase 'rest'  → volta para 'focus' → beep()
stopTimer() → registra log final → S.timer = null → renderTimer()
```

### 🔍 Fluxo de busca
```
Ctrl+K → openSearch() → input 'searchInput' → debounce 150ms
  → renderSearchResults(q) → globalSearch(q) → globalSearch normaliza
  → busca em tasks/projects/clients/contacts/applications/skills/goals
  → click em resultado → goToSearchResult() → troca de aba + highlight
```

### 🎯 Fluxo de foco
```
openFocus(taskId) → renderFocus() → S.timer ausente
  → clicar "Iniciar" → startTimer() → renderFocus() → anel anima
  → espaço → pause/resume → beep ao terminar cada fase
closeFocus() → se focusNoStop → mantém timer
  → senão showCloseFocusModal() → "continuar" ou "parar"
```

### 👥 Fluxo de contato
```
contactSend → logInteraction(c,'out') →
  c.lastContact = hoje → c.nextContact = hoje + cadence
  → c.waitingFor = true → c.sentCount++
contactReceive → logInteraction(c,'in') → c.waitingFor = false
contactScore(c) → considera dias desde lastContact / cadence
  + prioridade + waitingFor + taxa de resposta
```

### 📦 Fluxo de projetos
```
projectEarnings(p) → soma tempo das tarefas (ou usa manualHours)
  → aplica billingType (fixed/hourly/minute)
  → retorna {total, ratePerHour, hours, ...}
pcomplete → completedAt = Date.now() → aparece em Rendimento
```

### 🧹 Fluxo de lixo
```
del → S.tasks = filter(x => x.id !== id)  // tarefas vão pra S.trash (limite 200)
softDelete('projects', id) → obj.deletedAt = Date.now()
listAllDeleted() → varre todas as coleções + S.trash → retorna até 200
trashRestore → deletedAt = null
trashEmpty → remove todos com deletedAt
```

---

## 4. Análise de Limpeza

### 🧹 Código morto / nunca usado
- **`mobileFiltersOpen`** — declarada como `false`, nunca é atribuída em nenhum lugar
- **`subsCollapsed` e `forcedCompact`** — são usados nas ações `expandAll`/`collapseAll`/`expandSubs`/`collapseSubs`, mas esses botões **não existem no HTML atual** (a view não os renderiza). Funcionam só via console
- **`reviewArchiveProj` e `reviewContactDone`** — existem no switch mas nenhum HTML chama essas ações
- **`'selectTask'`** — existe no switch, mas nenhum elemento define `data-a="selectTask"`
- **`LAST_SLOT`** — usado apenas para detectar mudança de slot no interval

### 🔁 Duplicações
- **`viewContacts('pro')`** e **`viewContacts('personal')`** — a função inteira é idêntica, só muda o parâmetro. Não é bug, é design.
- **Dois listeners de `keydown`** — um só para `Enter`, outro para atalhos. Poderiam ser unificados.
- **`setInterval` no timer + `setInterval` no updateFocusTimer** — dois intervalos separados, ambos 500ms. Funcionam, mas poderiam ser um só.

### ⚠️ Riscos / dívidas técnicas
- **`S` declarado como `let`** mas a API expõe `get S(){return S}` — não permite reatribuição externa, mas internamente o app redefine `S` em vários lugares (migrate, undo, importar). OK por enquanto.
- **`migrate`** cresceu com blocos `if (isV1)`, `if (isV2)`… — funciona, mas cada nova versão adiciona complexidade. Um dia vale extrair para `migrations/` separado.
- **`inp()` e `selOptions()`** retornam strings de HTML — cuidado com escaping, já feito com `esc()`.
- **`viewStats`** tem ~150 linhas em uma única função. Poderia extrair blocos (`renderXpBlock`, `renderProjBlock`, `renderNetBlock`) — mas isso muda pouco e o arquivo é funcional.

### 💡 Oportunidades (sem alterar comportamento)
1. **Timers**: unificar `setInterval(timerTick, 500)` para `renderTimer` e `updateFocusTimer`.
2. **`mobileFiltersOpen`**: remover (código morto).
3. **Listeners `keydown`**: fundir em um só com `if (ev.key === 'Enter') return handleEnter(ev);`.
4. **`showCloseFocusModal`**: usa `innerHTML` com `esc()` — consistente, mas o modal `snoozeMenu` e `interactionSheet` também duplicam o padrão. Poderiam compartilhar um `openModal(html)` helper.
5. **`viewContacts`**: extrair os ~15 renders internos (KPIs, pills, form, etc.) para funções — mas isso é redesign, não reorganização.

### 🚨 Pontos de atenção para o futuro
- `S.timer` é salvo dentro de `S` (persiste no localStorage). Se o app for recarregado no meio de um pomodoro, ele retoma corretamente (comportamento desejado).
- `dbDoc` só é definido se `window.claude` existir. Sem esse ambiente, o app funciona 100% via `localStorage` — bom fallback.
- `MUTATING_ACTIONS` — qualquer nova ação que altere `S` precisa ser adicionada lá, senão `Ctrl+Z` não pega.