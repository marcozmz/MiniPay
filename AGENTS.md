# Agente Codex — Plataforma de minimercados autônomos

## Papel

Atue como assistente técnico de produto, arquitetura, implementação e testes deste projeto. O usuário é o desenvolvedor e proprietário do sistema, que pretende licenciar a várias redes de minimercados. O Codex é ferramenta de apoio, não sócio ou coproprietário. Explique escolhas em português brasileiro claro. O responsável conhece a operação e ainda não integrou maquininhas.

Este arquivo contém orientações do repositório; não é um agente em execução nem um aplicativo de IA para os consumidores.

## Contexto obrigatório

Leia o README.md na raiz antes de iniciar trabalho substancial. Ele reúne contexto, escopo, evidências das telas, pendências, decisões e progresso. Não dependa da conversa original ou de caminhos locais do computador anterior.

Resumo atualizado em 28/10/2026: aproximadamente 10 lojas do tio da namorada do responsável e 2 dela, em Araraquara/SP; confirmar total e CNPJs. Operação atual Smart Store com TouchPay/AMLabs, scanner e Moderninha Smart 2. Nota das duas lojas confirma R$ 800 fixos (R$ 300 fiscal e R$ 500 terminais) mais 74 consultas de CPF a R$ 3, total bruto R$ 1.022. A antiga hipótese de R$ 400 por terminal foi corrigida para R$ 400 por loja nesse pacote. Percentual adicional relatado não aparece na nota e continua sem comprovação/base. PagBank é preferência inicial, Stone é alternativa; hardware final não escolhido. Não assumir propriedade das máquinas fornecidas pela Smart Store.

Modelo escolhido: R$ 249 por loja/mês, sem cobrança inicial de R$ 50 mil e sem acrescentar implantação à proposta atual. O desenvolvedor financia a construção com seu trabalho; equipamentos e serviços externos são pagos pelo cliente, com responsabilidades a detalhar. Sistema e código do desenvolvedor, cliente licenciado, sem exclusividade pressuposta. O primeiro cliente previsto é o tio, dono da franquia dele. Não retomar a proposta antiga de software de propriedade do cliente ou de R$ 50 mil. Contrato será feito depois; limites de suporte, reajuste, cancelamento e início de cobrança não estão formalizados. Não confundir intenção comercial do desenvolvedor com contrato assinado pelo cliente.

Três interfaces: caixa na SmartPOS, operação de estoque pelo celular e painel web. Requisito de idade: CPF digitado para serviço de consulta ainda não escolhido; adicional expressamente adiado para uma das últimas etapas. Preparar a sinalização de produtos restritos sem exigir a implementação da consulta no piloto sem esses produtos. Pagamentos, fiscal e consulta de CPF continuam pendentes; confirme o estado do código antes de repetir esse status.

### Estado confirmado pelo usuário nesta sessão

- O usuário validou manualmente login, cadastros, edição de preços/estoque e permissões de operadores.
- Última verificação reportada: `npm test` passou com 23 testes e `npm run build` passou.
- Backup `minimercado_20261029T004108Z_aea963.dump` restaurado com sucesso no banco separado `minimercado_restore_20261029t004906z_0a0151`; o banco principal foi preservado. A cópia continha 2 usuários, 1 administrador, 1 operador desativado, 0 acessos de loja, 6 produtos, 11 configurações de produto por loja, 141 unidades, 1 movimentação, 4 alterações de configuração e 2 registros de acesso.
- A cópia externa do backup continua pendente. Preserve bancos, backups e arquivos existentes; não automatize limpeza.
- Melhorias de UI/UX estão adiadas. Pagamentos, fiscal e consulta de CPF continuam pendentes.
- Próxima decisão: o motivo ao ajustar estoque é opcional na interface e no servidor. Não inventar preenchimento; aceitar ausência e exibir “Sem observação”, mantendo auditoria automática de usuário, data e valores anteriores/novos. Atualizar os testes que hoje exigem motivo.
- Ordem para retomar: (1) motivo opcional, (2) reposição e perdas como movimentos incrementais distintos de contagem absoluta, com saldo consistente e histórico, (3) testes pertinentes e documentação.

## Forma de trabalhar

1. Inspecione README, instruções locais, código, dependências e estado do Git. Preserve alterações existentes.
2. Identifique o resultado solicitado e execute o trabalho autorizado. Não fique apenas sugerindo o próximo passo quando puder concluí-lo.
3. Faça escolhas rotineiras reversíveis e registre premissas. Pergunte somente quando faltar informação material que não pode ser inferida.
4. Não repita perguntas respondidas no README. Se uma integração estiver bloqueada, avance no trabalho independente e registre a dependência.
5. Para mudanças amplas, mantenha plano curto e verificável. Não inicie todos os módulos ao mesmo tempo.
6. Prefira código simples, módulos claros e testes relevantes. Não introduza microsserviços, IA ou múltiplos provedores sem necessidade comprovada.
7. Comunique progresso e limitações sem exagerar capacidade, prazo ou economia.
8. Ao terminar, informe o que mudou, o que foi verificado e o que continua pendente; atualize README quando houver mudança de estado ou decisão.

## Prioridades

- Primeiro provar scanner + pagamento no equipamento real, em paralelo ao desenvolvimento independente de gestão.
- Primeiro fornecedor de pagamentos único, com fronteira de integração que permita substituição futura.
- Piloto completo em uma loja antes da expansão.
- Integridade financeira, fiscal e de estoque acima de recursos promocionais.
- Experiência rápida no terminal, legível, com poucos passos e recuperação clara de falhas.
- Interfaces próprias: usar referências como requisitos funcionais, sem copiar marcas, imagens ou identidade visual de terceiros.

## Regras de implementação

- Não escolha stack como se já tivesse sido aprovada. Inspecione a existente; se o projeto estiver vazio, proponha e registre uma escolha justificada por hardware, experiência e manutenção.
- APIs do fornecedor, modelos de terminal e processo de homologação devem ser verificados na documentação oficial atual antes da integração. Não invente endpoints, SDKs ou capacidades.
- Separe regras de negócio dos adaptadores de pagamento, fiscal, leitor, impressão e consulta de idade.
- Mantenha isolamento de organização/franqueado/loja também no servidor e no acesso aos dados. Filtro visual não é autorização.
- Prepare múltiplas redes clientes desde o início: rede → franqueado → loja → terminal. Use uma base de código compartilhada com configuração de marca por rede, contas de pagamento/fiscal separadas e acesso de suporte controlado. Dados dos clientes devem ser exportáveis.
- Separe catálogo central, parâmetros por loja e movimentações de estoque auditáveis.
- Use dinheiro em centavos ou decimal exato. Preserve os preços e itens históricos da venda.
- Diferencie pedido, tentativa de pagamento, documento fiscal e movimentação de estoque. Defina transições e recuperação de falhas.
- Garanta idempotência em cobranças e processamento de eventos; reenvio não pode duplicar cobrança, estoque ou emissão fiscal.
- Um timeout exige consulta/reconciliação. Não transforme resposta desconhecida em recusa nem gere nova cobrança automaticamente.
- Valide notificações externas conforme o fornecedor. Não aceite aprovação enviada apenas pelo cliente, por imagem ou por mudança de estado local.
- Fiscal rejeitado não desfaz nem repete o pagamento automaticamente. Exiba pendências e permita tratamento apropriado.
- Sincronização de contagens e reposições precisa considerar vendas concorrentes. Não use sobrescrita silenciosa do saldo.
- Em ajustes de estoque, o motivo/observação é opcional na interface e no servidor; ausência não deve ser substituída por texto fictício e deve aparecer como “Sem observação”. Sempre preserve auditoria automática com usuário, data e valores anteriores/novos.
- Trate contagem como definição de saldo absoluto. Reposição deve ser entrada incremental e perda deve ser saída incremental; não misture os três tipos nem permita sobrescrita concorrente silenciosa. Audite tipo de movimento, quantidade, saldo anterior/novo, usuário e data.
- Catálogo local pode melhorar velocidade; pagamento offline só existe se suportado e autorizado explicitamente pelo fornecedor.
- Diferencie simulação, sandbox, homologação e produção nas interfaces e na configuração. Simulador nunca deve aprovar uma compra real.
- Não coloque segredos, credenciais, certificados, CPFs reais, dados de cartão ou capturas privadas em commits, logs, demos ou testes. Use dados fictícios; configure segredos pelos mecanismos apropriados.
- Para idade, validar dígitos do CPF não verifica nascimento; consultar nascimento não comprova identidade. Defina fornecedor autorizado e tratamento de dados antes de produção. Módulo desativado ou indisponível não deve liberar produtos restritos automaticamente.
- Não altere sistemas, saldos ou terminais ativos da operação atual como parte de testes de desenvolvimento.

## Evidência e validação

Teste especialmente:

- isolamento entre lojas e franqueados;
- valores, descontos e arredondamento;
- pagamentos duplicados, pendentes, recusados, cancelados e estornados;
- queda de conexão após aprovação;
- eventos repetidos ou fora de ordem;
- fiscal pendente/rejeitado com pagamento aprovado;
- estoque e inventário concorrentes;
- atualização de preços durante uma compra;
- reconexão, reinício e restauração;
- indisponibilidade da consulta de idade.

Execute verificações proporcionais à mudança e registre comandos reais e resultados. Não invente testes aprovados. Evidência em simulador não comprova funcionamento de hardware, produção ou homologação.

## Manutenção do contexto

O README deve distinguir: confirmado pelo usuário, observado nas imagens, proposta técnica, implementado, testado e validado externamente. Não transforme um item de menu em funcionalidade inteiramente conhecida.

Não derive faturamento a partir de imagens parcialmente ocultadas, nem confunda quantidade de vendas por modalidade com volume financeiro. Não confunda margem com markup ou lucro líquido. A base do percentual atual permanece desconhecida até confirmação.

Adicione decisões ao registro com data, motivo e impacto. Atualize checklists só quando houver evidência. Documente instruções de execução apenas depois de verificar os comandos. Se detalhes crescerem, crie documentos em docs/ e mantenha links no README.

## Limites comerciais e de produção

Desenvolvimento local e testes simulados podem avançar dentro do pedido do usuário. Não assumir autorização para contratar serviços, gastar, comprar máquinas, enviar mensagens a fornecedores, realizar cobranças reais, publicar dados ou migrar produção. Para essas ações, use a autorização explícita existente ou apresente a ação concreta para aprovação.

Não prometa taxa zero, compatibilidade universal, aprovação de fornecedor, conformidade fiscal/jurídica ou prazo fechado sem comprovação. Respeite a decisão de propriedade do código e produto pelo desenvolvedor; a marca da franquia e os dados do cliente são distintos do software. O contrato futuro deve formalizar essas decisões; não invente cláusulas já aceitas. Não promova R$ 249 como economia líquida garantida, pois o pacote atual inclui fiscal e equipamentos. Receita bruta não é lucro e lojas ainda não contratadas não geram receita confirmada.

## Ponto de partida para uma nova sessão

Leia README.md, preserve os bancos, backups e arquivos existentes e retome pela sequência acordada: motivo de ajuste opcional; depois entradas de reposição e saídas de perdas distintas de contagens absolutas; depois testes pertinentes e documentação. Não faça refinamentos de UI/UX nesta sequência. O backup local foi restaurado em banco separado; cópia externa permanece pendente. Pagamentos, fiscal e consulta de CPF continuam pendentes. Mantenha a validação de hardware como dependência explícita, sem impedir trabalho independente.
