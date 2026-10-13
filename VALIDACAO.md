# Validação — Corrida Online 0.4

- npm ci --omit=dev executado com dependências fixadas no package-lock.json.
- 15 testes aprovados: motor, adaptador simulado e servidor HTTP/SSE.
- Isolamento entre quatro salas confirmado. Presente na sala 1 não altera moedas da sala 2.
- Link de transmissão bloqueado para controle; token de uma sala bloqueado em outra; origem externa bloqueada.
- Arquivos do servidor e data não servidos. Chaves estáveis e configurações restauradas após reinício com diretório preservado.
- Publicação real, disponibilidade do conector em IP de nuvem e eventos de live real ainda não validados.
- Render Free tem armazenamento temporário. Essa condição é tratada com backup no navegador e importação/exportação, não com persistência garantida.
- Navegador integrado não conseguiu acessar localhost. Layout e botões precisam de inspeção no endereço hospedado.
