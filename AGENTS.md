# Ateliê — instruções para agentes de código

## Contexto
Ateliê é uma aplicação pessoal de produtividade, hoje implementada com HTML, CSS e JavaScript sem framework/build step. O produto combina planejamento semanal, tarefas e subtarefas, projetos, tempo de execução, carreira, contatos, finanças por projeto e personalização visual. A versão documentada usa `localStorage` como persistência principal.

A prioridade é evoluir a aplicação real em passos pequenos, preservando dados, comportamento, visual e funcionamento offline. Não reconstruir o projeto do zero nem converter a arquitetura inteira por preferência técnica.

## Antes de alterar
1. Leia `MAP.md` se existir; leia `docs/README.md` e a documentação relevante. O ZIP estável analisado nesta documentação não continha `MAP.md`; se o arquivo for adicionado depois, use-o como mapa auxiliar e valide-o no código.
2. Inspecione o código real antes de confiar em nomes, localização de funções ou documentação antiga.
3. Identifique o fluxo de dados e as dependências da funcionalidade afetada. Consulte `docs/DEPENDENCIES.md` e `docs/BUSINESS-RULES.md`.
4. Antes de uma mudança com impacto em dados, persistência, CSS global, arquivos de inicialização ou PWA, explique plano, arquivos afetados, riscos e como validar.

## Regras de mudança
- Prefira o menor diff coerente possível; uma solicitação = um escopo principal.
- Não refatore arquivos não relacionados, não renomeie APIs internas em massa e não remova código só porque parece redundante sem demonstrar que é seguro.
- Preserve compatibilidade com os dados existentes, IDs, relacionamentos, migrações e formato dos backups, salvo autorização para uma mudança de esquema com migração explícita.
- Não invente dependências, scripts de build ou testes que não existam. O projeto atual não inclui `package.json` nem suíte de testes automatizados no conjunto analisado.
- Não altere a hierarquia visual, os temas, a logomarca configurável, o layout responsivo ou a identidade gótico-dark sem que isso faça parte do pedido.
- Se uma função mutável nova for adicionada ao roteador de ações, confira se ela precisa entrar em `MUTATING_ACTIONS` para que o snapshot de `Ctrl+Z` funcione.
- Ao editar HTML, preserve sanitização/escape de dados dinâmicos usando os padrões existentes (`esc` e helpers correspondentes). Evite interpolar conteúdo do usuário sem escape.
- Se alterar CSS, respeite a divisão por responsabilidade descrita em `CSS_DOCS.md`; evite resolver um problema local com regras globais ou excesso de `!important`.
- Se qualquer arquivo de shell do PWA mudar (HTML, CSS, JS ou manifest), verifique `service-worker.js`: a versão do cache precisa ser atualizada conforme a convenção atual e os recursos essenciais precisam continuar no precache.

## Dados e segurança
- Antes de modificar persistência, migração, exclusão, importação/exportação ou modelo de dados: exigir backup verificável e plano de recuperação; testar em cópia dos dados.
- Não substituir dados locais com dados remotos sem uma estratégia explícita de conflito e recuperação.
- Não colocar segredos de servidor no frontend. Em uma futura integração Supabase, o cliente pode conter apenas chave publishable adequada ao frontend e políticas RLS corretas; chaves secret/service-role devem ficar no backend.
- Não presumir que a integração legada `window.claude` seja Supabase ou que haja sincronização remota ativa. Consulte `docs/ARCHITECTURE.md`.

## Depois de alterar
1. Revise o diff e explique o que mudou e por quê.
2. Execute verificações disponíveis. Na ausência de testes automatizados, rode pelo menos verificações de sintaxe nos JS alterados e siga `docs/TEST-CHECKLIST.md` nos fluxos afetados.
3. Informe testes não executados e limitações conhecidas; nunca alegue que algo passou sem tê-lo executado.
4. Atualize apenas a documentação que ficou desatualizada.
5. Faça commit pequeno e descritivo depois da revisão humana; não publique/deploy automaticamente sem autorização.

## Estado versus roadmap
O estado implementado e o plano futuro são diferentes. Supabase, autenticação, onboarding de três telas, aba de lembretes, diário de execução e funções futuras listadas em `docs/ROADMAP.md` não devem ser tratados como recursos já existentes.
