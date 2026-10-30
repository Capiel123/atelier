# Guia de JavaScript — Ateliê (estrutura atual)

O JavaScript tem quatro arquivos centrais (`estado.js`, `logica.js`, `interface.js`, `app.js`) e seis módulos de integração carregados depois deles. O conteúdo abaixo substitui o antigo `JS_DOCS.md.md`, cujo mapa não refletia corretamente a fragmentação atual.

## 1. Ordem de carregamento

`index.html` carrega com `defer` e nesta ordem: `estado.js` → `logica.js` → `interface.js` → `app.js` → `supabase-config.js` → `auth.js` → `onboarding.js` → `import-data.js` → `merge.js` → `sync.js`. Como todos compartilham o escopo global, respeitar essa ordem e os nomes globais é essencial.

## 2. Arquivos e responsabilidades

### `estado.js` — dados, fábricas e persistência

- Constantes: `VERSION`, `LS_KEY`, `LS_BACKUP`, `THEMES`, `DAYS`, prioridades, moedas, tipos de tarefa, opções Pomodoro, etapas de vagas etc.
- Utilitários comuns: `$`, `uid`, `esc`, datas/números e formatação.
- Estado global: `S`, navegação e variáveis transitórias.
- Tema: `applyTheme()` aplica paleta em propriedades CSS.
- Factories: `mkTask`, `mkSkill`, `mkContact`, `mkCommand`, `mkJob`, `mkClient`, `mkProject`, `mkGoal`.
- Dados iniciais e compatibilidade: `seed()`, `migrate()`.
- Persistência: `save()`, `backupLocal()`, `snapshot()`, `undo()`.
- Exclusão/restauração: `softDelete()`, `hardDelete()`, `restoreItem()`, `listAllDeleted()`.

### `logica.js` — regras e cálculos

- XP/níveis: `xpToNextLevel`, `levelInfo`, `globalXp`, `taskBaseXp`, `subXp`, `awardTaskXp`, `awardSubXp`.
- Tempo/métricas: `taskMinutes`, `subMinutes`, `skillMinutes`, `projMinutes`, `projGoalsTotal`, `projGoalsDone`, estimativas e contagens.
- Projetos/cliente: `projectEarnings`, `clientById`, `projectsByClient`, `clientName`.
- Energia/prioridade: `getTodayEnergy`, `setEnergy`, `computeTaskScore`, `scoreBreakdown`, `buildCtx`, `isStuck`, `isUrgentStuck`, `isOverEstimate`.
- Vagas: `jobStage`, `jobScore`, `changeJobStage`, `recordJobInteraction`, `createFollowUpTask`, `jobStats`.
- Contatos: `contactStatus`, `contactScore`, `logInteraction`, `snoozeContact`, `upcomingBirthdays`.
- Timer: `timerElapsedSec`, `subElapsedSec`, `startTimer`, `pauseTimer`, `resumeTimer`, `advancePhase`, `startRest`, `completeRest`, `stopTimer`, `beep`.
- Tarefas rápidas: `parseQuickLine`, `addQuick`, `addBulk`, `postponeTask`, `reorderTask`.
- Busca e métricas: `globalSearch`, `calibrationStats`, `heatmapData`, `networkStats`, `xpProgression`.
- Registros de trabalho e relatório: `workLogsForTask`, `saveWorkLog`, `projectNameById`, `reportWeekRange`, `buildWeeklyReport`, `weeklyReportMarkdown`.

### `interface.js` — desenho das telas

- Feedback/ajuda: `toast`, `copyTxt`, `downloadJSON`, `showShortcutsHelp`.
- Busca: `openSearch`, `closeSearch`, `renderSearchResults`, `goToSearchResult`.
- Navegação/layout: `showMoreSheet`, `renderBottomNav`, `render`, `applyLogo`.
- Tarefas: `viewWeek`, `renderFilteredTasks`, `cardTask`, `renderSubs`, `viewQueue`, `cardQueue`.
- Vagas/projetos/clientes/rendimento: `viewJobs`, `viewProjects`, `projectCard`, `renderProjectGoals`, `viewClients`, `viewEarnings` e cards associados.
- Outras views: `viewCalendar`, `viewGoals`, `viewSkills`, `viewStats`, `viewReview`, `viewContacts`, `viewHistory`, `viewCommands`, `viewConfig`.
- Componentes auxiliares: `renderHeatmap`, `renderOrbit`, `renderThemePreview`, `renderAreasSection`, `renderTrashSection`, `renderBackupBanner`.
- Modais/timer: `openInteractionSheet`, `showSnoozeMenu`, `renderTimer`, `openFocus`, `renderFocus`, `closeFocus`.
- Registro de trabalho/relatório: `historyEntryHTML`, `openWorkLogSheet`, `closeWorkLogSheet`, `renderWeeklyReportHTML`, `openReportSheet`, `closeReportSheet`.
- `TABS` define navegação; `VIEWS` liga cada ID a uma função de view.

### `app.js` — interações e inicialização

- `MUTATING_ACTIONS`: lista das ações que recebem snapshot antes da mutação via listener delegado.
- Listeners de `toggle`, `click`, `change`, `input`, `keydown` e `blur`.
- O listener `click` lê `data-a` e encaminha para um `switch` com casos por ação.
- `doImport(text)` valida o JSON superficialmente, guarda snapshot local anterior, aplica `migrate`, salva e renderiza.
- IIFE de init carrega `localStorage`, usa `seed()` ou `migrate()`, aplica tema/logo e renderiza.
- `window.__atelier` expõe funções/dados úteis para diagnóstico no console.
- IIFE do FAB; IIFE `initPWA()` registra service worker, versão/updates e texto de status.
- `setInterval` atualiza timer, modo foco e reordenação por energia.

### Módulos de integração (após `app.js`)

- `supabase-config.js` — URL, chave publishable e redirect do projeto.
- `auth.js` — Magic Link e sessão (`window.__auth`).
- `onboarding.js` — apresentação de primeira utilização (`window.__onboarding`).
- `import-data.js` — mapeamento S→linhas e importação inicial (`window.__importer`).
- `merge.js` — mapeamento remoto→local e merge LWW/união (`window.__merge`).
- `sync.js` — outbox, push, pull, cursor e recuperação (`window.__sync`).

## 3. Estado global e persistência

- `S` é o objeto-raiz persistido com tarefas, projetos, contatos, configurações e demais coleções; veja `DATA-MODEL.md`.
- `LS_KEY = 'atelier'`; `LS_BACKUP = 'atelier_backup_prev'`.
- `save()` serializa `S` no `localStorage`, atualiza `lastModified` e agenda eventual gravação remota em `dbDoc`, se existir.
- O código opcional de `window.claude` em `app.js` tenta obter usuário/banco remoto e usa `data/users/<id>/app`. Ele depende de ambiente externo; a fonte local continua sendo o comportamento básico. Não documentar como Supabase.
- O `syncPill` mostra `Salvo` após o save local ser chamado, logo é indicador de gravação local, não recibo de servidor.
- `migrate()` escreve a versão atual no campo `s.v`. `VERSION` em `estado.js` é `15.9` (o valor `14.2` era erro de digitação, corrigido).

## 4. Fluxos essenciais

### Clicar em botão

`data-a` → listener em `app.js` → snapshot se a ação estiver em `MUTATING_ACTIONS` → `switch` → mutação de `S`/chamada de lógica → `save()` e `render()` ou atualização parcial.

### Editar campo

A UI usa metadados como `data-p` (campo ligado a uma entidade) e `data-c` (configuração), além de IDs específicos. O listener `change` em `app.js` precisa converter o valor para o tipo certo, atualizar o objeto e persistir.

### Timer

`startTimer()` registra tarefa/subtarefa, `startedAt` (fase) e `subStartedAt` (segmento), acumulados e fase. O tempo decorrido é calculado a partir dos timestamps atuais; não depende de um contador que soma a cada segundo. `advancePhase()` conclui o foco e **pausa** no descanso sugerido (`startRest()` inicia curto/longo; `completeRest()` sugere voltar); os fluxos de parada adicionam logs.

### Importação

O JSON é parseado → são exigidos `tasks` e `projects` → o estado anterior vai para `atelier_backup_prev` → `migrate()` normaliza → `S` é substituído → tema/salvamento/renderização são atualizados. Alterações nesse fluxo exigem testes de backup e compatibilidade.

## 5. O que verificar ao adicionar uma ação

1. O HTML de `interface.js` tem `data-a`/IDs corretos?
2. O `switch` de `app.js` tem o caso correspondente?
3. A ação altera dados dentro de `S`?
4. Deve estar em `MUTATING_ACTIONS` para undo?
5. Atualiza timestamps relevantes?
6. Precisa chamar `save()` e `render()` ou pode atualizar só um elemento?
7. Usa valores dinâmicos com `esc()` no HTML?
8. Os dados continuam corretos depois de recarregar/importar backup?

## 6. Cuidados da arquitetura atual

- Evitar mover código entre arquivos sem compreender os globais compartilhados.
- Não criar uma segunda fonte para tempo (`spent` versus `logs`) sem uma regra definida.
- Não confiar em nomes de ações ou campos documentados sem pesquisar a versão atual.
- Os harnesses Node ficam fora do app, em `default-workspace/`; o app em si não inclui `package.json`, build ou suíte de testes.
- Depois de alterar arquivo JS, revisar cache da PWA e atualizar `CACHE_VERSION` conforme a convenção existente.
