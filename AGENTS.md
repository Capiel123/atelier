# Ateliê — Diretrizes de Engenharia e Gerenciamento de Contexto para Agentes de Código

---

## 1. Carregamento Seletivo de Contexto (Context-Window Optimization)

Para evitar degradação de performance por estouro ou poluição de contexto, siga este **mapa de decisão** antes de carregar ou editar arquivos:

```text
SUA TAREFA ENVOLVE...                    CARREGUE E CONSULTE...
├─ Header, Timer, Logo ou Nav Topo   ──> docs/design/HEADER-TOP-MENU.md + layout.css
├─ Cabeçalho do dia / resumo         ──> docs/ui/DASHBOARD-WEEK-TAB.md §0 + responsivo.css
├─ Semana, cards e conclusão         ──> docs/ui/WEEK-AND-TASK-CARDS.md + logica.js
├─ Fila                              ──> docs/guides/GUIA-FILA.md
├─ Foco ou Pomodoro                  ──> docs/ui/MODO-FOCO-E-TIMER.md + docs/ui/TIMER.md
├─ Histórico                         ──> docs/ui/HISTORICO-TAB.md
├─ Avisos e busca global             ──> docs/ui/AVISOS-E-BUSCA.md + interface.js
├─ CSS Mobile (≤640px)               ──> responsivo.css (final) + docs/design/CSS_DOCS.md
├─ Temas, Nordic ou Herbário         ──> docs/design/TEMAS.md + o plano aberto em docs/design/
├─ Estado, sync ou Supabase          ──> estado.js + sync.js + docs/data/DATA-MODEL.md
├─ Um termo ou uma chave local       ──> docs/GLOSSARIO.md ou docs/CHAVES.md
├─ Qual teste rodar                  ──> docs/TESTES.md
├─ Módulos JS                        ──> docs/ARCHITECTURE.md + docs/guides/JS_DOCS.md
└─ Regras de negócio e XP            ──> logica.js + docs/data/BUSINESS-RULES.md
```

Leitura obrigatória de qualquer alteração: `docs/HANDOFF.md` e **um** documento da árvore acima. `CHANGELOG.md` e `KNOWN-ISSUES.md` entram por versão ou por ID (`Kxx`/`Fxx`), não inteiros. `docs/archive/` fica fora do caminho.

---

## 2. Protocolo de Pré-Alteração (Checklist Obrigatório)

Antes de efetuar qualquer alteração no repositório, execute sequencialmente:

1. **Estado:** Leia `docs/HANDOFF.md`. Decisões estáveis estão em `docs/PROJECT_CONTEXT.md` §5; abra esse arquivo só se a mudança puder revertê-las.
2. **Dívida:** Se o pedido parece um bug já visto, busque o ID em `docs/KNOWN-ISSUES.md` em vez de ler o arquivo todo.
3. **Versão:** Se precisar saber quando a área mudou, leia a entrada daquela versão no topo de `docs/CHANGELOG.md`.
4. **Código:** Confirme assinaturas, seletores e eventos no arquivo real.
5. **Dados:** Se mexer em `estado.js`, `localStorage` ou Supabase, leia `docs/CHAVES.md` e `docs/data/DEPENDENCIES.md`.
6. **Backup:** Confirme com o desenvolvedor que há backup recente antes de refatoração profunda ou mudança de schema.

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
- **Validação de tema:** valide a alteração na família que você mudou (`data-family`) e em Obsidiana. São 18 temas; a contagem viva está em `THEMES` (`estado.js`).

---

## 5. Passagem de Trabalho entre Agentes (Handoff Protocol)

1. **Ao iniciar:** leia `docs/HANDOFF.md` e o documento da tarefa. O histórico em `docs/archive/` só entra se uma decisão antiga não estiver no changelog.
2. **Ao concluir:**
   - Três bullets no `docs/HANDOFF.md`: o que mudou, o que ficou aberto, o que foi validado. Sem recontar versões antigas. Teto de 80 linhas; se passar, mova o miolo para o changelog.
   - Se o shell mudou (HTML, CSS, JS, manifest), entrada no topo de `docs/CHANGELOG.md` e incremento de `CACHE_VERSION`.
   - Se fechou ou abriu dívida, atualize só o item em `docs/KNOWN-ISSUES.md`.
   - Não edite `docs/archive/`. O changelog é o registro.