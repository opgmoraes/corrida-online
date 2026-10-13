# Dependências e integração

Motor, regras, servidor e interface foram escritos neste projeto. O transporte TikTok opcional depende de `tiktok-live-connector@2.5.0`, cuja fonte declara licença AGPL-3.0-only. Ele usa também dependências e serviços externos; veja as licenças e termos dessas dependências na instalação. O pacote não está embutido neste ZIP.

Fontes verificadas em 12/10/2026:

- https://github.com/zerodytrash/TikTok-Live-Connector
- https://github.com/zerodytrash/TikTok-Live-Connector/blob/ts-rewrite/LICENSE
- https://github.com/zerodytrash/TikTok-Live-Connector/blob/ts-rewrite/package.json

O mantenedor descreve a biblioteca como não oficial e não pronta para produção. A conexão utiliza infraestrutura de assinatura de terceiros; limites, disponibilidade e custos podem mudar. O projeto não envia senha ou cookie de sessão TikTok. O adaptador usa somente o usuário público configurado e o fluxo padrão da biblioteca.

Não se atribui licença comercial exclusiva nem se remove a licença das dependências. A distribuição comercial precisa respeitar as licenças aplicáveis. Este documento registra dependências e pendências de distribuição; não substitui análise jurídica.

Valores de moedas da configuração são exemplos e não indicam receita. Política TikTok: https://t.tiktok.com/legal/page/row/virtual-items/pt-BR
