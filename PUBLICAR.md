# Configuração pronta para publicação

Repositório: próprio do jogo, de preferência privado. Arquivos: tudo desta pasta, exceto node_modules, data, .env reais e ZIPs.

Render:
- Tipo: Web Service
- Runtime: Node
- Plano: Free
- Build: npm ci --omit=dev
- Start: npm start
- Health check: /health
- NODE_ENV: production
- NODE_VERSION: 24.13.1
- APP_SECRET: chave aleatória estável com pelo menos 32 caracteres (render.yaml gera automaticamente em Blueprint)

Após deploy: confirme /health, abra página inicial, entre com APP_SECRET e confira links de quatro salas. Teste uma sala antes de compartilhar.

Este arquivo prepara a publicação; não é prova de que o serviço já foi criado. Não use planos pagos ou recursos adicionais para esta fase.
