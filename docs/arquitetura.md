# Arquitetura e limites da primeira entrega

## Implementado localmente em 28/10/2026
React + TypeScript + Vite para gestão web responsiva; Fastify/Node.js, Better Auth e PostgreSQL convencional para API, autenticação e persistência. A aplicação permanece um monólito modular, sem microsserviços. O PostgreSQL de desenvolvimento usa o Compose local; hospedagem, backup e produção não foram configurados.

## O que existe
- Login por Better Auth, papéis de administrador/operador e escopo de rede/lojas aplicado na API.
- Cadastro de lojas e produtos; catálogo e categoria por rede, preço/mínimo/saldo por loja.
- Preços inteiros em centavos. Editar produto valida versão do catálogo e da loja; ajuste de estoque usa versão do saldo e bloqueio de linha em transação.
- Histórico persistente com usuário, horário, motivo e valores anteriores/novos de estoque ou catálogo/preço/mínimo.
- Busca, filtro de categoria e reposição, resumo de lojas e exportação CSV por loja.
- Regras puras em `src/domain/`; PostgreSQL é a fonte persistente, sem localStorage.
- Migrações versionadas em `server/migrations/`; testes de integração usam schema temporário PostgreSQL.

## Próximos limites técnicos
1. Completar gestão de usuários e associações de operadores a lojas, recuperação de senha e procedimentos de suporte.
2. Definir e testar backup/restauração antes de qualquer uso piloto.
3. Evoluir para compras/vendas mantendo preço histórico, movimentos concorrentes e fluxos de recuperação separados.
4. Planejar pagamentos, fiscal, scanner e CPF somente após documentação oficial, fornecedor e homologação apropriada.

## Integrações futuras
Adaptadores independentes para pagamento, fiscal, leitor e consulta de idade. A tecnologia do caixa depende do SDK e modelo homologado: React no painel não significa que uma página web opere a SmartPOS. Stone ainda aguarda retorno sobre parceria sem CNPJ/site, equipamento de desenvolvimento, scanner e autoatendimento.

Pedido, pagamento, documento fiscal e movimento são estados distintos. Timeout de cobrança exige consulta, nunca repetição automática. Não guardar dados de cartão. Não há cobrança, fiscal ou consulta de CPF implementados nesta entrega.

## Modelo comercial preservado
Código e produto de Marco; R$ 249 por loja/mês, sem implantação inicial na proposta atual. Equipamentos e serviços externos separados. Sem publicação, contratação ou operação real autorizada por esta demo.
