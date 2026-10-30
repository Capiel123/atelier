# Ateliê

PWA pessoal de produtividade — tarefas, projetos, tempo/Pomodoro, carreira/contatos, finanças por projeto e personalização visual. **Local-first**, com autenticação e sincronização entre dispositivos via Supabase.

## Status

- Fases 0–6 concluídas: schema/RLS, auth Magic Link, onboarding, importação inicial, push (outbox), pull/merge e timer sincronizado (automatizado + validado manualmente em PC e celular).
- **Próximas:** lembretes; Realtime; Storage para logo; ledger de XP. Ver [docs/ROADMAP.md](docs/ROADMAP.md).
- App funciona offline e sem login. Tema e accent são **locais por dispositivo**.

## Início rápido

- **Abrir localmente:** `index.html` em um servidor estático (ex.: `python -m http.server` dentro de `atelier/`). O service worker exige `http://localhost` ou HTTPS.
- **Produção:** GitHub Pages em `https://capiel123.github.io/atelier/`.
- **Supabase:** preencher `supabase-config.js` (URL + chave publishable) e configurar Redirect URLs no painel.

## Estrutura

```
atelier/
  index.html, manifest.json, service-worker.js
  estado.js, logica.js, interface.js, app.js,
  supabase-config.js, auth.js, onboarding.js,
  import-data.js, merge.js, sync.js
  base.css, layout.css, componentes.css, paginas.css, responsivo.css
  docs/            documentação
  supabase/        migrations e testes SQL (não servidos ao app)
```

Ordem de carga dos scripts e do CSS é **contrato** — ver `docs/ARCHITECTURE.md`.

## Documentação

| Documento | Para quê |
|---|---|
| [docs/PROJECT_CONTEXT.md](docs/PROJECT_CONTEXT.md) | **Comece aqui.** Resumo central, decisões, estado e regras. |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitetura atual e responsabilidades dos módulos. |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases, estado atual e próximos itens. |
| [docs/AUDITORIA-UX-UI.md](docs/AUDITORIA-UX-UI.md) | Auditoria de UX/UI: fricções priorizadas, propostas, lacunas e roadmap. |
| [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md) | Testes automatizados e validação manual. |
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) · [docs/BUSINESS-RULES.md](docs/BUSINESS-RULES.md) · [docs/FUNCTIONAL-MAP.md](docs/FUNCTIONAL-MAP.md) · [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) | Dados, regras, mapas e riscos. |
| [docs/GUIA-PESSOAL.md](docs/GUIA-PESSOAL.md) · [docs/GUIA-FILA.md](docs/GUIA-FILA.md) · [docs/GUIA-REDE.md](docs/GUIA-REDE.md) · [docs/GUIA-AMIZADES.md](docs/GUIA-AMIZADES.md) | Guias explicativos. |
| [SUPABASE_IMPLEMENTATION_PLAN.md](SUPABASE_IMPLEMENTATION_PLAN.md) · [SUPABASE_ARCHITECTURE.md](SUPABASE_ARCHITECTURE.md) · [SUPABASE_DATA_MAPPING.md](SUPABASE_DATA_MAPPING.md) · [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md) | Detalhes da integração/sincronização. |
| [JS_DOCS.md](JS_DOCS.md) · [CSS_DOCS.md](CSS_DOCS.md) | Mapas de código. |
| [AGENTS.md](AGENTS.md) | Regras obrigatórias para agentes de código. |
| [docs/archive/](docs/archive/) | Documentos históricos (não são referência atual). |

## Testes

Harnesses Node ficam **fora** do app (em `default-workspace/`, um nível acima de `atelier/`) e são executados manualmente, ex.: `node _sync_merge_test.js`. Lista completa em [docs/TEST-CHECKLIST.md](docs/TEST-CHECKLIST.md).

## Regras rápidas

- Código é a fonte de verdade; documentação é mapa.
- Preservar dados/IDs/backups; não expor `service_role`; RLS no servidor.
- Ao mudar arquivos do shell, atualizar `CACHE_VERSION` e `SHELL_ASSETS`.
- Não declarar teste validado sem tê-lo executado.
