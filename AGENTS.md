# Ateliê — instruções para agentes de código

## Contexto
Ateliê é uma aplicação pessoal de produtividade, hoje implementada com HTML, CSS e JavaScript sem framework/build step. O produto combina planejamento semanal, tarefas e subtarefas, projetos, tempo de execução, carreira, contatos, finanças por projeto e personalização visual. A versão documentada usa `localStorage` como persistência principal.

A prioridade é evoluir a aplicação real em passos pequenos, preservando dados, comportamento, visual e funcionamento offline. Não reconstruir o projeto do zero nem converter a arquitetura inteira por preferência técnica.

## Antes de alterar
1. Leia `docs/README.md`, `docs/PROJECT_CONTEXT.md` e a documentação relevante; consulte também as 3 últimas entradas de `docs/HANDOFF.md`.
2. Inspecione o código real antes de confiar em nomes, localização de funções ou documentação antiga.
3. Identifique o fluxo de dados e as dependências da funcionalidade afetada. Consulte `docs/DEPENDENCIES.md` e `docs/BUSINESS-RULES.md`.
4. Antes de uma mudança com impacto em dados, persistência, CSS global, arquivos de inicialização ou PWA, explique plano, arquivos afetados, riscos e como validar.
5. O João faz backup copiando a pasta antes de mudanças relevantes: peça a confirmação do backup antes de editar e não execute git.

## Regras de mudança
- Prefira o menor diff coerente possível; uma solicitação = um escopo principal.
- Não refatore arquivos não relacionados, não renomeie APIs internas em massa e não remova código só porque parece redundante sem demonstrar que é seguro.
- Preserve compatibilidade com os dados existentes, IDs, relacionamentos, migrações e formato dos backups, salvo autorização para uma mudança de esquema com migração explícita.
- Não invente dependências, scripts de build ou testes que não existam. O app em `atelier/` não tem `package.json` nem build step; os harnesses automatizados são arquivos `_*_test.js` em `default-workspace/` (um nível acima de `atelier/`), fora do app publicado.
- Não altere a hierarquia visual, os temas, a logomarca configurável, o layout responsivo ou a identidade gótico-dark sem que isso faça parte do pedido.
- Se uma função mutável nova for adicionada ao roteador de ações, confira se ela precisa entrar em `MUTATING_ACTIONS` para que o snapshot de `Ctrl+Z` funcione.
- Ao editar HTML, preserve sanitização/escape de dados dinâmicos usando os padrões existentes (`esc` e helpers correspondentes). Evite interpolar conteúdo do usuário sem escape.
- Se alterar CSS, respeite a divisão por responsabilidade descrita em `CSS_DOCS.md`; evite resolver um problema local com regras globais ou excesso de `!important`.
- Se qualquer arquivo de shell do PWA mudar (HTML, CSS, JS ou manifest), verifique `service-worker.js`: a versão do cache precisa ser atualizada conforme a convenção atual e os recursos essenciais precisam continuar no precache.

## Regras de UI/UX

### Mobile (≤640px) — regras permanentes
- Mudanças mobile só em `@media(max-width:640px)` de `responsivo.css`, em bloco novo no fim do arquivo. Não consolidar nem reordenar blocos existentes (há muito `!important`; ao sobrescrever, conferir a cascata).
- Não alterar desktop nem a faixa 641–1023px sem pedido explícito (essa faixa não tem regra própria: usa o layout base).
- Preferir CSS. Se exigir mudar template em `interface.js`, parar e pedir confirmação. Não alterar `app.js`/`sync.js` por efeito visual.
- Não renomear nem remover `#qa`, `#qaJob`, `#fab`, `#syncPill`, `#cloudPill`, ações `data-a` nem ids/classes usados pelo JS (o FAB usa MutationObserver).
- Cores por tokens do tema (`--bg`, `--s1..3`, `--bd`, `--tx`, `--mu`, `--ac`, `--bu`, `--ok`, `--wr`, `--er`); evitar hex fixo. Validar em ≥3 temas (Obsidiana, Vampiro e Osso (bege escuro) e, quando existir, Osso Profundo Claro).
- Evitar caixas dentro de caixas; só o card de tarefa tem elevação/borda forte.
- Alvos de toque ≥44px de altura. Exceção consciente: "Ver resumo e filtros" (≤32px).
- Rolagem é da página: sem `overflow-y` interno na lista. Elementos fixos usam `position: sticky` com `top` por variáveis CSS.
- O espaço inferior da lista deve deixar o último card acima do FAB (topo do FAB + 16px + `env(safe-area-inset-bottom)`).
- Pílulas de status: mudança só visual; erro, pausa, offline e pendente nunca podem ficar ocultos.

### Temas e tokens
- Os 11 temas legados são preservados. `bone` (Osso) é **tema escuro**, com fundo bege muito escuro `#0E0D0B`; não existe tema claro legado.
- Novas paletas planejadas: Osso Profundo (`deepbone`), Cromo (`chrome`) e Osso Profundo Claro (`deepbone-light`). O plano fica em `docs/PLANO-TEMAS-ESTETICA.md`.
- Eixos estruturais: `mode` (`dark` | `light`) e `look` (`brutal`). O estilo Metal é `look=brutal` + `mode=dark`.
- Tema sem `data-look` não muda de aparência, exceto no FAB, no ruído de fundo e nos tokens de prioridade/pílulas (decisão 20).
- Texto e estados usam tokens com fallback; `--on-ac` substitui `#000` sobre o accent.
- `THEMES` aceita chaves opcionais (`tx`, `mu`, `ok`, `wr`, `er`, `onAc`, `mode`, `look`, `radius`, `radiusSm`, `radiusPill`, `bevel`, `noise`, `prHigh`, `prMed`, `prLow`, `surfaceCard`, `surfacePanel`, `fontDisplay`, `fontMono`, `titleTrack`); na ausência delas valem `base.css`/fallback.
- Validação obrigatória nos 6 temas: Obsidiana, Vampiro, Osso, Osso Profundo, Cromo e Osso Profundo Claro.
- O plano só deve ser implementado após aprovação da tabela de parâmetros e dos contrastes.

### Aba Semana — reforma em andamento (Etapas 1–6 aplicadas; ver `docs/HANDOFF.md`)
- Alvos, medidas e decisões em `docs/PLANO-UI-SEMANA.md`. Não aplicar esses números a outras abas.

### Desktop
- Confirmado: `#nav` sticky só em `min-width:1024px`; `header` estático; `.week-collapsible` sempre visível; cards completos.
- Não alterar o desktop como efeito colateral de mudança mobile.

## Dados e segurança
- Antes de modificar persistência, migração, exclusão, importação/exportação ou modelo de dados: exigir backup verificável e plano de recuperação; testar em cópia dos dados.
- Não substituir dados locais com dados remotos sem uma estratégia explícita de conflito e recuperação.
- Não colocar segredos de servidor no frontend. A integração Supabase já existe: o cliente contém apenas a chave publishable/anon, com RLS por usuário; chaves secret/service-role ficam no backend.
- A integração legada `window.claude` não é o Supabase. Para usuário autenticado há sincronização remota ativa (push/pull/merge); sem login o app segue local. Consulte `docs/ARCHITECTURE.md`.

## Passagem de trabalho entre agentes
- Ao começar: ler as 3 últimas entradas de `docs/HANDOFF.md`.
- Ao terminar: escrever uma entrada no topo com data, agente, arquivos alterados, o que não foi testado e pendências.

## Depois de alterar
1. Explique o que mudou e por quê, arquivo por arquivo (sem `git`).
2. Rode os harnesses relevantes quando o Node estiver disponível e siga `docs/TEST-CHECKLIST.md` nos fluxos afetados.
3. Informe testes não executados e limitações conhecidas; nunca alegue que algo passou sem tê-lo executado.
4. Atualize apenas a documentação que ficou desatualizada.
5. Não publique/deploy automaticamente sem autorização.

## Estado versus roadmap
O estado implementado e o plano futuro são diferentes. Supabase (Fases 1–6), autenticação Magic Link e onboarding de três telas já estão implementados; lembretes e as demais funções futuras listadas em `docs/ROADMAP.md` não devem ser tratados como recursos existentes. Existe um registro mínimo de trabalho por tarefa/dia em `S.workLogs` (Fase 5), mas o "diário de execução" completo do roadmap (duração, linha do tempo diária, progresso entregue separado) ainda não existe.
