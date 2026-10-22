# MAPA — Ateliê V13 (split + patches)

Como usar: ao pedir uma alteração, informe a função pelo nome, o comportamento esperado e o obtido. Para patches pequenos, envie a função atual e o trecho relevante deste mapa; não é necessário reenviar o HTML inteiro.

## Estrutura dos arquivos
- `index.html`: shell HTML, metadados, fontes externas, link para `styles.css` e carregamento de `app.js`.
- `styles.css`: estilos extraídos do bloco `<style>` original.
- `app.js`: lógica do aplicativo extraída do bloco `<script>` original, com marcadores de seção e correções de densidade/subtarefas.
- `backup/Atelie_Tarefas_V13_original.html`: cópia intocada da V13 recebida, para rollback.

> Nota: o HTML original referencia `./manifest.json`, mas esse arquivo não foi fornecido junto da V13. A referência foi preservada; para remover o 404 ou manter recursos PWA, coloque o `manifest.json` original ao lado de `index.html`.

## Estado global
- `S`: estado principal persistido em `localStorage` sob a chave `atelier`; inclui tarefas, projetos, habilidades, contatos, vagas, clientes, metas, configurações, timer e dados auxiliares.
- `tab`, `day`, `cal`: navegação e calendário.
- `filterState`, `jobFilter`, `contactFilterState`: filtros das views.
- `expandedTasks`, `expandedSubs`: expansão de cards e subtarefas durante a sessão.
- `subsCollapsed`: IDs de tarefas cujas subtarefas foram explicitamente recolhidas na sessão.
- `forcedCompact`: `null` segue a preferência `S.cfg.taskDensity` e a largura da janela; `true` força compacto; `false` força expandido.
- `focusTaskId`, `focusTargetMin`: estado do modo foco.
- `undoStack`: snapshots de undo, limitado a 30 estados.
- `dbDoc`, `dirty`, `saveTmr`: sincronização remota opcional/debounce, se o ambiente `window.claude` estiver disponível.

## Persistência e migração
- `LS_KEY = 'atelier'`; `LS_BACKUP` é a chave de backup local.
- `migrate(raw)`: normaliza e migra a estrutura dos dados para `VERSION` atual.
- `save()`: grava `S` no `localStorage` e agenda sincronização remota opcional.
- `backupLocal()`, `snapshot()`, `undo()`: backup local e desfazer.
- `doExport()` / `doImport(text)`: exportação/importação de JSON; a importação cria um backup local antes de substituir o estado.
- `softDelete`, `hardDelete`, `restoreItem`, `listAllDeleted`: lixeira e recuperação.

## Utilitários
`uid`, `esc`, `iso`, `todayI`, `dv`, `num`, `fmtMin`, `fmtClock`, `fmtDate`, `fmtBRL`, `fmtMoney`, `daysBetween`, `initials`, `weekStart`, `alive`, `touch`.

## Modelos e dados
- Fábricas: `mkTask`, `mkSkill`, `mkContact`, `mkCommand`, `mkJob`, `mkClient`, `mkProject`, `mkGoal`.
- Defaults/seed: `defaultLabels`, `defaultCommands`, `seed`.
- Áreas/moedas: `getAreas`, `getAllAreas`, `areaColor`, `areaLabel`, `convertTo`, `fmtMoney`.
- XP: `xpToNextLevel`, `levelInfo`, `levelOf`, `levelProgress`, `globalXp`, `taskBaseXp`, `subXp`, `isPersonalSection`, `awardTaskXp`, `awardSubXp`.
- Tempo/skills: `taskMinutes`, `subMinutes`, `skillMinutes`, `skillTaskCount`, `skillProjectCount`, `skillStreak`, `projMinutes`, `projEstTotal`, `projEstDone`.
- Seções: `taskSection`, `sectionMeta`, `taskWeight`, `sectionProgress`.
- Priorização: `computeTaskScore`, `scoreBreakdown`, `scoreClass`, `buildCtx`, `isStuck`, `isUrgentStuck`, `isOverEstimate`.
- Energia: `currentEnergySlot`, `getTodayEnergy`, `currentEnergy`, `setEnergy`.
- Vagas: `daysInJobStage`, `jobStage`, `isJobTerminal`, `jobScore`, `updateJobNextFollowUp`, `changeJobStage`, `recordJobInteraction`, `parseJobLine`, `createFollowUpTask`, `jobStats`.
- Contatos: `contactStatus`, `contactScore`, `contactScoreBreakdown`, `connectionDepth`, `logInteraction`, `snoozeContact`, `contactAllTags`, `contactResponseRate`, `upcomingBirthdays`.

## Timer e foco
- `timerElapsedSec`, `startTimer`, `pauseTimer`, `resumeTimer`, `advancePhase`, `stopTimer`, `renderTimer`, `beep`.
- `openFocus`, `closeFocus`, `showCloseFocusModal`, `updateFocusTimer`, `renderFocus`.

## Tarefas e helpers
- `T`, `dayTasks`, `V`, `selOptions`, `inp`.
- `parseQuickLine`, `addQuick`, `addBulk`, `postponeTask`, `reorderTask`.
- `renderFilteredTasks`, `refreshTaskList`, `cardTaskCompact`, `cardTask`, `renderSubs`.

## Views
- `viewWeek`: visão diária/semanal, energia, indicadores, filtros, seções e lista de tarefas.
- `viewQueue`: tarefas sem dia.
- `viewJobs`, `cardJob`: pipeline de vagas.
- `viewProjects`, `projectCard`, `viewClients`, `viewEarnings`.
- `viewCalendar`, `viewGoals`, `viewSkills`, `viewStats`, `viewReview`.
- `viewContacts(type)`, `contactCard`, `renderOrbit`, `viewHistory`, `viewCommands`, `viewConfig`.
- Outras views/helpers podem ser localizadas por busca textual em `app.js`.

## Busca, modais e overlays
`openSearch`, `closeSearch`, `globalSearch`, `renderSearchResults`, `goToSearchResult`, `showSnoozeMenu`, `openInteractionSheet`, `showShortcutsHelp`, `showMoreSheet`.

## Eventos
- Listener `click`: dispatch principal por `data-a`.
- Listener `change`: formulários e configurações.
- Listener `input`: atualização de campos ao digitar.
- Listener `keydown`: atalhos de teclado e controles globais.
- Listener `blur`: finalização de edição inline.

## Patches incluídos nesta versão
1. `forcedCompact` e `subsCollapsed` como estado de sessão.
2. `getTaskCompactMode()` respeita o override manual antes da preferência automática.
3. `viewWeek()` usa `getTaskCompactMode()` para definir o modo e o rótulo do botão.
4. `expandAll` força modo expandido e `collapseAll` força modo compacto; ambos limpam overrides individuais e fazem `render()` completo.
5. `expandSubs` e `collapseSubs` agora são ações distintas.
6. `cardTask()` respeita subtarefas recolhidas explicitamente.
7. `renderSubs()` exibe cabeçalho clicável com contagem e progresso.

## Como pedir patches daqui para frente
Exemplo:

> Bug em `computeTaskScore`. Esperado: tarefas com prazo hoje sobem na fila. Obtido: continuam abaixo das sem prazo. Aqui está a função atual: [...]. Devolva só a função corrigida e explique se precisa alterar outro ponto.

Envie o `MAP.md` junto da função relevante. Reenvie o projeto inteiro apenas para mudanças que atravessam várias áreas, alterações no formato de dados ou bugs que não conseguimos localizar.

## V14.1: camada de UX (só adições, nada reescrito)
- `styles.css`, bloco final `V14.1 UX LAYER`: foco visível, feedback de toque, header sticky no mobile (grid 2 linhas), bottom-nav com indicador e blur, folha "Mais" com handle e animação, nav sticky no desktop (≥1024px), hover/scrollbar só onde há mouse, `prefers-reduced-motion`.
- `app.js`, bloco final `V14.1 UX`: botão flutuante `#fab` (só mobile) que foca `#qa` ou `#qaJob`; some quando o teclado abre ou a aba não tem campo de adicionar.
- `fn.sh`: `./fn.sh nomeDaFuncao` imprime só aquela função do `app.js` (use antes de pedir um patch).
- Rollback da camada: apague os dois blocos marcados `V14.1`.
