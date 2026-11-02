# Ateliê

PWA pessoal de produtividade — tarefas, projetos, tempo/Pomodoro, carreira/contatos, finanças por projeto e personalização visual. **Local-first**, com autenticação e sincronização entre dispositivos via Supabase.

---

## Status

- **Fases 0–6 Concluídas:** Schema/RLS, auth Magic Link, onboarding, importação inicial, push (outbox), pull/merge e timer sincronizado (automatizado + validado manualmente em PC e mobile).
- **Próximas Fases:** Lembretes; Realtime; Storage para logo; Ledger de XP. Ver [docs/ROADMAP.md](./docs/ROADMAP.md).
- **Offline-First:** O app funciona 100% offline e sem necessidade de login. Configurações de tema e accent são **locais por dispositivo**.

---

## Início Rápido

- **Execução Local:** Abra `index.html` via servidor estático (ex.: `python -m http.server` dentro do diretório `atelier/`). *Nota: O Service Worker requer `http://localhost` ou conexões HTTPS.*
- **Produção:** Deploy automatizado via GitHub Pages em `https://capiel123.github.io/atelier/`.
- **Supabase:** Configure as credenciais em `supabase-config.js` (URL + chave publishable) e valide as URLs de redirecionamento no painel da Supabase.

---

## Estrutura de Arquivos

```text
atelier/
  ├── index.html, manifest.json, service-worker.js
  ├── estado.js, logica.js, interface.js, app.js
  ├── supabase-config.js, auth.js, onboarding.js, import-data.js, merge.js, sync.js
  ├── base.css, layout.css, componentes.css, paginas.css, responsivo.css
  ├── docs/                   # Documentação do sistema e componentes
  └── supabase/               # Migrations e scripts SQL (fora do bundle cliente)
```

> **Aviso de Arquitetura:** A ordem de carregamento dos scripts e folhas de estilo CSS no `index.html` constitui um **contrato estrito**. Verifique [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) antes de alterar a ordem de importação.

---

## Documentação e Mapa de Contexto

Este repositório adota **gerenciamento de contexto modular**. Consulte os documentos específicos listados abaixo de acordo com a camada que estiver modificando:

### Visão Geral e Arquitetura Central
| Documento | Descrição / Finalidade |
|---|---|
| [docs/README.md](./docs/README.md) | **Índice completo da documentação**, por assunto (design, UI, dados, guias, archive). |
| [docs/PROJECT_CONTEXT.md](./docs/PROJECT_CONTEXT.md) | **Ponto de entrada principal.** Resumo executivo, decisões arquiteturais e estado atual. |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | Módulos JavaScript, ordem de execução e contratos entre arquivos. |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Histórico por versão (`CACHE_VERSION`), com arquivos e validação. |
| [docs/KNOWN-ISSUES.md](./docs/KNOWN-ISSUES.md) | Dívidas técnicas, bugs conhecidos e limites aceitos. |
| [AGENTS.md](./AGENTS.md) | **Instruções estritas e guia de decisão para Agentes de IA/LLMs.** |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Planejamento de fases, backlog e marcos futuros. |

### Componentes e Especificações de Interface (UI/UX)
| Documento | Descrição / Finalidade |
|---|---|
| [docs/design/DESIGN-SYSTEM.md](./docs/design/DESIGN-SYSTEM.md) | **Índice de decisões de design:** princípios, paleta por tema, prioridade, ícones e checklist. |
| [docs/design/HEADER-TOP-MENU.md](./docs/design/HEADER-TOP-MENU.md) | Especificações do Header, Navegação (`#nav`), busca CSS, Timer e Nível/XP. |
| [docs/ui/DASHBOARD-WEEK-TAB.md](./docs/ui/DASHBOARD-WEEK-TAB.md) | Especificações do Card Resumo Semanal (`.week-summary-card`), estatísticas e faixa dos dias. |
| [docs/ui/WEEK-AND-TASK-CARDS.md](./docs/ui/WEEK-AND-TASK-CARDS.md) | Aba Semana, cards, fases, conclusão persistente e escopo da semana. |
| [docs/design/FONTES.md](./docs/design/FONTES.md) | **Governança tipográfica oficial:** uso exclusivo de fontes góticas no logo, fontes de leitura da interface e tokens. |
| [docs/design/TEMAS.md](./docs/design/TEMAS.md) | Catálogo e receita dos 14 temas, tokens CSS, direção de arte e identidade visual avançada. |
| [docs/AUDITORIA-UX-UI.md](./docs/AUDITORIA-UX-UI.md) | Fricções de UX priorizadas, sistema de tokens de cor e melhorias de usabilidade. |
| [docs/guides/JS_DOCS.md](./docs/guides/JS_DOCS.md) · [docs/design/CSS_DOCS.md](./docs/design/CSS_DOCS.md) | Mapeamento técnico detalhado dos seletores CSS e funções JS. |

### Modelagem de Dados, Regras e Regra de Negócio
| Documento | Descrição / Finalidade |
|---|---|
| [docs/data/DATA-MODEL.md](./docs/data/DATA-MODEL.md) | Esquema de dados local e remoto (Supabase). |
| [docs/data/BUSINESS-RULES.md](./docs/data/BUSINESS-RULES.md) | Regras de cálculo de XP, prazos, prioridades e ordenação. |
| [docs/guides/FUNCTIONAL-MAP.md](./docs/guides/FUNCTIONAL-MAP.md) | Mapeamento de funcionalidades por tela e ações do usuário. |
| [docs/data/DEPENDENCIES.md](./docs/data/DEPENDENCIES.md) | Matriz de dependência entre módulos e funções. |
| [docs/data/SUPABASE_ARCHITECTURE.md](./docs/data/SUPABASE_ARCHITECTURE.md) · [Mapeamento](./docs/data/SUPABASE_DATA_MAPPING.md) · [Schema](./docs/data/SUPABASE_SCHEMA.md) · [Plano](./docs/data/SUPABASE_IMPLEMENTATION_PLAN.md) | Arquitetura de sync, esquemas RLS, mapeamento e plano faseado do Supabase. |

---

## Testes e Validação

Os harnesses de testes automatizados são mantidos fora do diretório do app cliente (localizados na pasta do workspace `../`) para evitar poluição do bundle PWA.

- **Comando de Teste de Merge:** `node _sync_merge_test.js`
- **Checklist Completo:** Verifique [docs/TEST-CHECKLIST.md](./docs/TEST-CHECKLIST.md) para execução dos cenários de teste manuais e integrados.

---

## Diretrizes Fundamentais

1. **O Código é a Fonte da Verdade:** Documentos servem como mapas contextuais; inspecione sempre a implementação antes de fazer suposições.
2. **Preservação de Dados e IDs:** Nunca destrua chaves de `localStorage` ou IDs sem migração e plano de recuperação explícitos.
3. **PWA & Cache Integrity:** Ao modificar arquivos estáticos do shell (`HTML`, `CSS`, `JS`), atualize a variável `CACHE_VERSION` no `service-worker.js`.