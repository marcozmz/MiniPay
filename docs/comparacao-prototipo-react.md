# Comparação do protótipo com o React atual

Comparação feita em 28/10/2026, antes das correções desta entrega, usando `docs/prototipo-anterior/app.js`, `work-original.html`, o README e `src/`.

| Função | Protótipo anterior | React atual antes desta entrega |
|---|---|---|
| Busca por nome e código de barras | Implementada em memória/localStorage | Implementada via dados retornados pelo backend |
| Filtro por estoque baixo/reposição e limpar filtros | Implementados | Reposição implementada; categoria e botão para limpar não existiam |
| Filtro por categoria | Implementado com Bebidas, Mercearia, Doces e Higiene | Ausente; categoria não era persistida no banco |
| Resumo de produtos, reposição e unidades | Implementado para a loja selecionada | Não reproduzido em React |
| Cadastro de loja e produto | Formulário local do protótipo | Implementado no React com API; produto inicia com saldo zero |
| Editar produto: nome, código, categoria, preço, estoque e mínimo | Implementado; preço/catálogo eram compartilhados no protótipo e os saldos eram por loja | Só ajuste de estoque existia; preço, mínimo e dados do catálogo não podiam ser editados |
| CSV da loja selecionada | Exportava produto, código, categoria, preço, saldo e mínimo | Ausente |
| Histórico | Registrava motivo, data e resumo de estoque/preço, com autor de demonstração fixo | Ajustes de estoque persistidos com autor, data e motivo; preço/mínimo não eram auditados |
| Visão das lojas | Lista de lojas com contagem de produtos e unidades e atalho para abrir estoque | Seletor de loja e cadastro existiam; visão-resumo de lojas ausente |

O protótipo salvava tudo em `localStorage`, tinha dados fictícios fixos e botão de restauração. Isso não é adequado como fonte do produto atual; o botão de restauração não será recuperado. Recursos citados no README como pagamentos, fiscal, CPF, scanner físico e integrações eram observados, planejados ou pendentes, não funções implementadas nesses arquivos, e não fazem parte desta recuperação.
