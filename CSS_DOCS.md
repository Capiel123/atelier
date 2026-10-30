# Guia de CSS — Ateliê (estrutura atual)

Este arquivo substitui o mapa antigo que tratava os estilos como um conjunto menos fragmentado. No snapshot analisado, há **cinco folhas de estilo**, carregadas nesta ordem em `index.html`:

```html
<link rel="stylesheet" href="./base.css">
<link rel="stylesheet" href="./layout.css">
<link rel="stylesheet" href="./componentes.css">
<link rel="stylesheet" href="./paginas.css">
<link rel="stylesheet" href="./responsivo.css">
```

A ordem define parte da cascata. `responsivo.css` contém refinamentos posteriores que sobrescrevem regras anteriores conforme a viewport.

> **Planejado (não implementado):** a reforma mobile da aba Semana prevê um bloco novo no fim de `responsivo.css`, sem consolidar os blocos existentes. Ver [`docs/PLANO-UI-SEMANA.md`](docs/PLANO-UI-SEMANA.md).

## Mapa por arquivo

### `base.css` — fundação global

Responsável por tokens CSS padrão (`:root`), dimensões de base, `box-sizing`, corpo, tipografia geral, botões, inputs, selects, textareas, `details`, `summary` e títulos. É o arquivo de maior alcance: mudanças aqui podem alterar todas as telas.

Use para: tokens globais novos, reset, estilos universais e controles padrão.

Evite: estilos exclusivos de uma única tela e ajustes específicos de mobile.

### `layout.css` — estrutura da página

Contém o contêiner principal, header/logo, botão de busca, barra de nível, widget do timer, navegação principal, cabeçalho/seletor de dias, áreas de título e navegação inferior/menu “Mais” mobile.

Use para: geometria do app, posicionamento estrutural, header e navegação.

### `componentes.css` — componentes reutilizáveis

Agrupa estilos de elementos que aparecem em várias views: indicador `sync-pill`, banners, seletor de energia, card de próximo compromisso, formulário rápido, cards/checkboxes/ações, subtarefas, formulários, mini-calendário, toasts, filtros, badges, KPIs, gráficos, heatmap, toggles e pílulas de habilidades/labels.

Use para: uma peça reutilizável usada em várias telas, sem ser específica de uma página.

### `paginas.css` — telas e recursos

Contém regras específicas de revisão, modo foco, modal de atalhos, busca, vagas, contatos/rede, histórico, temas, configurações, áreas e lixeira. A lista exata de seletores deve ser confirmada no arquivo, pois o CSS evolui junto das views de `interface.js`.

Use para: visual exclusivo de uma feature/tela, overlays ou blocos de configuração.

### `responsivo.css` — breakpoints e refinamentos

Contém regras mobile (incluindo `max-width:640px`), desktop (`min-width:1024px`), fallback quando `backdrop-filter` não está disponível, área clicável de checkboxes, comportamento do FAB, redução de movimento via `prefers-reduced-motion` e refinamentos finais. Existem vários blocos media query separados; isso não deve ser consolidado por rotina sem provar que a cascata e o visual continuarão iguais.

Use para: comportamento por viewport, adaptação mobile/desktop e preferências de acessibilidade.

## Tokens e temas

Os tokens padrão aparecem em `base.css`, mas `estado.js`/`applyTheme()` substitui dinamicamente parte deles a partir de `THEMES`:

- `--bg`: fundo global.
- `--s1`, `--s2`, `--s3`: níveis de superfície.
- `--bd`: borda.
- `--tx`: texto primário.
- `--mu`: texto secundário/muted.
- `--ac`: cor de destaque, ajustável pelo accent personalizado.
- `--bu`: cor secundária/brand.
- `--ok`, `--wr`, `--er`: estados semânticos (sucesso, alerta, erro).
- `--chk-bg`, `--chk-bd`, `--chk-done`, `--chk-mark`: checkbox temático.
- `--radius`, `--radius-sm`, `--radius-pill`: raios de cards, controles/chips e pílulas. Fallbacks atuais: `12px`, `8px`, `16px`.
- `--dot-radius`: raio dos pontos de prioridade e das pílulas. `50%` nos temas legados; `0` no look brutal.
- `--bevel`: tamanho do chanfro do look brutal (cards); `--bevel-sm` é derivado para controles (4px; 3px no Cromo).
- `--surface-card`, `--surface-panel`: fundos de cards de conteúdo e de painéis (menus, modais, folhas e navegação). Fallback `var(--s1)` nos temas legados. No tema claro, `--surface-card` é mais claro que `--bg` e `--surface-panel` é mais escuro.
- `--noise-opacity`: opacidade do grão de fundo. `0` nos temas legados; `0.035`–`0.05` nos temas brutal.

`THEMES` define **14 temas**: os 11 legados — Obsidiana (`obsidian`), Vampiro (`vampire`), Oculto (`occult`), Noir (`noir`), Cianótico (`cyanotic`), Tóxico (`toxic`), Brasa (`ember`), Luar (`moonlight`), Rosa Morta (`rose`), Abismo (`abyss`) e Osso (`bone`) — e os três novos: Osso Profundo (`deepbone`), Cromo (`chrome`) e Osso Profundo Claro (`deepbone-light`). A logo é configurável à parte.

Ao criar seletor visual ou componente, usar os tokens quando a cor deve acompanhar o tema. Evitar cores hardcoded em elementos gerais; cores hardcoded podem continuar apropriadas para semântica específica (por exemplo, categorias codificadas por cor), desde que isso seja intencional.

### Superfícies e ruído

- Cards de conteúdo usam `var(--surface-card,var(--s1))`; painéis usam `var(--surface-panel,var(--s1))`. Nos temas legados, ambos resolvem para `--s1` e nada muda.
- No tema claro (`deepbone-light`), o card é mais claro que o fundo e o painel é mais escuro. Os valores são tokens explícitos do tema, não `color-mix` com preto/branco.
- O grão fica em `body::before` (`position:fixed`, `z-index:-1`, `pointer-events:none`) dentro do stacking context criado por `isolation:isolate` no `body`. Ele é apenas fundo: não intercepta toque/rolagem e não é pintado por cima de texto ou cards.
- `--noise-opacity` ausente ou `0` mantém a camada invisível. Não usar `mix-blend-mode` nessa camada.

### Ícones desenhados em CSS

- A lupa de `.search-btn` é universal (não depende de `data-look`): círculo em `::before` e haste em `::after`, ambos em `currentColor`, com traço de 1.5px. O `::after` também fornece o alvo de toque de 44px de altura.
- No look brutal, `componentes.css` redesenha `✕` e `+` com `background-image` em gradiente e `font-size:0`. A regra vale apenas para botões inequivocamente icon-only, listados por `data-a`; não usar em ações que também aparecem com texto.
- Ao desenhar um ícone novo por CSS: usar `currentColor`, manter traço de 1.5px, não ocupar o `::before` de botões que já o usam como hitbox e confirmar que o glifo não muda por estado/template. Caso mude, apenas reportar — a correção exige template ou JavaScript.

## Como decidir onde colocar uma regra

1. Aplica a tudo? `base.css`.
2. Controla o esqueleto/posicionamento global? `layout.css`.
3. É um componente comum entre telas? `componentes.css`.
4. Só existe numa tela/recurso específico? `paginas.css`.
5. Só muda por tamanho de viewport ou preferência de movimento? `responsivo.css`.

Se a regra afeta um componente comum apenas em mobile, a regra base pode ficar em `componentes.css` e seu override em `responsivo.css`.

## Procedimento para uma alteração de estilo

1. Encontre a classe no HTML template de `interface.js`.
2. Procure o seletor nos cinco arquivos, não apenas no arquivo esperado.
3. Entenda ordem, especificidade, estados hover/active/disabled e regras mobile.
4. Faça alteração mínima no arquivo de responsabilidade correta.
5. Confira desktop e mobile, pelo menos dois temas com cores diferentes e conteúdo curto/longo.
6. Verifique clipping/overflow, foco de teclado, contraste e `prefers-reduced-motion` se houver animação.
7. Remova regra antiga somente depois de confirmar ausência de usos.

## Fragilidades a observar

- `responsivo.css` tem vários blocos para o mesmo breakpoint. A ordem pode ser deliberada; não consolidar automaticamente.
- Overrides com `!important` e seletores mais específicos podem ser necessários hoje, mas cada adição aumenta a dificuldade de manutenção.
- Um estilo visual baseado em cor hardcoded pode não acompanhar temas customizados.
- Mudanças em `base.css` ou tokens devem ser testadas no aplicativo inteiro, não só numa tela.
- Depois de publicar alteração no CSS, conferir `CACHE_VERSION` e o teste em PWA instalada.

## Revisão da documentação antiga

Este guia substitui a descrição antiga que tratava seletores/tokens em grandes blocos funcionais sem enfatizar a divisão atual em cinco arquivos. Ele não lista todo seletor individual, porque isso envelhece rapidamente; para localizar uma classe específica, faça busca global no repositório.
