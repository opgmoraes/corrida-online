# Corrida Online 0.4 — você e até três amigos

Servidor Node.js com quatro salas privadas, painel e overlay responsivo. Cada sala tem conexão TikTok, corrida, placar e configurações separados. A tela de transmissão tem uma chave somente de leitura. O código está preparado para Render Free; esta preparação não confirma uma publicação.

## Uso após publicar

1. Abra o endereço do serviço no Render.
2. Informe a chave APP_SECRET, disponível nas variáveis de ambiente do serviço. Ela é a chave administrativa; compartilhe apenas os links das salas com seus amigos.
3. Abra o painel da sala 1 para você. Envie os painéis das salas 2, 3 e 4 para seus amigos.
4. Cada pessoa informa seu usuário TikTok sem @ e salva.
5. Copie o link da transmissão pelo botão do painel. Use em uma fonte Navegador do OBS (1080×1920) ou abra no navegador e capture a janela no LIVE Studio.
6. Teste primeiro pelo botão Iniciar teste local. Escolha 1/2 e simule presentes.
7. Antes da live real, encerre o teste e aguarde a live. Ao conectar, o motor começa sozinho. O aplicativo não inicia a transmissão do TikTok por você.

## Publicação gratuita no Render

- Envie este projeto para um repositório GitHub próprio. Não envie node_modules, data ou arquivos .env reais.
- Use um serviço Web Node, plano Free, build npm ci --omit=dev, start npm start.
- render.yaml contém a mesma configuração e gera APP_SECRET. O Render fornece RENDER_EXTERNAL_HOSTNAME automaticamente. Se usar outro provedor, configure PUBLIC_URL com o endereço HTTPS correto.
- APP_SECRET precisa permanecer igual para os links privados continuarem funcionando. Alterar a chave invalida todos os links anteriores.
- Health check: /health. O servidor escuta 0.0.0.0 na porta PORT em produção.
- Não contrate banco, disco ou plano pago para este protótipo.

## Configurações e plano gratuito

O Render Free pode suspender o serviço após inatividade. Antes da live, abra o painel e confira a conexão; o primeiro carregamento pode demorar. Não há garantia de detectar uma live enquanto o serviço estiver suspenso.

O filesystem gratuito é temporário. As configurações em data/salaN.json podem desaparecer quando o serviço reiniciar/republicar. O painel guarda uma cópia no navegador após salvar e oferece Restaurar backup deste navegador se detectar perda no servidor. Também permite baixar/importar JSON. Para recuperar após perda, abra seu painel e restaure o backup. A corrida atual, votos e vitórias ficam em memória e zeram ao reiniciar.

Guarde o backup fora do site. Esta versão não inclui um banco durável. Não use os limites de gratuitos como promessa de serviço permanente aos compradores.

## Segurança dos acessos

- Link /s/... controla uma sala; link /o/... só mostra a corrida.
- Uma chave de sala não abre outra sala. API exige origem correta e token próprio para alterações.
- Chaves são derivadas de APP_SECRET e não estão embutidas no código.
- Guardar links privados equivale a guardar credenciais de acesso. Eles não devem aparecer na imagem transmitida. Não compartilhe o link do painel com espectadores.
- A página inicial exige chave administrativa para listar salas. Não solicita senha TikTok.
- Até 12 telas simultâneas por sala. Uma conta TikTok não pode ser configurada em duas salas.
- Logs do provedor podem registrar caminhos das URLs. Referrer-Policy impede enviá-los como referência a outros sites.

## Teste no PC

Instale Node.js 22+, execute npm ci e npm start. Abra http://127.0.0.1:8787. A chave administrativa local é criada em data/admin-key.txt. Abra esse arquivo e use a chave na página inicial. Não publique esse arquivo.

## Regras e integração

Comentários 1/lula e 2/bolsonaro escolhem time e dão impulso. Presentes e curtidas usam o time escolhido ou um destino fixo configurado. Bônus simultâneos usam o maior multiplicador, limitado pela velocidade máxima. Sequências de presentes só são aplicadas no final. Moedas da Rosa=1 e Galáxia=1000 são exemplos editáveis; confirme catálogo e IDs da sua conta.

O adaptador usa tiktok-live-connector 2.5.0, biblioteca não oficial com dependências e serviço de assinatura de terceiros. Estabilidade, acesso e limites podem mudar; a hospedagem gratuita não garante conexão TikTok gratuita ilimitada. Leia THIRD-PARTY.md. Integração real em nuvem ainda exige validação com live ativa.

## Verificação

npm test: 15 testes, incluindo regras, normalização dos eventos e fluxo HTTP/SSE com quatro salas, presente isolado, chaves incorretas, escopo de leitura, origem e restauração após reinício com disco preservado. O navegador desta ferramenta não alcançou localhost; inspeção visual e teste de live real continuam pendentes.
