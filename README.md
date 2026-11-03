# Plataforma própria para minimercados autônomos

> Nome comercial a definir. Última atualização: 03/11/2026 (horário local).
> Estado atual: aplicação local React/TypeScript/Vite com API Fastify, Better Auth e PostgreSQL persistente. Gestão de operadores, catálogo, estoque, filtros, CSV e históricos implementados. O usuário confirmou testes e validação manual do motivo opcional, sem informar nova contagem; contagem, perda e reposição também foram validadas manualmente pelo usuário. Interface desktop e mobile aprovada visualmente pelo usuário; instalação da PWA confirmada pelo usuário em 03/11/2026. Novo produto permite estoque inicial por loja, com cadastro e movimentação na mesma transação e proteção contra reenvios. Em 29/10, **59 testes e build aprovados**. Em 30/10, execução compilada preparada, **62 testes aprovados** em banco separado e build/start conferidos localmente; HTTPS real e navegador ainda não validados. Em 31/10, proxy e TLS PostgreSQL receberam configuração explícita, 15 testes direcionados aprovados e novo build aprovado; a suíte completa não foi repetida. Posteriormente, o usuário confirmou os fluxos básicos no ambiente Railway + Supabase, conforme registro abaixo; demais verificações técnicas do ambiente não foram inferidas. Resultados anteriores preservados no histórico. Os três registros de teste com nomes corrompidos foram renomeados, por instrução do usuário, para Loja Teste A, Loja Teste B e Loja Teste C, preservando IDs, vínculos, estoques, históricos e demais lojas; novas entradas corrompidas são recusadas. Execução online preparada conforme [docs/deploy.md](docs/deploy.md); o usuário informou posteriormente testes no ambiente Railway + Supabase. O usuário confirmou criação e restauração do backup `minimercado_20261029T111942Z_bfef1a.dump` em banco separado, mantendo o principal intacto; conferência com 6 movimentações e saldo agregado de 132 unidades. Cópia externa pendente de confirmação. Pagamentos, fiscal e CPF continuam pendentes. Não está pronta para produção.

### Validação informada pelo usuário — ambiente Railway + Supabase

O usuário confirmou login, troca inicial de senha, cadastro com estoque inicial **10**, reposição **+5** e perda **-2**, resultando em saldo **13** e histórico correto. Esta é uma validação manual reportada pelo usuário, não uma nova execução automatizada. A instalação da PWA foi confirmada pelo usuário em 03/11/2026; testes específicos de offline e atualização em aparelho não foram confirmados. O rótulo interno `stock` do histórico de cadastro passou a ser apresentado como **Estoque**, inclusive para registros existentes, sem alteração de dados.

## Objetivo

Construir um produto de software de propriedade do desenvolvedor responsável pelo projeto (o usuário), licenciado para várias redes e franquias de minimercados autônomos: caixa na maquininha, aplicativo do operador e painel web. O tio da namorada será o primeiro cliente previsto, não o proprietário do sistema. O Codex é uma ferramenta de apoio, sem participação societária ou propriedade no produto. Prioridades: eficiência, rapidez de operação, custo-benefício e manutenção sustentável.

O objetivo econômico é substituir o pacote atual e a cobrança pelo software. Taxas de pagamento, infraestrutura, emissão fiscal, equipamentos, manutenção e suporte continuarão existindo. Não há economia líquida ou prazo de retorno comprovados.

## Modelo comercial definido para planejamento

Estas são decisões do desenvolvedor para organizar o projeto, não um contrato assinado nem aceite comercial do cliente. Um contrato detalhado será preparado posteriormente.

| Item | Definição atual |
|---|---|
| Proprietário do sistema e código | O próprio desenvolvedor responsável pelo projeto |
| Clientes | Redes e franquias licenciadas; o primeiro cliente previsto é o tio da namorada |
| Mensalidade escolhida | **R$ 249 por loja/mês**, não por terminal |
| Desenvolvimento inicial | **Sem cobrança inicial de R$ 50 mil; modelo escolhido é somente mensalidade** |
| Implantação inicial | Não adicionar taxa de implantação à proposta atual sem nova decisão do desenvolvedor |
| Financiamento do desenvolvimento | O desenvolvedor investe seu trabalho para construir o próprio produto |
| Equipamentos e serviços externos | Pagos pelo cliente, separados da licença; definir operacionalmente quem contrata e paga cada fornecedor |
| Uso com marca do cliente | Pode haver personalização da marca da franquia, sem transferência do código |
| Comercialização futura | O desenvolvedor pretende vender o mesmo produto para outras franquias; não pressupor exclusividade |
| Consulta de CPF | Adicional opcional por uso, a implementar depois; preço futuro ainda não definido |

A mensalidade foi discutida para licença, manutenção, atualizações gerais e suporte remoto. Horários, limites, quantidade de terminais por loja, reajuste, cancelamento, início da cobrança e personalizações precisam ser formalizados. Cobrar a partir da entrada de cada loja em operação após o piloto foi uma sugestão, não uma cláusula já contratada. Não prometer novas funcionalidades ou atendimento ilimitados.

| Lojas contratadas | Receita bruta mensal a R$ 249/loja |
|---|---:|
| 2 | R$ 498 |
| 10 | R$ 2.490 |
| 12 | R$ 2.988 |
| 20 | R$ 4.980 |

Esses valores não são lucro nem receita garantida. Confirmar lojas efetivamente contratadas e descontar impostos, custos próprios e trabalho de manutenção. Equipamentos, taxas financeiras, emissão fiscal, infraestrutura e consulta de CPF devem ter responsabilidade e valores apresentados separadamente. A diferença de R$ 151 frente ao pacote atual de R$ 400 por loja não representa economia líquida, pois os pacotes têm composições diferentes.

## Contexto confirmado pelo responsável

- O tio da namorada do responsável pelo projeto opera aproximadamente 10 lojas; a namorada possui mais 2. Todas ficam em Araraquara/SP. Confirmar se as 2 já estão ou não incluídas no total informado antes de fechar orçamento.
- A operação atual utiliza TouchPay/AMLabs no contexto da Smart Store.
- Equipamentos são fornecidos pela Smart Store; propriedade, contrato, devolução e possibilidade de reutilização ainda não foram confirmados.
- A hipótese inicial de R$ 400 por maquininha foi corrigida pela nota e pela confirmação do usuário: **R$ 800 fixos para as duas lojas da namorada**, equivalentes a R$ 400 por loja no pacote atual. Veja a composição abaixo.
- Existe uma cobrança percentual adicional, descrita pelo usuário como porcentagem dos lucros. Percentual e base (lucro, faturamento ou transações) NÃO estão confirmados.
- Não extrapolar o contrato dessas duas lojas para todas as unidades. A nota lista 2 terminais principais e 2 adicionais; distribuição e quantidade física precisam ser confirmadas.
- O usuário vai desenvolver e ser dono do produto; não tem experiência prévia com integração de maquininhas. O cliente será dono da própria franquia e licenciado do software.
- Prazo desejado: o mais rápido possível. Recursos disponíveis para desenvolvimento, contrato comercial e prazo de entrega ainda não definidos. Não há equipe contratada confirmada.
- A foto do terminal atual confirma uma Moderninha Smart 2. PagBank é preferência inicial, mas Stone e outros equipamentos compatíveis podem ser avaliados por custo total e operação.
- Não existe obrigação de reutilizar o terminal ou scanner atual.
- O cliente escaneia produtos, visualiza o carrinho na própria maquininha e paga nela.
- A verificação de idade desejada usa digitação do CPF; o scanner permanece para produtos. O usuário confirmou que a cobrança de validação da nota corresponde à consulta de CPF. O novo módulo será adicional opcional, separado e postergado para uma das últimas etapas.

## Custo atual comprovado nas duas lojas

Foi analisada uma DANFSe emitida pela AMLabs, referente a outubro/2026. O usuário confirmou que cobre as duas lojas da namorada. O documento fiscal não comprova quitação. A nota original contém dados privados e não deve ser publicada no repositório.

| Descrição da nota | Quantidade | Valor unitário | Total |
|---|---:|---:|---:|
| Mensalidade NFC-e fixa | 2 | R$ 150 | R$ 300 |
| Mensalidade terminal principal — comodato | 2 | R$ 150 | R$ 300 |
| Mensalidade terminal adicional — comodato | 2 | R$ 100 | R$ 200 |
| Validação de usuário no terminal (consulta de CPF, confirmada pelo usuário) | 74 | R$ 3 | R$ 222 |
| **Total dos serviços** | | | **R$ 1.022** |

- Parcela fixa: R$ 800/mês pelas duas lojas. Parcela variável nesta nota: R$ 222.
- Retenção apresentada: R$ 15,33. Valor líquido apresentado: R$ 1.006,67. Esses campos descrevem a nota; não são orientação tributária.
- Não há cobrança percentual sobre lucro ou faturamento discriminada nessa nota. O relato de percentual continua pendente de outro documento/contrato.
- R$ 3 é o preço cobrado pelo fornecedor atual por consulta, não o custo de uma API futura nem o preço escolhido para nosso adicional.
- Não somar os antigos R$ 400 por máquina aos itens desta nota: isso duplicaria a despesa.

## Documentação e uso com Codex

- [AGENTS.md](AGENTS.md): papel e instruções persistentes do assistente de desenvolvimento.
- Este README: fonte de contexto, escopo, decisões, pendências e progresso.
- Coloque os dois arquivos na raiz do repositório do projeto. O AGENTS.md orienta o Codex; não é um serviço de IA em produção nem cria uma execução em segundo plano.
- Base web implementada com React, TypeScript e Vite. Veja execução abaixo e [arquitetura](docs/arquitetura.md). Não há deploy.
- Referências visuais contêm dados privados da operação. Não publicar capturas originais sem revisão; utilizar dados fictícios em demos e testes.

## Evidências analisadas

Foram analisadas 7 fotos do caixa, 7 imagens do aplicativo, 10 capturas do site e uma nota de serviços de outubro/2026. O resumo abaixo permite continuar sem depender dos arquivos locais da conversa original.

### Caixa: observado nas fotos

- Tela inicial personalizada com imagem promocional/pesquisa, QR Code e início de compra.
- Carrinho com nome, foto, preço, quantidade, total e cancelamento.
- Botão para escolher produtos em uma lista, além do scanner.
- Opções de crédito, débito, Pix, PicPay e cupom.
- Tela Pix com identificação PagBank, QR Code, instrução de aproximação e cancelamento. Não foi identificada a implementação interna.
- Operação cancelada com opção de tentar novamente. Não equivale a evidência de estorno.
- Administração: abastecimento e inventário, gerenciamento das operações, QR Code do operador, atualizar aplicação, sincronizar, reiniciar, configurar leitor e configurações.
- A tela de bebida restrita pede cartão de maioridade ou QR Code. O requisito do novo produto é substituir essa entrada por CPF digitado. Não foi visto o processo completo da consulta atual.
- Emissão fiscal e gestão no terminal foram relatadas pelo usuário; detalhes fiscais não foram demonstrados nas fotos.

### Aplicativo do operador: observado

- Resumos atual/semanal e status dos caixas, com erro de carregamento nas capturas: não inferir o conteúdo ausente.
- Atalhos para relatórios com IA, estoques, telemetria e planogramas; detalhes desses atalhos não foram todos vistos.
- Rotas de hoje e futuras, escolha de PDV ou leitura de QR Code.
- Estoque central, lista de compras, separação e conferência de listas destinadas aos PDVs.
- Histórico de transações com loja, data, modalidade e filtros.
- Gerenciador de operações e checklists não sincronizados; isso não comprova todas as capacidades offline.
- Produtos com foto, código, preço, busca, botão de câmera, visualização em grade/lista, filtro de críticos e edição.
- Indicadores como “0/24” aparecem, mas seu significado exato precisa ser confirmado.
- Contagem, cadastro por código de barras e alteração de preço foram relatados pelo usuário; nem todos os formulários foram vistos.

### Painel web: observado

- Indicadores de faturamento, ticket médio, mix de produtos, margem/markup e comparativos mensal/semanal.
- Ranking de produtos, categorias e lojas, curva ABC e formas de pagamento. O gráfico visto mede número de vendas, não valor financeiro por modalidade.
- Planogramas por PDV com produtos, preços, quantidade desejada, mínimo crítico, histórico, filtros e exportação Excel.
- Telemetria com estado online/offline, rede, última comunicação, vendas e indicadores de estoque.
- Cupons e promoções; condições, limite de uso e tipo de desconto.
- Biblioteca de imagens, logos e carrosséis para terminais.
- Apenas menus/atalhos: cenários fiscais, integração fiscal, notas emitidas, configurações fiscais, tabelas de preços, margem/markup, produtos não encontrados, CRM, clube de vantagens e gestão financeira. Não presumir suas regras internas.

## Escopo proposto

### Primeiro piloto operacional

- [ ] Separação entre redes clientes, franqueados, lojas, terminais e usuários com permissões, desde o primeiro piloto.
- [ ] Cadastro central de produtos: código de barras, nome, imagem, categoria, unidade, custo e dados fiscais pertinentes.
- [ ] Configuração por loja: preço, disponibilidade, estoque mínimo e quantidade desejada.
- [ ] Caixa: leitura, busca, carrinho, quantidades e cálculo determinístico do total.
- [ ] Integração real com UM fornecedor de pagamento: crédito, débito e Pix conforme suporte contratado.
- [ ] Consulta do resultado, cancelamento, estorno e conferência de pagamentos.
- [ ] Integração fiscal e acompanhamento de notas autorizadas/rejeitadas/pendentes.
- [ ] Movimentações de estoque: entrada, venda, perda, ajuste e inventário.
- [ ] Operação pelo celular: seleção de loja, leitura pela câmera, contagem e reposição.
- [ ] Relatórios básicos de vendas e movimentações.
- [ ] Monitoramento de conexão, erros e última sincronização.
- [ ] Histórico de ações dos operadores.
- [ ] Cadastro de produtos restritos e bloqueio de venda até existir procedimento adequado validado; a consulta de CPF não é requisito de entrega do piloto sem esses produtos.
- [ ] Backup, recuperação, suporte e procedimento de retorno à operação anterior.

### Expansão da rede

- [ ] Estoque central, transferências e reposição com separação/conferência.
- [ ] Rotas e checklists.
- [ ] Visão consolidada da franqueadora e acesso limitado por franqueado/loja.
- [ ] Indicadores por produto, categoria, loja, período e forma de pagamento.
- [ ] Curva ABC, margem e markup baseados em custos confiáveis.
- [ ] Cupons, promoções, campanhas e imagens no terminal.
- [ ] Importação/exportação e migração assistida dos dados atuais.
- [ ] Regras de royalties/cobrança da franquia, se solicitadas e definidas.

### Posterior, sujeito a necessidade comprovada

**Consulta de idade por CPF:** adicional solicitado e adiado expressamente pelo usuário para uma das últimas etapas. Preparar a separação do módulo e a sinalização de produtos restritos desde o início, mas não contratar ou implementar a consulta agora. Definir fornecedor, preço por uso e tratamento de indisponibilidade antes de ativar. Não liberar produtos restritos automaticamente por o módulo estar ausente.

PicPay, fidelidade, aplicativo do consumidor, relatórios com IA, controle de acesso, câmeras, reconhecimento facial e travas de geladeiras. Não foram aprovados como escopo obrigatório do primeiro piloto. Não implementar vários fornecedores de pagamentos simultaneamente sem benefício justificado.

## O que pode começar sem serviços externos

Modelagem dos dados; permissões; cadastro; preços; estoque; interfaces web e celular; protótipo do caixa; simulador de pagamentos; relatórios com dados fictícios; contratos de integração; histórico de ações; testes de sincronização e importação por modelo próprio.

Uma demo com pagamento simulado deve indicar isso claramente. Não conta como pagamento real, homologação, emissão fiscal ou validação do equipamento.

## Pendências e dependências

| Pendência | Responsável inicial | Resultado necessário |
|---|---|---|
| Nome do produto e identidade de cada franquia | Desenvolvedor/cliente | Marca própria do sistema e personalização por rede |
| Quantidade de lojas, CNPJs e terminais | Dono/contador | Mapa de unidades e responsáveis por venda, recebimento e emissão |
| Contrato e cobrança Smart Store/TouchPay | Dono | Mensalidades, percentual/base, equipamentos e condições de saída |
| Volume por modalidade e prazo de recebimento | Dono/financeiro | Comparação de propostas na mesma base |
| Propostas PagBank/Stone | Dono com apoio técnico | Taxas, equipamentos, suporte e autorização para autoatendimento |
| Parceria de desenvolvimento | Empresa/parceiro | Acesso oficial, documentação e processo de distribuição |
| Terminal de testes e scanner | Fornecedor/equipe | Modelo físico e compatibilidade comprovada |
| Fiscal em SP | Contador/equipe | Dados, credenciamento, certificado, CSC quando aplicáveis, provedor e regras atuais |
| Consulta de idade (etapa posterior) | Desenvolvedor/cliente | Fornecedor autorizado, custo, finalidade, retenção e limitações |
| Dados de migração | Operação atual | Exportação autorizada de produtos, preços e saldos |
| Formalização comercial | Desenvolvedor/cliente | Contrato futuro: R$ 249/loja, licença de sistema do desenvolvedor, suporte, custos externos, reajuste e cancelamento |
| Quantidade inicial contratada | Cliente | Confirmar adesão das lojas; não contar receita ainda não contratada |
| Loja piloto | Dono | Unidade, operador de acompanhamento e critério de retorno |

Não há credenciais disponíveis neste pacote. Não solicitar senhas ou certificados pelo README.

## Diretrizes técnicas — base web escolhida; integrações propostas

- Uma base de código compartilhada para atender várias redes clientes, evitando uma cópia independente por franquia.
- Hierarquia de acesso: rede cliente → franqueado → loja → terminal. Definir separadamente o acesso administrativo do proprietário da plataforma.
- Marca e configurações por rede; credenciais de pagamentos e dados fiscais vinculados ao responsável correto, sem misturar contas de clientes.
- Uma base compartilhada de regras para caixa, celular e painel, com fronteiras claras de autorização.
- Separar cadastro central, configuração por loja e histórico de movimentações.
- Identificar organização, loja e terminal nas operações; validar o acesso no servidor.
- Manter integração de pagamento substituível, sem pressupor portabilidade automática entre fornecedores.
- Para SmartPOS, escolher tecnologia após validar SDK, Android, periféricos e homologação do modelo.
- Guardar catálogo/preços localmente no caixa para resposta rápida; definir validade e atualização. Isso não autoriza pagamento offline.
- Salvar operações móveis pendentes com identificadores únicos e regras explícitas para conflitos, inclusive contagem durante vendas.
- Valores monetários em centavos ou decimal exato. Congelar preço e itens da venda no fechamento.
- Registrar estados independentes de pedido, tentativa de pagamento, documento fiscal e movimentação de estoque.
- Pagamento aprovado não equivale a nota autorizada. Uma rejeição fiscal não deve gerar nova cobrança.
- Timeout não equivale a recusa. Consultar e reconciliar antes de permitir nova tentativa que possa duplicar a cobrança.
- Usar confirmação do fornecedor; nunca liberar venda por comprovante enviado pelo cliente.
- Proteger segredos, certificados e dados pessoais. Não armazenar dados sensíveis do cartão no sistema.
- CPF válido matematicamente não informa idade. Consulta de nascimento não comprova a identidade presente. Não declarar conformidade jurídica sem validação apropriada.
- Desabilitar o módulo de idade não deve liberar automaticamente produtos restritos.
- O sistema próprio elimina dependência do fornecedor atual apenas nas partes substituídas; não elimina custos financeiros e operacionais.

## Critérios de aceitação do piloto

- [ ] Scanner real, conexão, alimentação contínua e reinício testados.
- [ ] Crédito, débito e Pix reais validados no ambiente autorizado pelo fornecedor.
- [ ] Aprovação, recusa, cancelamento, estorno e estado desconhecido tratados.
- [ ] Queda de conexão após aprovação e notificações repetidas não duplicam cobrança nem estoque.
- [ ] Cancelamento solicitado não é mostrado como concluído antes da confirmação necessária.
- [ ] Venda e estoque conferidos contra transações do fornecedor.
- [ ] Fiscal testado em homologação e produção conforme habilitação, com tratamento de rejeições.
- [ ] Contagens e reposições simultâneas não sobrescrevem vendas silenciosamente.
- [ ] Permissões testadas entre lojas e franqueados; alterações auditadas.
- [ ] Produtos restritos bloqueados quando não houver procedimento validado. Quando o adicional CPF entrar em operação, testar a consulta e sua indisponibilidade antes de habilitar essas vendas.
- [ ] Backup restaurado, atualização do terminal testada e suporte definido.
- [ ] Operação acompanhada pelo responsável e critérios de aprovação registrados antes da expansão.

## Roadmap e andamento

| Etapa | Estado em 28/10/2026 | Evidência |
|---|---|---|
| Levantamento e referências | Inicial concluído; regras internas pendentes | Relatos, 24 imagens e uma nota analisados |
| Modelo comercial de planejamento | Definido pelo desenvolvedor; contrato pendente | R$ 249/loja, sem R$ 50 mil iniciais, produto do desenvolvedor para várias franquias |
| Documentação | Atualizada | README.md e AGENTS.md |
| Arquitetura inicial | React/Vite, Fastify, Better Auth e PostgreSQL implementados localmente | docs/arquitetura.md e server/ |
| Gestão local | Login, gestão admin de operadores, lojas, catálogo por rede, preço/mínimo/saldo por loja, filtros, CSV e históricos em PostgreSQL | src/, server/ e testes abaixo |
| Parceria e hardware | Aguardando resposta da Stone | E-mail enviado pelo desenvolvedor; sem aprovação |
| Implementação e testes | Gestão de operadores, catálogo, estoque inicial e movimentos, navegação responsiva e preparação PWA; execução compilada implementada, 62 testes e build/start local aprovados em banco separado. Backup/restauração local confirmado pelo usuário | `npm test`; `npm run build`; `npm run verify:online`; backup restaurado em banco separado |
| Homologações e piloto | Não iniciados | — |
| Expansão | Não iniciada | — |

## Como atualizar este README

1. Atualize a data e o estado real do projeto.
2. Marque uma tarefa concluída somente com evidência: teste, demonstração, documento ou validação do fornecedor.
3. Registre decisões com data, motivo e impacto. Não transforme proposta em decisão silenciosamente.
4. Registre bloqueio, responsável e próximo passo; continue tarefas independentes.
5. Quando existir código, documente versões, instalação, variáveis SEM valores secretos, testes e execução local.
6. Mantenha a diferença entre simulação, sandbox, homologação e produção.

### Registro de decisões

| Data | Decisão | Motivo/limitação |
|---|---|---|
| 27/10/2026 | Desenvolver software próprio | Controle da operação e redução da cobrança atual |
| 27/10/2026 | Permitir troca de equipamento | Eficiência e custo-benefício; modelo final não escolhido |
| 27/10/2026 | Entrada de CPF para consulta de idade | Requisito do usuário; fornecedor e eficácia ainda não validados |
| 27/10/2026 | Recomendar piloto em uma loja | Proposta técnica; unidade ainda não escolhida |
| 28/10/2026 | Corrigir custo atual para R$ 800 fixos nas duas lojas | Nota de serviços e confirmação do usuário; não é preço por maquininha |
| 28/10/2026 | Consulta de CPF como adicional posterior | Usuário confirmou R$ 3/consulta no serviço atual e adiou a função |
| 28/10/2026 | Produto e código pertencem ao desenvolvedor | Cliente licencia uso; objetivo inclui outras franquias; formalização futura |
| 28/10/2026 | R$ 249 por loja/mês | Valor escolhido para planejamento; sem aceite contratual do cliente comprovado |
| 28/10/2026 | Sem cobrança inicial de R$ 50 mil; somente mensalidade | Substitui estimativas anteriores de desenvolvimento e implantação |
| 28/10/2026 | Equipamentos e serviços externos pagos pelo cliente | Detalhar contratação e responsabilidades no contrato futuro |
| 28/10/2026 | Motivo do ajuste de estoque opcional | Não exigir texto artificial; manter auditoria automática e exibir “Sem observação” quando ausente |
| 28/10/2026 | Reposição e perdas devem ser movimentos incrementais distintos de contagem absoluta | Preservar semântica do saldo e rastreabilidade das movimentações |
| 28/10/2026 | Backups locais com pg_dump/pg_restore; restaurar apenas em banco novo de validação | Ciclo real reportado como concluído; banco principal preservado e cópia externa pendente |
| 29/10/2026 | Motivo opcional implementado somente no ajuste de estoque | Ausência normalizada como string vazia, sem migração; “Sem observação” apenas na exibição. Auditoria, autorização, transação e controle de versão preservados; integração aguarda banco disponível |
| 29/10/2026 | Usuário confirmou testes e validação manual do motivo opcional | Confirmação reportada sem nova contagem de testes; encerra a pendência anterior dessa validação |
| 29/10/2026 | Reposição incremental, perda incremental e contagem absoluta | Operação explícita e quantidade na API e no formulário; observação opcional nas três. Saldo e auditoria na mesma transação com bloqueio e versão; saldo negativo e excesso do limite recusados. Migração 005 classifica ajustes antigos como contagens e calcula a diferença sem alterar os dados originais |
| 29/10/2026 | Compatibilidade de testes Node/tsx registrada no repositório | `npm test` carrega ajuste restrito ao erro `uv_os_get_passwd/ENOMEM` no Windows gerenciado; dispensa preload externo e mantém comportamento nativo nas demais situações |
| 29/10/2026 | Usuário confirmou validação manual de contagem, perda e reposição e novo ciclo de backup/restauração | Backup `minimercado_20261029T111942Z_bfef1a.dump` criado e restaurado em banco separado, mantendo o principal intacto; conferência com 6 movimentações e 132 unidades agregadas. Cópia externa pendente de confirmação; resultados anteriores de 40 testes e build aprovados preservados, sem nova execução nesta atualização documental |
| 29/10/2026 | Navegação única adaptada ao desktop e celular | Lista central com ícones e permissões por perfil; removida navegação duplicada. Lateral no desktop e barra inferior no celular, com espaço para área segura; barra oculta durante modais e foco em campos |
| 29/10/2026 | Preparação PWA sem operações offline | Manifesto standalone, ícones próprios e oferta de instalação somente mediante evento nativo; instruções alternativas por plataforma. Cache restrito à página pública de indisponibilidade, API sempre na rede e sem fila. Atualizações aguardam fechamento das janelas, sem recarregar formulários |
| 29/10/2026 | Usuário aprovou visualmente desktop e mobile | Confirmação do usuário, distinta da inspeção automatizada antes bloqueada; instalação PWA em aparelho continua pendente |
| 29/10/2026 | Estoque inicial opcional no cadastro, padrão zero | Uma chamada e uma transação para catálogo, configuração da loja e, se positivo, movimento `initial`. Observação opcional; UUID de requisição reutilizado nos reenvios e ledger existente preservado. Migração 006 amplia os tipos sem alterar movimentos antigos |
| 29/10/2026 | Bloquear novos nomes de lojas com U+FFFD | Banco e API já continham o caractere de substituição. UTF-8 íntegro foi verificado ao salvar/recarregar; entrada Latin-1 foi reproduzida e recusada. Não adivinhar a grafia nem substituir caracteres globalmente |
| 29/10/2026 | Usuário definiu novos nomes para os três registros de teste | Comparação A → Loja Teste A; comparação B → Loja Teste B; validação → Loja Teste C. Atualização dirigida por ID/rede/nome anterior, em transação; outras lojas e dados associados conferidos e preservados |
| 29/10/2026 | Railway avaliado somente em documentação | Frontend e Fastify na mesma origem com PostgreSQL separado; lacunas e próximo passo em [docs/deploy.md](docs/deploy.md). Nenhum serviço criado ou código de hospedagem implementado |

| 30/10/2026 | Execução compilada e comandos explícitos de banco | Fastify serve build e API na mesma origem; produção exige origem HTTPS, secret e URL do banco. Startup sem migração/seed/bootstrap; comandos separados, troca inicial obrigatória e encerramento com pool. Build e 62 testes aprovados; smoke com banco separado, sem hospedagem ou validação HTTPS real |

| 31/10/2026 | Proxy por contrato de ingresso e TLS estrito | Modo Railway lê X-Real-IP somente sob ingresso HTTP exclusivo; limiter usa header interno saneado, cinco tentativas/minuto, uma instância. URL PostgreSQL sem sobrescrita de SSL/host, CA por arquivo/PEM e hostname obrigatório. Quinze testes direcionados e build aprovados; verificação do provedor real pendente |

### Histórico

- 27/10/2026: contexto inicial consolidado, referências visuais resumidas, escopo proposto, dependências e critérios de validação documentados. Nenhuma integração implementada.
- 28/10/2026: incorporada nota das duas lojas; corrigida a composição de custos; consulta de CPF postergada; definido produto do desenvolvedor para várias franquias a R$ 249/loja/mês, sem cobrança inicial. AGENTS.md alinhado. Contrato e implementação continuam pendentes.

## Fontes técnicas iniciais

Consultadas na pesquisa inicial em 27/10/2026; verificar novamente ao implementar. Não constituem proposta comercial nem garantia de compatibilidade do equipamento.

- [AMLabs: referência funcional](https://www.amlabs.com.br/)
- [PagBank: integração SmartPOS](https://developer.pagbank.com.br/docs/integracao-smartpos-1)
- [PagBank: FAQ SmartPOS](https://developer.pagbank.com.br/docs/faq-smartpos)
- [PagBank: TEF](https://developer.pagbank.com.br/docs/tef)
- [Stone: pré-requisitos Android](https://sdkandroid.stone.com.br/reference/pre-requisitos)
- [Getnet: documentação Get Smart](https://getstore.getnet.com.br/docs/)
- [Mercado Pago: Point](https://www.mercadopago.com.br/developers/pt/reference/in-person-payments/point/overview)
- [Codex: instruções persistentes no repositório](https://developers.openai.com/cookbook/examples/codex/iterating-development-workflows-with-codex)

## Próxima ação sugerida

A validação manual do estoque inicial foi confirmada pelo usuário no ambiente Railway + Supabase; revisar as demais pendências externas de [docs/deploy.md](docs/deploy.md) antes de autorizar qualquer serviço. A execução compilada já foi conferida localmente com banco separado. Os três registros de teste já receberam os nomes definidos pelo usuário. A interface desktop/mobile foi aprovada pelo usuário; instalação PWA em aparelho confirmada pelo usuário em 03/11/2026; cópia externa de backup continua pendente. Os resultados anteriores de 40 e 49 testes permanecem no histórico; a entrega de execução online passou com 62 testes e build/start local. Não houve validação HTTPS real nesta etapa. Pagamentos, fiscal, CPF e validação de equipamento continuam pendentes.


## Executar a versão atual localmente

### Requisitos e inicialização

- Node.js 22.x, conforme `package.json` e dependências fixadas no `package-lock.json`.
- Docker Desktop em execução e com permissão para o usuário executar `docker compose`.
- PostgreSQL local em `127.0.0.1:5433`, iniciado pelo Compose deste projeto.

Na raiz do projeto, no PowerShell:

```powershell
npm ci
npm run db:up
npm run build:server
npm run db:migrate
npm run dev
```

O comando `db:up` cria os arquivos locais de acesso e conexão dentro de `.local/` se ainda não existirem e inicia o serviço `postgres:17` definido em `compose.yaml`. A senha e a URL não devem ser copiadas para documentação, logs compartilhados ou commits. `.local/` está ignorado pelo Git. O volume nomeado do Compose mantém os dados quando o contêiner para; `npm run db:stop` apenas para o contêiner e não apaga o volume.

### Inicialização explícita e execução compilada

O servidor não aplica mais migrações nem cria administrador/dados de demonstração ao iniciar, inclusive no desenvolvimento. Depois de atualizar o código, compile e execute `npm run db:migrate` **no banco do ambiente pretendido**, antes de iniciar a API. A instalação local existente conserva seus usuários, lojas e saldos; esta entrega não executou esse comando no banco principal.

Em banco novo, configure `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_NETWORK_NAME` e `BOOTSTRAP_FRANCHISEE_NAME` em ambiente protegido e execute `npm run db:bootstrap-admin` uma única vez. Ele exige banco sem usuários/redes e cria somente administrador, rede e franqueado, com troca obrigatória de senha; não imprime credencial nem cria lojas/produtos de exemplo. Remova essas variáveis após o comando. Não use bootstrap para recuperar ou substituir contas existentes.

`npm run build` gera frontend em `dist/` e backend/migrações em `dist-server/`; `npm start` executa o JavaScript compilado com Node, servindo frontend e API no mesmo endereço. Em produção, são obrigatórios `NODE_ENV=production`, `PUBLIC_ORIGIN` HTTPS exata, `BETTER_AUTH_SECRET` estável e exclusivo e `DATABASE_URL` do ambiente; `PORT`, `HOST` e `DATABASE_CA_FILE` têm regras em [docs/deploy.md](docs/deploy.md). Não há valores secretos nesta documentação. Configuração inválida ou schema pendente impede o início; SIGINT/SIGTERM fecham servidor e pool. O modo `npm run dev` continua com Vite e API separados no loopback.

Para repetir a verificação completa do artefato, depois de build atualizado e com PostgreSQL local disponível, use `npm run verify:online`. Ele cria e **preserva um banco novo** com prefixo `minimercado_online_`, executa `npm test`, migrações/bootstrap e o smoke do `npm start`; exige permissão de criar banco e não migra o banco usado como origem da conexão. Schemas temporários da suíte são removidos somente no banco separado. Bancos, backups e restaurações existentes são preservados.

### Backup local e restauração para validação

Com o Docker Desktop aberto e o PostgreSQL local iniciado, use na raiz do projeto:

```powershell
npm run db:backup
npm run db:backups
npm run db:restore -- minimercado_YYYYMMDDTHHmmssZ_ab12cd.dump
```

`db:backup` executa `pg_dump` no serviço PostgreSQL 17 em formato customizado. O arquivo é escrito em `.local/backups/` com banco e data no nome; só recebe extensão `.dump` depois que `pg_restore --list` valida o arquivo. Em caso de erro, pode restar um `.dump.partial`, que nunca aparece como backup concluído na listagem. `db:backups` lista nome, banco, data e tamanho; não remove arquivos.

`db:restore` recebe o nome completo de um backup listado e cria um banco novo com nome `minimercado_restore_...`. A restauração usa `pg_restore --exit-on-error --single-transaction` e recusa bancos existentes; não aceita destino configurável, `--clean` ou o banco atual `minimercado`. Não apaga nem limpa bancos/volumes automaticamente. Após restaurar, consulta no banco novo usuários e perfis, atribuições de loja, produtos, preços totais em centavos, saldos, movimentações e históricos; só informa restauração verificada se os dados essenciais estiverem presentes. O aplicativo continua conectado ao banco principal; essa rotina serve para validação isolada e não promove a cópia automaticamente.

Os arquivos podem conter contas, hashes de senha, sessões, produtos, preços, saldos, movimentações e históricos. Mantenha `.local/backups/` privada; `.local/` e os backups estão ignorados pelo Git. Não copie esses arquivos para um repositório ou canal compartilhado. Esta cópia no mesmo computador não protege contra perda, dano ou roubo do equipamento; a cópia externa ainda está pendente de confirmação. Nenhum backup deve ser considerado recuperável até completar a restauração e conferência.

Validação anterior reportada pelo usuário: `minimercado_20261029T004108Z_aea963.dump` foi restaurado com sucesso no banco separado `minimercado_restore_20261029t004906z_0a0151`; o banco principal foi preservado. A cópia restaurada continha 2 usuários, 1 administrador, 1 operador desativado, 0 acessos de loja, 6 produtos, 11 configurações de produto por loja, 141 unidades, 1 movimentação, 4 alterações de configuração e 2 registros de acesso. A conferência não promoveu a cópia para o banco principal. Uma tentativa anterior de backup nesta máquina foi bloqueada pelo acesso ao pipe Docker e deixou um `.dump.partial` vazio; esse arquivo foi preservado e não é listado como backup completo.

Validação mais recente reportada pelo usuário em 29/10/2026: o backup `minimercado_20261029T111942Z_bfef1a.dump` foi criado e restaurado com sucesso em banco separado, mantendo o banco principal intacto. A conferência da restauração registrou **6 movimentações** e **saldo agregado de 132 unidades**. O nome do banco separado não foi informado. A cópia externa ainda está pendente de confirmação.

Com `npm run dev` em execução, acesse:

- Interface: http://127.0.0.1:5174
- API local: http://127.0.0.1:3001/api/health

Até 29/10, o startup local criava conta e demonstração automaticamente, gravando o acesso em `.local/acesso-local.txt`. Desde 30/10 isso foi substituído pelos comandos explícitos de migração/bootstrap descritos acima. Contas e arquivos locais antigos foram preservados e continuam privados; nenhum acesso é recriado ao iniciar. Não há cadastro público de contas nem seed automático.

### O que está implementado

- Login e logout com sessão Better Auth.
- Papéis de administrador e operador aplicados no servidor. O administrador da rede cria, lista, desativa operadores e atribui uma ou mais lojas da própria rede. Operadores consultam o catálogo e registram reposições, perdas e contagens somente nas lojas atribuídas; catálogo, lojas, preços e mínimos são exclusivos do administrador.
- O cadastro gera uma senha aleatória de primeiro acesso, exibida uma única vez ao administrador. O operador precisa trocá-la antes de usar a aplicação. A senha não é enviada por e-mail nem gravada nos logs. A troca conserva a sessão atual e revoga as demais sessões da conta.
- Mudanças de lojas permitidas valem já nas próximas requisições. Desativar um operador revoga suas sessões Better Auth e remove as atribuições ativas. O histórico de acesso registra administrador, operador, ação, data e estados anteriores/novos; leitura desse histórico também exige papel de administrador da rede.
- Catálogo compartilhado dentro da rede, com preço, mínimo e saldo próprios por loja.
- **Estoque inicial** no formulário Novo produto, antes de Estoque mínimo e com padrão zero. Somente inteiros de 0 a 999999; o servidor recusa negativos, frações, tipos inválidos e excesso. O campo `initialStock` ausente mantém saldo zero para clientes antigos. Observação opcional no cadastro. Saldo inicial positivo gera movimento **Estoque inicial** (`initial`) de zero para a quantidade informada, com usuário/data/diferença; saldo zero não gera movimento artificial. Tudo é gravado na mesma transação da criação, somente na loja selecionada. O frontend faz um único POST `/api/products` e preserva o `id` UUID para reenvio do mesmo conteúdo; o servidor usa o ledger `listing_changes` e lock transacional para retornar `replayed: true`, inclusive em envios simultâneos. Mesmo ID com outros dados é recusado; clientes antigos sem ID continuam protegidos contra duplicação por catálogo/loja (409). A migração `006_initial_stock.sql` agora exige o comando explícito `npm run db:migrate` antes de reiniciar a API e preserva os movimentos anteriores; foi verificada em schemas temporários, sem aplicar mudanças de estoque no banco principal nesta sessão.
- Edição do nome, código e categoria compartilhados da rede; preço e estoque mínimo são atualizados somente na loja selecionada. O preço trafega e fica salvo em centavos.
- Filtro por nome/código, categoria e necessidade de reposição, resumo de estoque, listagem-resumo das lojas e exportação CSV do catálogo da loja selecionada.
- Três operações de estoque: **Reposição** soma a quantidade ao saldo atual; **Perda** subtrai e recusa saldo insuficiente; **Contagem** define o saldo como o total encontrado, inclusive zero. Quantidades inteiras entre 1 e 999999 para reposição/perda e entre 0 e 999999 para contagem; saldo final limitado a 999999.
- Saldo e movimento gravados na mesma transação com bloqueio da linha e verificação da versão. Uma versão vencida é recusada sem efeitos: atualize a lista, reabra o produto e confira antes de enviar novamente. Observação opcional na interface e no servidor nas três operações: ausência, vazio ou espaços são armazenados como string vazia; o histórico exibe “Sem observação”, sem gravar justificativa artificial.
- Histórico de estoque registra tipo da operação, saldo anterior, quantidade alterada com sinal, saldo final, usuário e data, separado das edições de catálogo/preço/mínimo. A migração `005_stock_operations.sql` agora é aplicada pelo comando explícito `npm run db:migrate`; preserva os movimentos antigos como contagens e calcula a diferença a partir dos saldos existentes. Nesta entrega ela foi validada somente em schemas temporários de teste; o schema principal não foi migrado pelos testes.
- Reenvio do mesmo identificador de ajuste é idempotente; reutilizar o identificador com dados diferentes é rejeitado.
- Persistência PostgreSQL. PGlite não é dependência direta nem banco da aplicação.
- Navegação principal definida uma vez em `src/Navigation.tsx`, com ícones, seção ativa e Dashboard/Operadores somente para administrador. A mesma navegação permanece lateral acima de 760 px e fica fixa embaixo até 760 px. A navegação duplicada abaixo das ações foi removida. O conteúdo reserva espaço inferior com `safe-area-inset-bottom`; a barra fica oculta enquanto um modal está aberto ou um campo está em foco. Os diálogos têm rolagem interna e, no celular, posição/altura ajustadas ao `visualViewport` (com fallback para viewport dinâmico) para acompanhar o teclado; validação no aparelho ainda pendente.
- Preparação PWA com manifesto, nome provisório MiniMercado, ícones PNG de 192/512 px (512 adequado a máscara), ícone Apple de 180 px e modo standalone. Os ícones usam o monograma e as cores atuais; `scripts/generate-icons.ps1` permite regenerá-los no Windows sem dependência adicional.
- Instalação: botão **Instalar aplicativo** somente após `beforeinstallprompt`; sem essa oferta, há instruções por plataforma em **Como instalar o aplicativo**, sem botão inativo. Em modo standalone, a oferta fica oculta. Sem conexão, há aviso explícito e o cliente recusa operações, sem fila/reenvio automático; uma resposta perdida exige consultar saldo/histórico antes de tentar novamente.

### Roteiro local com duas contas

1. Entre com a conta de administrador local e abra **Operadores**.
2. Cadastre um operador fictício, marque apenas uma das lojas e guarde a senha aleatória exibida nessa confirmação única em canal privado. Fechar a confirmação descarta a senha da interface.
3. Em uma janela privada ou perfil separado, entre com o e-mail e senha inicial. Troque a senha quando solicitado; o operador passa a ver apenas a loja atribuída.
4. Como administrador, altere as lojas permitidas e peça ao operador para atualizar a tela ou fazer uma nova requisição; o acesso removido deve falhar imediatamente. Confira o histórico de acesso.
5. Desative o operador. A sessão aberta deve ser recusada nas requisições seguintes, e um novo login não deve funcionar.

Use somente dados fictícios. Não copie a senha inicial para logs, capturas ou documentação.

### Verificações desta entrega

29/10/2026 — confirmado pelo usuário antes desta implementação: os testes e a validação manual do motivo opcional deram certo. O usuário não informou uma nova contagem de testes; essa confirmação não recebeu contagem inferida.

29/10/2026 — entrega de estoque: `npm test` passou com **40 testes, 0 falhas, 0 ignorados**, e `npm run build` passou (TypeScript de interface/servidor/testes e build Vite). A suíte cobre cálculos das três operações, contagem zero e sem diferença, saldo insuficiente, limite máximo, observação ausente/vazia/espaços, auditoria, permissões por loja/rede, reenvios sequenciais e simultâneos, reutilização de identificador com outros dados, conflitos entre operações, perdas concorrentes, persistência e preservação dos movimentos antigos pela migração. Os testes de integração usam schemas temporários isolados e removem somente esses schemas ao terminar; dados da aplicação e backups foram preservados. A revisão dos componentes conferiu campos rotulados, bloqueio durante envio e inclusão da operação na identificação do reenvio.

29/10/2026 — confirmação posterior do usuário: **contagem, perda e reposição validadas manualmente**. O usuário também confirmou o novo backup e a restauração descritos acima. Na atualização documental dessa confirmação, os resultados anteriores de **40 testes e build aprovados** foram preservados; testes e build não foram executados novamente naquele momento.

29/10/2026 — entrega de navegação/PWA: `npm test` passou com **49 testes, 0 falhas, 0 ignorados**, incluindo a suíte PostgreSQL em schemas temporários. `npm run build` passou com TypeScript de interface/servidor/testes e Vite. Os novos testes conferem navegação e seção ativa por perfil, instruções de instalação, ausência de botão sem oferta nativa, estado standalone/offline, manifesto e dimensões dos PNGs, limite do cache, exclusão da API/autenticação/CSV/mutações, recusa de envio offline e atualização sem ativação forçada. A revisão React conferiu limpeza dos eventos de instalação/conexão, rótulos e permissões; autenticação e regras de estoque do servidor não foram modificadas.

`npm run preview` iniciou em `http://127.0.0.1:5174/`; `/`, `/manifest.webmanifest`, `/sw.js`, `/offline.html` e os três PNGs responderam HTTP 200 com os tipos esperados. A inspeção do PNG 512 confirmou o monograma central com fundo opaco. A prévia estática foi encerrada após a conferência. A API não estava em execução na porta 3001 durante essa prévia; os fluxos de servidor foram conferidos pela suíte de integração, sem afirmar validação completa pelo navegador. Nenhum serviço foi publicado ou contratado.

29/10/2026 — confirmação posterior: **o usuário aprovou visualmente a interface no desktop e mobile**. Instalação da PWA em aparelho continua pendente. Essa aprovação não é uma alegação de inspeção automatizada ou de instalação/homologação.

29/10/2026 — estoque inicial e investigação de nomes: `npm test` passou com **59 testes, 0 falhas, 0 ignorados**, e `npm run build` passou. Os casos novos cobrem campo ausente/zero, saldo positivo auditado, entrada inválida, isolamento por loja/rede e permissões, reenvio sequencial/simultâneo, persistência após reinício e rollback completo quando a gravação do movimento falha. Também cobrem acentos ao salvar/recarregar pela API/banco e rejeição de nomes enviados em Latin-1 ou já com caracteres de substituição. Os testes usam schemas temporários e os removem ao terminar; bancos restaurados e backups foram preservados. Não houve nova inspeção visual do formulário de estoque inicial nesta sessão.

### Preparação da execução online — 30/10/2026

Implementados build do backend ESM e `npm start`, frontend compilado pelo Fastify, fallback SPA restrito, HOST/PORT configuráveis, validação de produção, origem única para Better Auth/CSRF e cookies Secure em origem HTTPS. Migrações e criação inicial do administrador passaram a ser comandos explícitos; nenhum seed/credencial é criado no startup. Encerramento fecha Fastify e pool com prazo. A interface, pagamentos, fiscal e CPF não foram alterados.

**Verificado nesta execução:** `npm run build` passou; após ajustes no HEAD/diagnóstico de inicialização, `npm run build:server` passou. `npm test` passou com **62 testes, 0 falhas, 0 ignorados**, usando exclusivamente um banco separado. O smoke do `npm start` compilado conferiu assets/PWA, recarga de rota, 404 de API/arquivos, health, login, troca obrigatória, CSRF, sessão após reinício e logout. Banco vazio e bootstrap repetido também foram exercitados. Os bancos `minimercado_online_20261030202410_1dd45f`, `minimercado_online_20261030202542_4f82ee` e `minimercado_online_20261030202657_101cd7` foram preservados; o último concluiu o smoke. Os dois primeiros ensaios foram interrompidos no controle de processos do Windows, corrigido no harness sem endpoint de shutdown na aplicação. O banco principal não foi migrado nem recebeu dados de teste.

**Limites:** origem HTTPS simulada sobre HTTP local, com cookies enviados manualmente; flags de cookie conferidas em headers/injeção, sem TLS/proxy/navegador real. O host de acesso ao navegador estava indisponível na tentativa visual. No Windows o harness emite SIGTERM dentro do processo por preload exclusivo de teste; sinal POSIX do sistema operacional ainda precisa ser conferido no ambiente Linux escolhido. Instalação PWA, estoque inicial manual, cópia externa de backup, proxy/rate limit e backups online continuam pendentes. Nenhum serviço contratado/configurado/publicado. Comandos e evidências detalhados em [docs/deploy.md](docs/deploy.md).

### Proteção para Railway — 31/10/2026

Implementados TRUSTED_PROXY_MODE (socket local ou railway-edge com ingresso HTTP exclusivo), encaminhamento interno de IP para Better Auth, limite explícito de login de cinco tentativas por 60 segundos e restrição documentada a uma instância/processo por usar memória. X-Forwarded-For não é usado. O modo edge depende de isolamento de rede e da sobrescrita de X-Real-IP pelo provedor; não autentica chamadores privados nem aceita topologia com TCP Proxy da aplicação.

TLS PostgreSQL passou a usar campos explícitos de conexão, rejeitando parâmetros capazes de sobrescrever segurança/host. Produção/remoto usam verify-full por padrão, com cadeia e hostname obrigatórios e CA por DATABASE_CA_FILE ou DATABASE_CA_PEM. disable-local é restrito ao loopback. Desenvolvimento local e regras de acesso preservados; não houve alteração de interface ou funcionalidades operacionais.

Verificado: npm run test:security aprovou **15 testes direcionados, zero falhas/ignorados**, em banco separado; npm run build passou. Cobertura: 429, concorrência, clientes distintos, cabeçalhos forjados, IPv4 mapeado/IPv6 /64 e handshake TLS com o driver pg, incluindo recusas de CA, hostname, validade e ausência de TLS. A suíte completa de 62 testes de 30/10 não foi repetida. O protocolo PostgreSQL dos testes TLS é uma fixture; login usa PostgreSQL local separado. Não houve conexão a Railway, teste de navegador/HTTPS real, criação de serviços ou publicação. Bancos de ensaio preservados; principal, backups e restaurações não foram alterados. Configuração, fontes oficiais, resultados e critérios de aceite após criar o ambiente estão em [docs/deploy.md](docs/deploy.md).

### Nomes de lojas: investigação e correção dirigida

A leitura direta do banco principal confirmou `server_encoding=UTF8` e `client_encoding=UTF8`. Três registros de `stores.name` já contêm dois U+FFFD (`efbfbd` em UTF-8). A API autenticada `/api/workspace`, conferida por `app.inject`, respondeu HTTP 200 com `application/json; charset=utf-8` e os mesmos nomes/bytes, sem corrupção adicional. O seletor renderiza o nome recebido; a carga inicial contém somente Loja Jardim e Loja Praça, ambas íntegras. Não foi localizada a requisição original com a grafia íntegra nos arquivos e registros de origem consultados.

| ID preservado | Nome anterior | Nome atual definido pelo usuário |
| --- | --- | --- |
| `6764ac68-a56f-4eda-80ec-f1873328eed3` | Loja compara��o A 1028205838 | Loja Teste A |
| `0fc0cb26-8a87-4efa-8e76-b9c8a26b1bf5` | Loja compara��o B 1028205838 | Loja Teste B |
| `9fddd2f5-4e71-4a14-a54e-3fa25e2e2a2f` | Loja valida��o 1028203923 | Loja Teste C |

Inicialmente foi solicitada confirmação da grafia; em seguida, o usuário definiu expressamente os novos nomes da tabela. Em 29/10/2026, foram atualizados somente esses três `stores.name`, em transação, exigindo correspondência de ID, rede, franqueado e nome anterior. A releitura após commit confirmou os novos nomes e que todas as outras lojas/colunas permaneceram iguais. Contagens e hashes dos registros de configurações/saldos, acessos de loja, movimentos, histórico de catálogo, histórico de acesso, produtos, redes e franqueados foram comparados antes/depois e permaneceram idênticos: 11 configurações de produto por loja, 6 movimentos, 4 alterações de configuração e 2 registros de acesso preservados. Não houve exclusão, alteração de IDs/vínculos/estoques/históricos ou substituição global. Um registro privado dessa conferência foi salvo em `.local/`. Nenhum código da aplicação foi alterado nessa renomeação; os resultados anteriores de 59 testes e build foram preservados, sem nova execução.

A proteção da entrada permanece no formulário e no schema do servidor: U+FFFD é recusado, inclusive quando produzido ao decodificar um corpo Latin-1 como UTF-8. Esse mecanismo foi reproduzido nos testes; a autoria exata da requisição histórica permanece não comprovada. Clientes de script devem gerar o JSON em UTF-8; no PowerShell, enviar os bytes com `[System.Text.Encoding]::UTF8.GetBytes($json)` e `Content-Type: application/json; charset=utf-8`, sem confiar na codificação implícita de pipes/strings. O cliente web já envia JSON UTF-8 via `fetch`.

Roteiro curto do estoque inicial: compile o backend e aplique explicitamente a migração 006 com `npm run db:migrate` no banco de teste pretendido; depois inicie a API; como administrador, cadastre um produto fictício com zero e outro com quantidade positiva/observação vazia. Confira saldo e movimento **Estoque inicial** somente na loja selecionada, com “Sem observação”, usuário e data. Confira outra loja e tente entrada negativa/fracionária. Reenvie o mesmo POST com o mesmo `id`: deve retornar `replayed: true` sem duplicar catálogo, saldo ou histórico. A validação manual desta inclusão ainda não foi reportada.

`npm run db:up` foi tentado e falhou por acesso negado à configuração/pipe Docker nesta sessão. O PostgreSQL já estava acessível e atendeu aos testes; essa falha de gerenciamento do Docker não impediu a suíte de integração. A pasta de trabalho não contém `.git`, portanto não foi possível obter status ou diff pelo Git.

Com o PostgreSQL local acessível:

```powershell
npm test
npm run build
```

Registro anterior: antes das mudanças de estoque, o usuário havia reportado 23 testes e build aprovados. Na primeira implementação do motivo opcional, a sessão anterior aprovou 12 testes independentes do banco e o build, mas teve a API bloqueada por PostgreSQL indisponível. Esses registros são históricos; os resultados desta entrega estão descritos acima.

O usuário confirmou validação manual de login, cadastros, edição de preços/estoque e permissões de operadores. Nenhuma senha foi registrada nesta documentação.

A falha Node/tsx foi reproduzida com Node 22.16.0: o tsx consulta `os.userInfo()` ao montar seu diretório temporário, e o Windows gerenciado retorna `uv_os_get_passwd ... ENOMEM` antes dos testes. `npm test` agora usa `node --require ./scripts/node-windows-compat.cjs --import tsx --test tests/*.test.ts`, incluindo o preload nos processos de teste. O ajuste usa `USERNAME` e `os.homedir()` somente nesse erro específico no Windows; em condições normais preserva a consulta nativa e propaga outras falhas. Há testes para essas condições. Nenhum arquivo externo ou variável adicional é necessário; as dependências continuam fixadas, sem editar `node_modules`. Este ajuste está restrito ao comando de testes.

### Roteiro manual das operações de estoque

Com a API reiniciada e a interface local aberta, use produto e loja de demonstração, sem alterar a operação real:

1. Abra **Estoque**, selecione **Contagem**, informe **10** e salve com observação vazia. Confira saldo 10 e histórico com tipo Contagem, saldos anterior/final, diferença, usuário, data e “Sem observação”.
2. Reabra o produto, selecione **Reposição**, informe **3** e salve sem observação: saldo final **13**, alteração **+3**.
3. Reabra, selecione **Perda**, informe **4**: saldo final **9**, alteração **-4**. Tente uma perda de **10**: deve aparecer saldo insuficiente, sem mudar saldo nem acrescentar movimento.
4. Faça uma **Contagem** de **6**: saldo final **6**, alteração **-3**. Uma contagem de **0** também deve funcionar. Repita operações com observação preenchida e confira o texto no histórico.
5. Abra o mesmo produto em duas sessões. Salve em uma; a outra deve recusar o saldo desatualizado. Atualize a lista, reabra e confira antes de salvar. Em ferramentas de rede, repetir o mesmo POST `/api/adjustments` com o mesmo `id` e corpo deve retornar `replayed: true`, sem outro movimento. O corpo usa `operation` (`replenishment`, `loss` ou `count`), `quantity`, `expectedVersion`, `storeId`, `productId` e `reason` opcional.
6. Confira que o mesmo produto em outra loja conservou o saldo e que um operador só consegue operar e consultar o histórico das lojas atribuídas.

### PWA, instalação e teste responsivo

O service worker é registrado somente no build, em contexto seguro. Em `npm run dev` ele não é registrado. Para conferir o build no computador, mantenha a API local em execução e use `npm run build` seguido de `npm run preview`; o frontend de desenvolvimento deve estar parado para liberar a porta 5174. O preview usa a mesma porta/origem local da autenticação e encaminha `/api` à API em `127.0.0.1:3001`. O comando de preview foi verificado nesta sessão; não é hospedagem de produção.

Instalação no celular exige navegador compatível e **HTTPS com certificado válido e confiável no aparelho**. O endereço `http://127.0.0.1` é exceção local de desenvolvimento no próprio computador; no celular ele aponta para o celular, e `http://IP-do-computador` não equivale a HTTPS. O modo de desenvolvimento mantém loopback e origem `http://127.0.0.1:5174`. O runtime compilado agora permite HOST/PORT e exige PUBLIC_ORIGIN HTTPS em produção, servindo frontend/API na mesma origem. O teste físico ainda depende de ambiente controlado com certificado; essa infraestrutura HTTPS e a hospedagem não foram configuradas. Não basta trocar o endereço ou usar `--host`. Requisitos consultados na [documentação MDN de instalação](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

No Chrome/Edge, a ação interna só aparece quando o navegador emite a oferta nativa; se ela não aparecer, consulte o menu do navegador. No iPhone/iPad, use Safari → Compartilhar → Adicionar à Tela de Início e, quando oferecido, Abrir como App da Web. Instruções baseadas no [evento de instalação da MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeinstallprompt_event) e no [guia da Apple](https://support.apple.com/guide/iphone/open-as-web-app-iphea86e5236/ios).

**Cache e atualização:** o único conteúdo em Cache Storage é `/offline.html`, uma página pública sem dados de usuário, no cache `minimercado-offline-v1`. HTML da aplicação, API, sessão, CSV e operações de estoque não são guardados pelo worker. A API/CSV usam `cache: no-store` e o servidor já envia `Cache-Control: no-store`. Não há sincronização em segundo plano, fila de alterações ou sucesso simulado offline. Navegação indisponível mostra a página pública; em uma tela já aberta, o aviso de desconexão informa a indisponibilidade. Estar online no navegador não garante servidor acessível: falhas de rede continuam sendo exibidas. A atualização avisa quando há worker em espera, sem `skipWaiting`, `clients.claim` ou recarga automática; conclua as operações e feche todas as abas/janelas da aplicação antes de reabrir. Ao mudar a página offline, altere também a versão do cache no worker. Ciclo consultado no [guia de atualização de PWA](https://web.dev/learn/pwa/update).

Roteiro curto (somente dados fictícios):

1. No desktop, entre como administrador: confira uma única navegação lateral e as quatro opções, sem atalhos duplicados sob as ações. Alterne seções e confira o destaque ativo. Repita como operador: Operadores, Nova loja, Novo produto e edição de catálogo não devem aparecer; lojas e histórico devem continuar limitados ao acesso atribuído.
2. Em retrato, confira larguras de **360 px e 390 px**: barra fixa inferior, ícones/textos legíveis, três opções para operador/cinco para administrador, conteúdo final e botões acima da barra e da área segura. Verifique ausência de rolagem horizontal em Produtos, Histórico, Lojas e Operadores.
3. Abra estoque, cadastro e edição; role o formulário até as ações. Com campo focado/teclado aberto e com modal aberto, a barra deve ficar oculta. Feche o modal ou retire o foco e confira seu retorno. Teste também o formulário de operador e o login.
4. No ambiente HTTPS controlado, abra online, instale pela oferta nativa ou instruções da plataforma e reabra pelo ícone: confira nome, ícone e abertura standalone. Abra online ao menos uma vez e reabra para que o worker controle a navegação antes do teste offline.
5. Desconecte: confira aviso, tentativa de operação recusada e nenhuma requisição enfileirada. Reabra offline para ver a página de indisponibilidade. Em Application/Cache Storage, deve existir somente a página pública no cache da aplicação; nada de `/api`, CSV, credenciais ou dados de estoque. Reconecte, confira saldo/histórico e só então repita uma operação cuja resposta ficou desconhecida.
6. Com um formulário preenchido, disponibilize um novo build no ambiente de teste: a janela não deve recarregar sozinha. Conclua/cancele conscientemente, feche todas as abas e janelas da aplicação e reabra para conferir a atualização.

**Validação visual e pendências:** na entrega anterior, a inspeção automatizada foi interrompida porque a ferramenta não conseguiu determinar a URL atual com segurança; esse registro permanece histórico. Depois disso, o usuário **aprovou visualmente a interface no desktop e mobile**. A instalação da PWA em aparelho foi posteriormente confirmada pelo usuário em 03/11/2026; não foram fornecidas evidências específicas de offline/atualização em aparelho. O roteiro acima permanece como referência de regressão. O campo de estoque inicial passou nos testes anteriores de formulário/API e foi posteriormente validado manualmente pelo usuário no Railway + Supabase.

Esta etapa não inclui pagamentos, emissão fiscal, consulta de CPF/idade, leitor físico, produção, recuperação de senha, reenvio de credencial, reativação de conta, gestão de outros administradores ou convite por e-mail. O ciclo local backup/restauração foi reportado como concluído pelo usuário; a cópia externa segue pendente. A credencial inicial precisa ser entregue ao operador presencialmente em canal controlado pelo administrador e não pode ser recuperada pela interface depois de fechada a confirmação única. Backups ficam no mesmo computador e não protegem contra perda ou falha do equipamento. Testes locais não validam hardware, homologação, segurança operacional de produção ou serviços hospedados. Não publique o servidor local na rede nem use dados reais.

### Próxima validação

Contagem, perda e reposição foram validadas manualmente pelo usuário; o roteiro acima permanece como referência para futuras verificações. O novo ciclo de backup/restauração também foi confirmado, com o principal intacto.

1. Confirmar a cópia externa de backup, preservando os arquivos existentes.
2. Estoque inicial, reposição, perda e saldo final foram validados pelo usuário no Railway + Supabase, conforme registro acima. Os três nomes de teste já foram atualizados conforme instrução do usuário.
3. Revisar as pendências externas de [docs/deploy.md](docs/deploy.md) antes de autorizar hospedagem; execução compilada já conferida localmente. Depois validar HTTPS/cookies no navegador e offline/atualização da PWA em aparelho; instalação já confirmada pelo usuário. A interface desktop/mobile já foi aprovada pelo usuário.
4. Manter validação de equipamento como dependência explícita. Pagamentos, fiscal e consulta de CPF continuam pendentes e não foram iniciados nesta entrega.

### Recuperação do protótipo — 28/10/2026

A comparação entre `docs/prototipo-anterior/app.js`, `work-original.html` e a versão React está registrada em [docs/comparacao-prototipo-react.md](docs/comparacao-prototipo-react.md). Foram recuperados edição de produto, preço e mínimo por loja, categoria e filtro de reposição, resumo/lista de lojas, exportação CSV e histórico dos valores alterados. Preço e mínimo são isolados por loja; nome, código e categoria continuam pertencendo ao catálogo da rede. O CSV contém os produtos da loja selecionada, mesmo quando há filtros ativos. O reset do protótipo não foi recuperado porque substituía toda a demonstração em `localStorage`.

A interface desktop e mobile foi posteriormente aprovada visualmente pelo usuário. A instalação da PWA em aparelho foi posteriormente confirmada pelo usuário em 03/11/2026; offline e atualização ainda não foram confirmados.

### Decisões técnicas de 28/10/2026

- PostgreSQL convencional em Docker substituiu a tentativa anterior com PGlite após o banco não reabrir de forma confiável. O volume local é persistente. Scripts de backup/restauração local foram adicionados e o usuário reportou ciclo real concluído em banco separado; cópia externa permanece pendente de confirmação.
- Better Auth mantém autenticação da aplicação. Supabase pode ser avaliado futuramente apenas como hospedagem PostgreSQL; nenhum serviço externo foi criado nesta entrega.
- Não implementar pagamentos, fiscal ou CPF nesta etapa.
- Gestão de operadores e autorização por rede/loja no servidor, com histórico de mudanças; usuários novos recebem senha aleatória de primeiro acesso e precisam trocá-la. Sem e-mail ou serviço externo nesta etapa.
- A migração incremental `004_user_access.sql` adiciona estado de conta, acesso explícito por loja e trilha de auditoria sem apagar os cadastros existentes.

### Operadores e estrutura do Dashboard — 03/11/2026

**Confirmado pelo usuário:** instalação da PWA em aparelho. Esta confirmação atualiza as pendências de instalação mencionadas nos registros anteriores; não comprova testes de offline, atualização ou hardware.

**Implementado:** Operadores usa linhas de seleção clicáveis com uma coluna de checkbox de 20 px e o restante disponível para o nome, tanto na criação quanto na edição. Nomes longos mantêm a quebra por palavras, com quebra de emergência para palavras sem espaços. Regras e endpoints de acesso não foram alterados.

Dashboard adicionado à navegação compartilhada desktop/mobile, exclusivo do administrador, com proteção também na montagem do conteúdo. O título acompanha a seção. Filtros de período (hoje, últimos sete dias, mês atual e datas personalizadas) e loja usam somente lojas do workspace autorizado. O período personalizado sinaliza intervalo incompleto/invertido. A seleção define apenas o recorte visual nesta etapa: não existe consulta de vendas nem endpoint novo de relatório. Futuros endpoints deverão exigir administrador e isolamento da rede no servidor.

Estrutura visual para faturamento, ticket médio, mix de produtos vendidos, vendas por período, formas de pagamento e rankings de produtos, lojas e categorias. Estado vazio explícito, sem valores, gráficos ou rankings fictícios. Quantidade de vendas e valor financeiro por modalidade são tratados como medidas distintas. Curva ABC fica como próximo indicador; margem e markup dependem de cadastro de custos e preservação dos custos históricos das vendas.

**Verificado nesta entrega:** `node --require ./scripts/node-windows-compat.cjs --import tsx --test tests/navigation.test.ts tests/dashboard.test.ts` passou com **3 testes, 0 falhas**; `npm run build` passou após as alterações. Testes cobrem navegação por perfil, seção ativa, conteúdo dos filtros, estado vazio e dependência de custos. Revisão dos componentes conforme a skill React: campos rotulados, estado local simples, listas com chaves estáveis e nenhum efeito/requisição adicional no Dashboard. Suíte de banco não repetida; nenhum banco, backup ou regra de acesso do servidor alterado.

**Limitação da validação visual:** prévia Vite iniciada em loopback e fixtures privadas preparadas em `.local/verify-layout.html` para 360 e 1280 px, com dados fictícios e gravações bloqueadas. A ferramenta de acesso direto ao navegador estava indisponível; a alternativa Windows encerrou o controle porque não conseguiu determinar a URL atual com segurança. Portanto, navegação interativa, criação/edição em 360 px e desktop e aparência dos cinco itens mobile **ainda precisam de conferência visual**; não são considerados aprovados por esta entrega. Fixtures não acessam o banco e não integram o build. Nenhum push ou publicação realizado.

### Backlog das áreas vistas nas referências

Este quadro organiza referências já descritas em “Evidências analisadas”. Não representa implementação nem conhecimento completo das regras dos menus. Nesta entrega foram implementados somente o ajuste de Operadores e a estrutura do Dashboard.

| Área | Estado e próximos passos |
|---|---|
| Caixa e transações | Pendente: scanner/carrinho no equipamento real, registro de pedidos e tentativas de pagamento, consulta e reconciliação, cancelamentos/estornos e histórico com filtros. Integrar um fornecedor e validar hardware/homologação; menus e fotos não comprovam integração. |
| Dashboard | Estrutura e filtros visuais implementados, aguardando registro real de vendas e API administrativa isolada por rede/loja. Depois calcular faturamento, ticket médio, mix, evolução, modalidades e rankings. Curva ABC futura; margem e markup condicionados aos custos cadastrados e históricos. |
| Estoque e planogramas | Cadastro, parâmetros por loja, estoque inicial, contagem, reposição, perdas e históricos implementados. Pendentes: quantidade desejada/planogramas, estoque central, transferências, compras, separação/conferência, rotas e checklists. Detalhar regras antes de implementar. |
| Preços e promoções | Preço por loja e histórico implementados. Pendentes: tabelas de preços, cupons, limites de uso, condições e descontos; manter cálculo exato e preço histórico da venda. |
| Fiscal | Pendente: provedor, requisitos com contador, emissão e tratamento de autorização, rejeição e pendência. Cenários, integração, notas e configurações foram vistos como menus; não inferir regras internas. |
| Telemetria | Pendente: estado online/offline dos terminais, rede, última comunicação, falhas e sincronização. Aviso de conexão da PWA não equivale a monitoramento dos caixas. |
| Mídia e relacionamento | Pendentes: biblioteca de imagens/logos, carrosséis e campanhas. CRM e clube de vantagens observados como menus, sem regras confirmadas; não implementados nesta entrega. |

Decisão de 03/11/2026: preparar a estrutura administrativa do Dashboard sem simular resultados antes de haver vendas. Impacto: nenhuma métrica financeira é inferida do estoque ou das referências; integrações de pagamento, fiscal, CPF e validação do equipamento continuam pendentes e fora desta entrega.
