# Guia rápido: gastar menos tokens com o Ateliê

Ordem de grandeza (1 token ≈ 4 caracteres): `app.js` ≈ 52 mil tokens, `styles.css` ≈ 10 mil, `MAP.md` ≈ 1,6 mil, uma função típica ≈ 300 a 800. Em cada mensagem, a conversa inteira é relida; o que você escreve e o que eu respondo contam.

## 1. Rotina de cada pedido
1. Abra um **chat novo** por tarefa (conversa longa custa mais a cada mensagem).
2. Envie **MAP.md + só a(s) função(ões)** envolvida(s): `./fn.sh computeTaskScore` e cole o resultado.
3. Descreva em 3 linhas: **Onde / Esperado / Obtido** (e o erro do console, se houver).
4. Peça: *"Devolva só a função corrigida (ou só as regras CSS novas), sem reescrever o resto e sem explicação longa."*
5. Aplique, teste, e peça no mesmo chat: *"Acrescente 1 linha ao MAP.md sobre esse patch."*

## 2. O que nunca enviar
- O `app.js` ou o HTML inteiro, o zip, a pasta `backup/` ou o JSON de backup (traz seus dados e pesa 120 KB).
- Prints em tela cheia repetidos: recorte a área do problema.

## 3. Controle de saída (a parte mais cara)
- Peça diff ou "trecho antigo → trecho novo", nunca o arquivo completo.
- Para ideias grandes, peça primeiro um **plano em 5 linhas**; só depois a implementação.
- Agrupe pedidos da **mesma área** numa mensagem. Não misture CSS de mobile com lógica de vagas.

## 4. Quando `app.js` crescer
- Quebre em arquivos por domínio (carregados por várias `<script>`): `core.js` (estado, migração, utilitários), `tasks.js`, `career.js` (vagas, projetos, clientes, rendimento), `network.js` (contatos), `ui.js` (modais, eventos). Um bug em vagas passa a custar ~10 mil tokens, não 52 mil.
- Faça o mesmo com o CSS (`base.css`, `components.css`, `views.css`) se passar de ~60 KB.
- Mantenha o MAP.md com **o nome do arquivo ao lado de cada função**.

## 5. Manutenção do MAP.md
- Uma linha por função nova. Cole só o diff do MAP junto com o pedido seguinte.
- Marque no topo do MAP a versão atual e a data do último patch.

## 6. Pedido-modelo (copie e cole)
> Contexto: MAP.md em anexo. Função atual: [cole]. Esperado: … Obtido: … Devolva só a função corrigida, diga em 1 linha se mais algum ponto precisa mudar.
