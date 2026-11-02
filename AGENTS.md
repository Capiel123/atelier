# Ateliê — Diretrizes de Engenharia e Gerenciamento de Contexto para Agentes de Código

---

## 1. Carregamento Seletivo de Contexto (Context-Window Optimization)

Para evitar degradação de performance por estouro ou poluição de contexto, siga este **mapa de decisão** antes de carregar ou editar arquivos:

```text
SUA TAREFA ENVOLVE...                    CARREGUE E CONSULTE...
├─ Header, Timer, Logo ou Nav Topo   ──> docs/design/HEADER-TOP-MENU.md + layout.css
├─ Card Resumo / Dashboard Semanal   ──> docs/ui/DASHBOARD-WEEK-TAB.md + responsivo.css
├─ Semana, cards e conclusão         ──> docs/ui/WEEK-AND-TASK-CARDS.md + logica.js (isDone/inWeekScope)
├─ Avisos e busca global             ──> docs/ui/AVISOS-E-BUSCA.md + interface.js
├─ CSS Mobile (≤640px) ou Breakpoints ─> responsivo.css (final do arquivo) + docs/design/CSS_DOCS.md
├─ Design System, temas, fontes      ──> docs/design/DESIGN-SYSTEM.md + TEMAS.md + FONTES.md
├─ Estado Local, Sync ou Supabase    ──> estado.js + sync.js + docs/data/DATA-MODEL.md
├─ Estrutura do App / Módulos JS     ──> docs/ARCHITECTURE.md + docs/guides/JS_DOCS.md
└─ Regras de Negócio e XP            ──> logica.js + docs/data/BUSINESS-RULES.md
```

---

## 2. Protocolo de Pré-Alteração (Checklist Obrigatório)

Antes de efetuar qualquer alteração no repositório, execute sequencialmente:

1. **Leitura de Contexto:** Consulte `docs/PROJECT_CONTEXT.md` e verifique o painel em `docs/HANDOFF.md`.
2. **Dívidas conhecidas:** Consulte `docs/KNOWN-ISSUES.md` — o problema pode já estar mapeado (ID `Kxx`/`Fxx`) com sintoma e próximo passo.
3. **Histórico de versões:** Consulte `docs/CHANGELOG.md` para saber quando a área mudou e qual `CACHE_VERSION` a acompanha.
4. **Inspeção Direta do Código:** Confirme no código real o estado de assinaturas de funções, seletores CSS e eventos (não confie apenas em memórias de conversas anteriores).
5. **Análise de Impacto de Dados:** Se a alteração envolver a camada de armazenamento (`estado.js`, `localStorage`, `Supabase`), mapeie dependências em `docs/data/DEPENDENCIES.md`.
6. **Confirmação de Backup:** Certifique-se com o desenvolvedor de que há backup recente antes de alterações com refatoração profunda ou mutações de estrutura de banco.

---

## 3. Regras de Código e Engenharia

- **Escopo Restrito (Diff Mínimo):** Faça intervenções cirúrgicas. Uma solicitação = um único escopo principal. Não aplique refatorações não solicitadas.
- **Sem Frameworks ou Build Steps:** O projeto roda nativamente no navegador (`HTML`, `CSS`, `JS`). **Não** adicione `package.json`, bundlers (Vite/Webpack) ou dependências de terceiros sem autorização prévia.
- **Desfazer Operações (Undo System):** Se uma nova ação JS mutável for criada, registre seu identificador no array `MUTATING_ACTIONS` para manter a integridade da pilha de desfazer (`Ctrl+Z`).
- **Sanitização de HTML:** Sempre utilize o helper `esc()` ou utilitários de escape equivalentes ao concatenar dados originados de input do usuário no DOM.
- **PWA Service Worker:** Se alterar qualquer arquivo que compõe o shell da aplicação (`index.html`, `*.css`, `*.js`, `manifest.json`), incremente a constante `CACHE_VERSION` no `service-worker.js`.

---

## 4. Diretrizes Estritas de UI/UX e Design System

### Mobile ($\le 640\text{px}$)
- **Local de Alterações Mobile:** Adicione novas regras CSS **exclusivamente** no final do arquivo `responsivo.css` dentro do bloco `@media(max-width:640px)`. Não altere blocos desktop existentes.
- **Desacoplamento JS/CSS:** Prefira resolver ajustes de layout via CSS com `display: contents`, `flex`, `grid` ou `order`. Evite alterar os geradores de template HTML em `interface.js`.
- **Área de Toque (Touch Targets):** Mantenha o tamanho mínimo de clique em $44\text{px}$ de altura para elementos interativos no mobile (utilize pseudo-elementos como `::after` quando necessário para ampliar a hitbox sem alterar a escala visual).
- **Rolagem da Página:** Mantenha a rolagem no contêiner raiz da página. Evite aplicar `overflow-y: scroll` interno em listas no mobile.
- **Espaçamento do FAB:** Garanta margem inferior suficiente no final das listas de tarefas para que o último item não seja coberto pelo botão flutuante (FAB).

### Hierarquia do card de tarefa (regra de produto)
- **O título da tarefa é o elemento mais importante do card.** Nada — ícone de tipo/status, badge, lápis de edição, contador, avatar — pode ser renderizado **acima** dele. Micro-ícones entram **inline à esquerda** do texto, na mesma linha; se não couberem, vão para a linha de metadados, nunca para cima do título.
- **Alinhamento:** o texto do título e a `.chk` alinham pelo **topo** (primeira linha), não pelo centro do bloco. Título de 1 ou 3 linhas mantém a checkbox na mesma altura da primeira linha.
- **Sem corte de informação por espaço:** títulos, tags, labels e o valor do timer quebram linha ou ocupam a largura necessária. Não usar `white-space:nowrap` + `text-overflow:ellipsis` para esconder conteúdo no mobile; `nowrap` fica restrito a números/contadores curtos.
- **Fluxo do título no mobile:** o bloco do título (`.tt`) usa fluxo inline/block no mobile — `display:flex` + `flex-wrap` faz cada filho (ícone, texto, lápis) quebrar em uma linha própria e empurra o ícone para cima do título.
- **Separadores:** blocos distintos dentro do card (subtarefas × “Editar detalhes”) precisam de divisor hairline (`1px solid var(--bd)`) e respiro vertical; controles com no mínimo 36px de altura útil.

### Sistema de Temas e Tokens Coloridos
- Utilize exclusivamente tokens CSS de tema (`var(--bg)`, `var(--s1..3)`, `var(--bd)`, `var(--tx)`, `var(--mu)`, `var(--ac)`, `var(--bu)`, `var(--ok)`, `var(--wr)`, `var(--er)`). Evite cores hexadecimais fixas inline.
- **Preservação de Escopo de Efeitos:** Efeitos visuais avançados como `background-clip: text`, gradientes metálicos e `text-shadow` intensos são **estritamente restritos** ao elemento `.logo-text`. Nunca aplique essas propriedades a títulos de leitura (`.tt`, `h2`, `inputs`).
- **Validação Cruzada de Temas:** Sempre valide alterações visuais nos 6 temas principais do sistema: *Obsidiana*, *Vampiro*, *Osso*, *Osso Profundo*, *Cromo* e *Osso Profundo Claro*.

---

## 5. Passagem de Trabalho entre Agentes (Handoff Protocol)

1. **Ao Iniciar:** Leia o estado em `docs/HANDOFF.md`, as 3 entradas mais recentes de `docs/archive/HANDOFF-HISTORICO.md` e as pendências em `docs/KNOWN-ISSUES.md`.
2. **Ao Concluir:**
   - Resuma os arquivos alterados e a justificativa técnica de cada mudança.
   - Registre a versão no topo de `docs/CHANGELOG.md` (o que mudou / o que foi corrigido / arquivos / validação) sempre que o shell mudar.
   - Atualize `docs/KNOWN-ISSUES.md`: fechou uma dívida (mova para “Resolvidos”, citando a versão)? Abriu uma nova? Tomou uma decisão que não será corrigida?
   - Atualize o arquivo `docs/HANDOFF.md`.
   - Adicione o registro histórico no topo de `docs/archive/HANDOFF-HISTORICO.md` contendo: data, agente responsável, arquivos alterados, cenários validados e pendências conhecidas.