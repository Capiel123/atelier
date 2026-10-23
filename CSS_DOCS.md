# Documentação do CSS — App de Gestão de Tarefas

## 1. Mapa do Código (por funcionalidade / tela)

### 🎨 Fundação / Base
- `:root` — variáveis de cor e espaçamento
- `html`, `*`, `body` — reset, tipografia, fundo
- `h3`, `h4` — títulos de seção
- `button`, `input`, `select`, `textarea` — estilos genéricos de controles
- `details`, `summary` — elementos colapsáveis

### 🏠 Estrutura da Página
- `.wrap` — largura máxima do conteúdo
- `header`, `.header-right`, `.logo`, `.logo img`, `.logo-text` — topo
- `.search-btn` — botão de busca
- `#lvl` (e `.lb`) — barra de nível no topo
- `.timer` — cronômetro no topo
- `.backup-banner`, `.update-banner` — banners informativos

### 🧭 Navegação
- `#nav` — navegação desktop
- `.bottom-nav` — navegação mobile (fixa no rodapé)
- `.more-sheet`, `.more-menu` — menu "mais" no mobile

### ☀️ Tela "Hoje"
- `.today-hero` — cabeçalho do dia
- `.days` — seletor de dias da semana
- `.energy-row`, `.energy-pills` — nível de energia
- `.next-card` — próximo compromisso
- `.bar`, `.fill` — barra de progresso do dia
- `.fab` — botão flutuante de adicionar (mobile)

### ✅ Lista de Tarefas
- `.card` (+ variantes: `.done`, `.compact`, `.selected`, `.highlight`)
- `.chk` (checkbox circular), `.chk.s` (versão pequena)
- `.row`, `.ti`, `.tt`, `.tdesc`, `.meta`, `.tag`, `.dot`, `.tm`, `.mini`
- `.acts` — ações do card
- `.subs`, `.sub`, `.subs-badge` — subtarefas
- `.section-header`, `.section-progress` — cabeçalho de grupo
- `.tasks-header`, `.tasks-header-actions`, `.list-actions`
- `.filter-bar`, `.labels-filter`, `.tag-filter` — filtros
- `.label-pill`, `.tag-pill`, `.type-icon`, `.score-badge`, `.color-dot`
- `.postpone-badge`, `.parkinson-badge`, `.streak-badge`

### 📝 Formulários
- `.form` (grid responsivo de campos)
- `.skills-box` (lista de checkboxes)
- `.grid-cal`, `.cd` (minicalendário)
- `.big`, `.badge`

### 📊 KPIs e Gráficos
- `.kpi-grid`, `.kpi`
- `.bar-chart`
- `.chart`, `.chart-row`
- `.proj-progress`
- `.heatmap`, `.hm-cell`, `.hm-legend`

### 🔁 Revisão
- `.review-section` e filhos

### ⏱️ Modo Foco
- `.focus-overlay`, `.focus-content`, `.focus-circle`, `.focus-btn` …

### ⌨️ Modais
- `.shortcuts-modal` (atalhos)
- `.search-modal` (busca global)

### 💼 Jobs / Prospects
- `.job-card`, `.job-title`, `.stage-badge`, `.job-kpis`, `.prospect-cta`

### 👥 Contatos
- `.contact-card` (+ estados `.overdue`, `.due`, `.waiting`, `.snoozed`)
- `.contact-score` (+ `.hot`, `.warm`, `.cold`)
- `.waiting-pill`, `.snoozed-pill`, `.response-rate`
- `.quick-actions`, `.contact-kpis`
- `.view-toggle` (lista / órbita)
- `.orbit-wrap`, `.orbit-svg` — visualização orbital
- `.interaction-row` — histórico de interações

### 🌐 Rede / Network
- `.network-card`, `.network-kpi`, `.depth-row`
- `.contact-mini`, `.week-inter`, `.birthday-row`

### 🎮 XP / Gamificação
- `.xp-hero`, `.skill-xp-row`

### 🎨 Temas
- `.theme-grid`, `.theme-card`, `.theme-preview`, `.custom-accent-row`

### 📜 Histórico
- `.history-day`, `.history-row`, `.rate-badge`

### ⚙️ Configurações
- `.client-card`, `.proj-row-line`
- `.area-row`
- `.trash-row`
- `.section-group`

### 🍞 Feedback
- `.toast` (+ `.on`, `.err`)

### 🎞️ Animações
- `pwaPulse`, `focusFlashBg`, `fadeIn`, `v141up`, `pwaSlide`

### 📱 Responsivo
- `@media (max-width:640px)` (vários blocos)
- `@media (min-width:1024px)`
- `@media (hover:hover)`
- `@media (prefers-reduced-motion:reduce)`
- `@supports not (backdrop-filter:blur(4px))`

### ✨ Camada de refinamento UX (v14.1 / v15 / v16)
- Polimento de foco, transições, `:has()` para reordenar no mobile, ajustes finos.

---

## 2. Tabela de Variáveis (`:root`)

| Variável | Valor | Onde é usada (exemplos) |
|---|---|---|
| `--bg` | `#0e0d11` | `body`, `.focus-overlay`, `.chk` mobile, `.hm-cell` vazia |
| `--s1` | `#17151c` | Header, cards, `#nav`, `.kpi`, `.filter-bar`, `.list-actions` |
| `--s2` | `#1f1c26` | Inputs base, `.tag`, `.mini`, `.badge`, `.stats` pills |
| `--s3` | `#26222f` | Hover de `.skills-box`, `.view-toggle.on`, `.energy-pills.active` |
| `--bd` | `#2c2835` | Bordas de quase tudo |
| `--tx` | `#ece8e1` | Texto principal |
| `--mu` | `#9a94a3` | Texto secundário / muted |
| `--ac` | `#d4a84b` | Logo, botões primários, `.fill`, `.hm-cell.lvl-4`, foco |
| `--bu` | `#9c3355` | `.add button`, `.focus-btn.pause`, `.late`, gradiente de barra |
| `--ok` | `#4fb3a2` | `.sync-pill[saved]`, dots de dia, `.review-section.done` |
| `--wr` | `#e0a33b` | Avisos, `.soon`, `.postpone-badge.stuck`, `energy[med]` |
| `--er` | `#e0626a` | Erros, `.late`, `.sync-pill[error]`, `.response-rate.bad` |
| `--cm` | `#e0a33b` | **Não usada em nenhum lugar** (mesma cor de `--wr`) |
| `--pe` | `#a08fc0` | **Não usada em nenhum lugar** |
| `--c` | *(definida por JS via inline style)* | Cor contextual do card (borda esquerda, progresso) |
| `--lc` | *(definida por JS via inline style)* | Cor contextual de `.label-pill` |
| `--r` | `12px` | Raio padrão |
| `--sh` | `0 6px 18px #0007` | Sombra de elementos flutuantes |
| `--ease` | `cubic-bezier(.2,.8,.2,1)` | Curva de animação padrão |
| `color-scheme` | `dark` | Força tema escuro em controles nativos |

> 💡 As variáveis `--c` e `--lc` **não ficam no `:root`** — são injetadas via JavaScript em cada card/label para colorir individualmente.

---

## 3. Relação de Dependências (classe → classe base)

> "X depende de Y" significa: **sem a classe base Y, o modificador X não funciona visualmente**.

| Modificador | Depende de |
|---|---|
| `.card.done` / `.compact` / `.selected` / `.highlight` / `.next-card-in` | `.card` |
| `.chk.s` | `.chk` |
| `.sub.run` | `.sub` |
| `.sync-pill[data-state="saved" \| "saving" \| "error" \| "offline"]` | `.sync-pill` |
| `.energy-pills button[data-e="low" \| "med" \| "high"].active` | `.energy-pills button.active` |
| `.label-pill.on` (em `.labels-filter`) | `.label-pill` |
| `.type-icon.criativa` / `.profunda` / `.admin` / … | `.type-icon` |
| `.score-badge.hot` / `.warm` / `.cold` | `.score-badge` |
| `.contact-card.overdue` / `.due` / `.waiting` / `.snoozed` | `.contact-card` |
| `.contact-score.hot` / `.warm` / `.cold` | `.contact-score` |
| `.postpone-badge.stuck` / `.urgent` | `.postpone-badge` |
| `.hm-cell.lvl-1` / `lvl-2` / `lvl-3` / `lvl-4` / `future` / `today` | `.hm-cell` |
| `.job-card.terminal` | `.job-card` |
| `.theme-card.on` | `.theme-card` |
| `.more-sheet.open` | `.more-sheet` |
| `.toast.on` / `.toast.err` | `.toast` |
| `.area-row.archived` | `.area-row` |
| `#lvl .lb` / `#lvl .lb div` | `#lvl` |
| `.timer.run` | `.timer` |
| `.bar i.lit` | `.bar i` |
| `.view-toggle button.on` | `.view-toggle button` |
| `.section-header-title` / `-meta` / `-right` / `-progress` / `-pct` | `.section-header` |
| `.card.compact:hover` | `.card.compact` |
| `.more-sheet-panel button.on` | `.more-sheet-panel` |
| `.review-section.done` | `.review-section` |

---

## 4. Análise de Limpeza

### 🧹 Variáveis não usadas
- **`--cm: #e0a33b`** → idêntica a `--wr`. Nenhuma ocorrência de `var(--cm)` no arquivo.
- **`--pe: #a08fc0`** → nenhuma ocorrência de `var(--pe)`.

### 🔁 Seletores duplicados / repetidos
- `.days button` aparece **duas vezes** (base + `@media(max-width:640px)` V15).
- `.days button.on` idem.
- `.today-hero` idem (base + V15 mobile).
- `.card` idem (base + mobile V16 com `border-left-width:4px`).
- `.chk` / `.chk.s` idem (base + mobile V14/V16).
- Existem **4 blocos `@media (max-width:640px)`** separados — podem ser fundidos em um só.
- Existem **2 blocos `@media (min-width:1024px)`** — podem ser fundidos.
- Existem **2 blocos `@media (hover:hover)`** (um deles isolado) — podem ser fundidos.

### ⚠️ Propriedades conflitantes (intencionais ou não)
- `.card { padding: 14px }` vs `.card.compact { padding: 12px 14px }` → o compact sobrescreve, está OK.
- `.today-hero .th-stats` → **renderizado** no desktop, **oculto** no mobile (V16 com `display:none !important`).
- `.list-actions` → **renderizado** no desktop, **oculto** no mobile (V16).
- `.fab` → `display:none` (padrão), `display:flex` no mobile (V16), e `.fab[hidden]` recebe `display:flex !important` no mobile — **a lógica de "esconder o FAB" foi anulada no mobile**, provavelmente proposital, mas vale revisar.
- `.chk` recebe `border:1.5px solid` **e** `background:var(--bg)` no mobile, sobrescrevendo o estilo base — intencional, mas frágil (depende de `!important`).

### 🗑️ Possível código em desuso
- `.backup-banner` — presente mas não encontrei referência em outras regras. Verificar uso.
- `.calib-block`, `.calib-headline` — parecem de uma feature antiga de "calibração". Verificar uso.
- `.skill-xp-row`, `.network-card`, `.orbit-wrap`, `.theme-*`, `.history-*`, `.trash-row` — **provavelmente ativos** (telas específicas), mas confirmar com a renderização.
- `.backup-banner button:last-child` — usado para botão de dispensar. OK.
- `.big` — usado apenas 1 vez; conferir se ainda aparece no HTML.

### 💡 Oportunidades de simplificação (sem alterar visual)
1. Unificar os 4 blocos `@media(max-width:640px)` em **1 bloco único no fim**.
2. Remover `--cm` e `--pe`.
3. Consolidar `.chk` / `.chk.s` no mobile (o `!important` pode sair se a ordem for correta).
4. Reaproveitar `.big`/`.badge` se não houver uso real.
5. Migrar todos os `!important` para regras fora de `!important` (quando a ordem de cascata permitir).