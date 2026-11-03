# Contar estoque pela câmera — MiniPay

Implementação de 03/11/2026. A câmera usa `getUserMedia` com preferência pela câmera traseira e decoder ZXing carregado sob demanda. O mesmo fluxo funciona no navegador e em modo PWA, sem plugin nativo. **Câmera física em celular, permissões reais e captura/seleção de fotos em Android/iOS ainda precisam de validação manual.** Os testes automatizados usam imagem sintética, câmera simulada, DOM e API/banco reais; não comprovam hardware.

## Uso e permissões

1. Selecione a loja e abra **Estoque → Contar estoque pela câmera → Abrir câmera**.
2. Autorize a câmera e aponte para o código. **Digitar código → Buscar código** está disponível sem câmera, inclusive quando a permissão é negada. O campo é texto: nunca converte o código para número.
3. Encontrado na loja: confira foto (ou **Foto pendente**), nome e saldo consultado. Informe o total contado pelo teclado ou +/−, inclusive **0**. Confirme a contagem; a observação é opcional.
4. Conhecido na rede, ausente na loja: o administrador pode escolher **Adicionar à loja**, informar preço, mínimo e estoque inicial. Nome, categoria, código e foto são reaproveitados do catálogo. Preço e estoque de outras lojas não são expostos pela busca.
5. Desconhecido: para administrador, abre **Novo produto** com o código preenchido. Foto obrigatória: **Tirar foto** ou **Escolher foto**. Operador recebe orientação para pedir o cadastro/inclusão ao administrador; a permissão existente não foi ampliada.
6. Após a leitura, a câmera é desligada e callbacks seguintes são descartados. Salvar, cancelar cadastro ou consultar saldo **não** reinicia a câmera. Somente **Ler outro produto** solicita nova captura. Fechar, sair da página ou colocar o app em segundo plano também libera a câmera; retornar não retoma automaticamente.

Sem rede, não há contagem offline nem fila de gravações. Uma resposta perdida exige conferir saldo/histórico; reenvio do mesmo conteúdo na mesma tela mantém o UUID. Em conflito de versão, **Consultar saldo novamente** recupera a versão atual e descarta a quantidade anteriormente digitada: confira fisicamente antes de confirmar de novo. Nenhum conflito é sobrescrito automaticamente.

## Catálogo e códigos

`products.code` continua sendo o identificador textual único **por rede**, compartilhado com o futuro caixa; não existe cadastro paralelo para a câmera. A consulta `/api/products/lookup?storeId=…&code=…` exige sessão, rede e acesso à loja. A resposta distingue `active`, `catalog` e `unknown`. O acesso ao catálogo da rede permite reaproveitar produtos de outra loja, sem conceder acesso ao estoque dela.

O cadastro atual aceita **8 a 14 dígitos**. O decoder está configurado para EAN-13, EAN-8, UPC-E, Code 128 e ITF, aceitando somente resultados que também satisfaçam esse cadastro. Não remove zeros, completa dígitos nem cria equivalências entre códigos diferentes. A configuração exclui UPC-A para impedir que o ZXing retire um zero inicial do EAN-13. **Limitação:** o padrão de barras UPC-A é indistinguível de EAN-13 com zero inicial; neste fluxo ele é representado como EAN-13. Se o catálogo tiver apenas o UPC-A de 12 dígitos, use a entrada manual com o código cadastrado e revise a convenção antes de habilitar esse formato no caixa. Não converter cadastros automaticamente.

## Fotos persistentes e implantação

Antes desta entrega não havia suporte a fotos de produto. A migração **`007_product_photos.sql`** adiciona tabela central vinculada a `(network_id, product_id)`, com imagem `bytea`, autor e data. Produto, foto, parâmetros da loja e movimento inicial são gravados na mesma transação. Não usa disco efêmero da hospedagem, URL pública, serviço novo ou armazenamento do navegador. A foto entra nos backups PostgreSQL; o procedimento de backup/restauração com fotos ainda deve ser exercitado. Nenhuma migração foi aplicada no banco principal nesta entrega.

O formulário aceita JPEG, PNG e WebP de até **20 MiB / 16 megapixels**, reduz para até **1200 × 1200** e envia JPEG. O servidor não confia nessa preparação: valida base64, limite de **3 MiB**, formato real compatível com o MIME declarado, até **16 megapixels**, recusa animação/múltiplas páginas e conteúdo corrompido; decodifica e converte novamente para JPEG sem EXIF/perfil/localização. A rota de cadastro do fluxo tem limite de corpo de 4 MiB + 16 KiB. SVG, GIF e HEIC não são aceitos; use JPEG/PNG/WebP. O ledger armazena o hash da foto para reenvios, sem duplicar base64 no histórico.

`GET /api/products/:id/photo?storeId=…` verifica sessão ativa, primeira troca de senha, rede e loja permitida em cada requisição. Serve somente JPEG, com `nosniff`, `Cross-Origin-Resource-Policy: same-origin` e `Cache-Control: private, no-store`. Uma foto do catálogo pode ser vista no contexto de qualquer loja autorizada da mesma rede, inclusive antes da inclusão. O service worker já exclui `/api/` e não armazena fotos. Revogação de acesso vale para novas requisições; não apaga uma imagem que já esteja desenhada na tela.

Produtos antigos e cadastros feitos fora desse fluxo continuam podendo existir sem foto e ser contados; são sinalizados **Foto pendente**. Esta entrega não adiciona edição/substituição de fotos antigas.

Para disponibilizar em um ambiente **de testes autorizado**, instalar o lock atualizado, executar `npm run build`, apontar as variáveis para o banco de testes e executar `npm run db:migrate` antes de `npm start`. A migração é aditiva; startup recusa schema pendente. Os comandos foram verificados em banco separado. Não executar migração em produção como parte desse roteiro. As dependências de runtime incluem `sharp` com binários específicos da plataforma: instalar no ambiente de destino, sem copiar `node_modules` do Windows para Linux.

## Roteiro no celular por HTTPS

Pré-requisitos: build desta alteração disponível em ambiente isolado e autorizado, com banco exclusivo de teste, certificado HTTPS válido e frontend/API na mesma origem. Use a configuração de [deploy](deploy.md), com `PUBLIC_ORIGIN` igual à origem HTTPS exata e cookies Secure. Publicar, abrir túnel público ou migrar o ambiente existente exige autorização própria; nada disso foi feito nesta entrega. `http://192.168.…` não é alternativa para testar câmera no celular; o loopback HTTP só serve para o próprio computador.

Prepare dados **fictícios**: duas lojas A/B da mesma rede, administrador, operador com acesso só à A, um produto na A, outro somente na B, um código desconhecido e um produto antigo sem foto. Use um código com zeros iniciais (EAN-13 válido de teste **0012345678905**; o código manual também aceita dígitos sem checksum). Não usar produtos ou saldos ativos da operação real.

Execute cada caso no **Chrome Android**, no **Safari iOS** quando disponível e novamente na **PWA instalada**, registrando aparelho, SO, versão do navegador, modo e resultado. Feche as janelas antigas para liberar eventual atualização da PWA antes de começar.

| Caso | Ação e resultado esperado |
| --- | --- |
| Encontrado | Na A, ler produto da A; conferir loja, foto/nome e saldo. Usar +, − e teclado; confirmar zero sem observação. Histórico deve conter uma contagem com usuário, data, saldo anterior/final e “Sem observação”. Recarregar mantém zero. |
| Repetição | Manter código diante da câmera após leitura, esperar e mover outro produto para o enquadramento. Nenhuma busca/contagem extra deve acontecer. Só **Ler outro produto** volta a capturar, inclusive permitindo reler o mesmo código. |
| Outra loja | Na A, ler código existente apenas na B. Administrador vê **Adicionar à loja** e a mesma foto; define preço/mínimo/estoque inicial. A recebe configuração própria e B não muda. Operador não pode cadastrar nem consultar a loja B. |
| Desconhecido | Abre **Novo produto**, preservando zeros. Sem foto não salva. Testar tirar foto e escolher arquivo em cadastros distintos; salvar e recarregar. Incluir em outra loja e conferir que há uma única foto/cadastro central. |
| Sem foto antiga | Produto mostra **Foto pendente** e permite confirmar contagem normalmente. |
| Negada/ausente | Negar permissão nas configurações, fechar e reabrir. Deve aparecer orientação e ser possível digitar o código completo com zeros. Testar câmera inexistente/ocupada quando possível. |
| Interrupção | Com câmera aberta ou permissão pendente, fechar modal, trocar de app, bloquear tela ou fechar janela. Indicador da câmera deve desligar; ao voltar só retoma por botão. |
| Concorrência | Abrir o mesmo produto em dois aparelhos/janelas. Confirmar um movimento na primeira; a contagem antiga na segunda recebe conflito. Consultar saldo novamente, conferir e decidir nova contagem. Verificar histórico sem sobrescrita. |
| Conexão | Desconectar antes de buscar/salvar: mensagem de rede e nenhuma fila. Após interrupção durante envio, reconectar e conferir saldo/histórico antes de nova tentativa. |
| Fotos inválidas | Escolher formato recusado ou arquivo acima do limite: erro claro e cadastro não concluído. Também testar foto comum de câmera acima de 3 MiB e abaixo de 20 MiB, verificando redução e persistência. |
| Sessão/permissão | Sair e abrir URL da foto: acesso negado. Remover acesso à A ou usar conta de outra rede: nova consulta/foto/contagem negada pelo servidor. |

A chamada nativa **Tirar foto** depende do seletor de mídia do sistema; se ele não oferecer captura, **Escolher foto** permanece disponível. Registrar particularidades em vez de assumir equivalência entre aparelhos.

## Evidência automatizada

Verificação final em 03/11/2026: `npm run build` aprovado; `npm run verify:online` executou a suíte completa (`npm test`) com **99 testes aprovados, 0 falhas, 0 ignorados**, migrações/bootstrap e smoke da execução compilada, em banco separado preservado `minimercado_online_20261103180507_deafc1`. Ensaio anterior com 98 testes preservado em `minimercado_online_20261103180037_714896`. O comando direcionado `node --require ./scripts/node-windows-compat.cjs --import tsx --test tests/scanning.test.ts tests/scan-dialog.test.ts` passou com **11 testes**. Nenhum desses testes usa câmera física ou certificado HTTPS de um ambiente hospedado.

- `tests/scanning.test.ts`: decoder real em imagem EAN-13 sintética com zeros iniciais, bloqueio de callbacks repetidos, reinício explícito, encerramento com permissão pendente e mensagem de alternativa manual.
- `tests/scan-dialog.test.ts`: interação DOM com permissão simulada negada, digitação, +/−, zero, observação ausente, bloqueio de reenvio após sucesso, inclusão de produto da rede e abertura do cadastro desconhecido com foto obrigatória; preservação de permissões no formulário.
- `tests/scan-server.test.ts`: validação real das imagens, isolamento por rede/loja/sessão, reuso da foto, reenvios simultâneos, conflitos, contagem zero e auditoria; persistência após reabrir banco/API.

Referências consultadas em 03/11/2026: [ZXing Browser](https://github.com/zxing-js/browser), [conversão UPC-A/EAN-13 no decoder](https://github.com/zxing-js/library/blob/master/src/core/oned/MultiFormatUPCEANReader.ts), [getUserMedia e contexto seguro](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia), [limites de entrada do Sharp](https://sharp.pixelplumbing.com/api-constructor/), [remoção padrão de metadados](https://sharp.pixelplumbing.com/api-output/#tobuffer).
