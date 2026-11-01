# Ateliê — Diretrizes de Engenharia e Gerenciamento de Contexto para Agentes de Código

---

## 1. Carregamento Seletivo de Contexto (Context-Window Optimization)

Para evitar degradação de performance por estouro ou poluição de contexto, siga este **mapa de decisão** antes de carregar ou editar arquivos:

```text
SUA TAREFA ENVOLVE...                    CARREGUE E CONSULTE...
├─ Header, Timer, Logo ou Nav Topo   ──> docs/header_menu_superior_docs.md + layout.css
├─ Card Resumo / Dashboard Semanal   ──> docs/dashboard_superior_docs.md + responsivo.css
├─ CSS Mobile (≤640px) ou Breakpoints ─> responsivo.css (final do arquivo) + CSS_DOCS.md
├─ Estado Local, Sync ou Supabase    ──> estado.js + sync.js + docs/DATA-MODEL.md
├─ Estrutura do App / Módulos JS     ──> docs/ARCHITECTURE.md + JS_DOCS.md
└─ Regras de Negócio e XP            ──> logica.js + docs/BUSINESS-RULES.md
```

---

## 2. Protocolo de Pré-Alteração (Checklist Obrigatório)

Antes de efetuar qualquer alteração no repositório, execute sequencialmente:

1. **Leitura de Contexto:** Consulte `docs/PROJECT_CONTEXT.md` e verifique o painel em `docs/HANDOFF.md`.
2. **Inspeção Direta do Código:** Confirme no código real o estado de assinaturas de funções, seletores CSS e eventos (não confie apenas em memórias de conversas anteriores).
3. **Análise de Impacto de Dados:** Se a alteração envolver a camada de armazenamento (`estado.js`, `localStorage`, `Supabase`), mapeie dependências em `docs/DEPENDENCIES.md`.
4. **Confirmação de Backup:** Certifique-se com o desenvolvedor de que há backup recente antes de alterações com refatoração profunda ou mutações de estrutura de banco.

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

### Sistema de Temas e Tokens Coloridos
- Utilize exclusivamente tokens CSS de tema (`var(--bg)`, `var(--s1..3)`, `var(--bd)`, `var(--tx)`, `var(--mu)`, `var(--ac)`, `var(--bu)`, `var(--ok)`, `var(--wr)`, `var(--er)`). Evite cores hexadecimais fixas inline.
- **Preservação de Escopo de Efeitos:** Efeitos visuais avançados como `background-clip: text`, gradientes metálicos e `text-shadow` intensos são **estritamente restritos** ao elemento `.logo-text`. Nunca aplique essas propriedades a títulos de leitura (`.tt`, `h2`, `inputs`).
- **Validação Cruzada de Temas:** Sempre valide alterações visuais nos 6 temas principais do sistema: *Obsidiana*, *Vampiro*, *Osso*, *Osso Profundo*, *Cromo* e *Osso Profundo Claro*.

---

## 5. Passagem de Trabalho entre Agentes (Handoff Protocol)

1. **Ao Iniciar:** Leia o estado em `docs/HANDOFF.md` e revise as entradas mais recentes de `docs/archive/HANDOFF-HISTORICO.md`.
2. **Ao Concluir:** 
   - Resuma os arquivos alterados e a justificativa técnica de cada mudança.
   - Atualize o arquivo `docs/HANDOFF.md`.
   - Adicione o registro histórico no topo de `docs/archive/HANDOFF-HISTORICO.md` contendo: data, agente responsável, arquivos alterados, cenários validados e pendências conhecidas.