# Ambiente de testes online — preparação local atualizada em 31/10/2026

O código executa o frontend compilado e a API Fastify no mesmo endereço, sem Vite/tsx no runtime. **Nenhum serviço foi configurado, contratado ou publicado.** A preparação de proxy e TLS foi implementada e testada localmente em 31/10; conectividade/certificados do banco real, isolamento do ingresso HTTP, HTTPS, custos e backups ainda precisam ser conferidos após criar o ambiente autorizado. Para estes testes, usar **uma única réplica e um único processo Node**, com aplicação e PostgreSQL separados.

## Artefatos e comandos

Node.js **22.x**, conforme `package.json`. `npm run build` verifica os tipos e gera `dist/` (frontend) e `dist-server/` (JavaScript ESM do backend, domínio compartilhado e cópia das migrações SQL). `npm run build:server` recompila somente o backend. `npm start` executa `node dist-server/server/index.js`; não inicia Vite, preview nem tsx. Preserve a estrutura relativa dos dois diretórios.

Sequência de preparação, depois de instalar as dependências de construção e configurar as variáveis abaixo:

```powershell
npm run build
npm run db:migrate
# Somente em banco novo, com as variáveis BOOTSTRAP_* configuradas:
npm run db:bootstrap-admin
# Remova BOOTSTRAP_* do ambiente normal após o bootstrap.
npm start
```

Os quatro comandos foram exercitados localmente com um banco separado de teste. Essa sequência não autoriza executá-los no banco principal nem hospedar o serviço. Para implantação futura, construir com dependências de desenvolvimento e entregar `dist/`, `dist-server/`, `package.json`, `package-lock.json` e dependências de runtime instaladas a partir do lock. Uma instalação final com dependências de desenvolvimento omitidas ainda não foi ensaiada nesta entrega; o entrypoint compilado não importa essas ferramentas.

## Variáveis (sem valores de credenciais)

As variáveis devem ser injetadas pelo ambiente/processo; o servidor não carrega arquivos `.env` automaticamente. Nunca copiar valores para documentação, commits, argumentos de terminal compartilhados ou logs.

| Nome | Regra |
| --- | --- |
| `NODE_ENV` | Definir `production` no ambiente online. Valores desconhecidos são recusados. |
| `PUBLIC_ORIGIN` | Obrigatória em produção: origem HTTPS exata, sem barra final, caminho, query, fragmento ou credenciais. Deve corresponder ao endereço externo do navegador. |
| `BETTER_AUTH_SECRET` | Obrigatório em produção, estável, exclusivo do ambiente, aleatório e com pelo menos 32 caracteres. Não há geração/fallback local em produção. Não alterar a cada deploy. |
| `DATABASE_URL` | Obrigatória em produção; URL PostgreSQL privada do banco exclusivo do ambiente. Somente `application_name` e `sslmode=require`/`verify-full` são aceitos na query; ambos os modos SSL continuam validando cadeia e hostname. Outros parâmetros são recusados, inclusive sobrescritas de host, opções, arquivos SSL e `ssl=no-verify`. Não transportar o banco principal para testes. |
| `DATABASE_TLS_MODE` | `verify-full` é o padrão em produção e em qualquer host remoto: TLS 1.2+, cadeia e hostname obrigatórios. `disable-local` só é permitido para localhost/127.0.0.1/::1, sem CA nem exigência TLS na URL; é o padrão somente no desenvolvimento local e pode ser explicitado no smoke de produção em loopback. No Railway usar `verify-full`, nunca `disable-local`. |
| `DATABASE_CA_FILE` | Opcional se a cadeia já for confiável pelo sistema; caso contrário fornecer a CA do banco por arquivo PEM. Preferir caminho absoluto, disponível também no pre-deploy. Não combinar com `DATABASE_CA_PEM`. |
| `DATABASE_CA_PEM` | Alternativa ao arquivo: conteúdo PEM da CA ou cadeia confiável, injetado no ambiente (não o caminho). Útil no Railway porque pre-deploy não monta volumes. PEM inválido ou configuração simultânea com CA_FILE impede conexão. Nunca incluir chaves privadas. |
| `TRUSTED_PROXY_MODE` | `socket` por padrão, preservando o local e ignorando cabeçalhos de IP. No Railway, selecionar explicitamente `railway-edge` **somente com ingresso exclusivo pelo edge HTTP público**, sem TCP Proxy da aplicação nem chamadores privados não confiáveis. Ver contrato e testes abaixo. |
| `PORT` | Inteiro de 1 a 65535. Padrão 3000 em produção e 3001 no desenvolvimento. A hospedagem pode injetar esse valor. |
| `HOST` | IP de escuta ou localhost. Padrão `::` em produção e `127.0.0.1` no desenvolvimento. Pode ser definido como `0.0.0.0` quando o provedor exigir IPv4. |
| `BOOTSTRAP_ADMIN_EMAIL` | Somente no comando de bootstrap; e-mail da conta inicial. |
| `BOOTSTRAP_ADMIN_NAME` | Somente no bootstrap; nome do administrador. |
| `BOOTSTRAP_ADMIN_PASSWORD` | Somente no bootstrap; senha inicial privada de 12 a 128 caracteres, escolhida/gerada fora dos logs. Entregar em canal privado. |
| `BOOTSTRAP_NETWORK_NAME` | Somente no bootstrap; nome da rede inicial. |
| `BOOTSTRAP_FRANCHISEE_NAME` | Somente no bootstrap; nome do franqueado inicial. |

O modo local mantém origem `http://127.0.0.1:5174`, API no loopback e Vite separado em `npm run dev`. Fora de produção, ainda pode usar os arquivos locais existentes de conexão/secret; nenhum arquivo com credenciais foi exibido nesta entrega. `npm start` fora de produção também serve o build, mas um teste nesse endereço exige `PUBLIC_ORIGIN` correspondente à porta do próprio Fastify.

## Banco e administrador explícitos

`npm run db:migrate` usa o backend compilado, aplica as seis migrações versionadas em transação com advisory lock e encerra o pool. Repetir o comando não reaplica as versões existentes. A migração histórica 003 preserva seu comportamento de compatibilidade com categorias antigas; nenhuma carga de demonstração é executada pelo comando ou startup.

`npm start` apenas confere conexão, versões esperadas do schema e presença de memberships antes de escutar. Banco vazio, versões pendentes ou incompatíveis causam saída com falha; o servidor não cria schema, não migra, não roda seed e não cria/recria credenciais. `/api/health` consulta o banco/schema e retorna 503 quando indisponível/incompatível, sem divulgar detalhes internos.

`npm run db:bootstrap-admin` exige banco migrado **sem usuários e redes**. Uma única transação, com lock, cria usuário/conta Better Auth com hash de senha, rede, franqueado e vínculo de administrador com troca obrigatória no primeiro acesso. Não cria lojas, produtos ou saldos de exemplo. Repetição é recusada, sem alterar contas existentes; não é comando de reset/recuperação. Nenhuma senha é impressa ou gravada em arquivo. A criação direta usa o hash oficial da versão instalada de Better Auth e foi conferida pelo login real na API.

SIGINT/SIGTERM fecham primeiro o Fastify e depois o pool PostgreSQL, com prazo de 10 segundos e falha explícita se excedido. Falhas de inicialização também fecham os recursos já abertos; logs mostram etapa/código permitido, sem URL do banco, segredo, senha, cookie ou stack.

## HTTP, SPA e autenticação

Somente o conteúdo público inventariado em `dist/` é servido. Não há acesso estático à raiz do projeto, `.local/`, backups ou código do servidor. O fallback para `index.html` exige GET com Accept HTML e caminho de navegação sem extensão; `/api`, seus descendentes, diretórios de assets/ícones, arquivos ausentes e mutações conservam erro JSON/404. HEAD de arquivo existente não envia corpo. HTML, assets, manifesto e worker preservam tipos MIME/UTF-8 e `no-store`; a política conservadora evita servir builds antigos. O worker mantém apenas a página pública offline em seu próprio cache, como antes.

`PUBLIC_ORIGIN` alimenta `baseURL`, `trustedOrigins` e a validação própria de Origin nas mutações. Cadastro público permanece fechado. Cookies são HttpOnly, SameSite=Lax e Secure para origem HTTPS; a sessão dura oito horas, com política de atualização existente. Não foi ampliado CORS nem compartilhado cookie entre domínios. A aplicação escuta HTTP atrás do terminador TLS da hospedagem; exigir origem HTTPS não cria certificado nem configura TLS no Fastify.

## Proxy confiável e limite de login — implementado em 31/10/2026

`TRUSTED_PROXY_MODE=socket` usa o endereço do socket e ignora `X-Real-IP`, `X-Forwarded-For`, `Forwarded` e qualquer cabeçalho interno enviado pelo cliente. É o padrão seguro do desenvolvimento e de conexões diretas.

`TRUSTED_PROXY_MODE=railway-edge` usa **somente um IP válido em X-Real-IP**, que o edge HTTP do Railway deve sobrescrever. IP ausente, inválido, duplicado ou separado por vírgulas gera 400 nas rotas que usam autenticação; não há fallback silencioso para um bucket compartilhado. Healthcheck e estáticos não exigem esse cabeçalho. `X-Forwarded-For` nunca é usado, não se presume quantidade fixa de saltos e não se inventam CIDRs estáveis para o edge. O Fastify mantém `trustProxy:false`, portanto `req.ip` continua sendo o socket; a resolução para autenticação é explícita e separada.

Esse modo **não autentica o proxy por um cabeçalho**. Sua fronteira de confiança é a topologia: aplicação acessível externamente apenas pelo edge HTTP do Railway; não criar TCP Proxy para a aplicação nem permitir chamadores privados não confiáveis. Um processo com acesso direto ao listener privado pode forjar X-Real-IP e fica fora do contrato. A configuração não torna esse acesso seguro. Se a topologia mudar, manter modo socket até estabelecer outra fronteira confiável; não usar `trustProxy:true` nem confiar em uma faixa privada ampla. Não há autorização por IP.

Antes de entregar os headers ao Better Auth, o servidor remove os cabeçalhos públicos de IP e qualquer `x-minimercado-client-ip` recebido, depois escreve esse último com o endereço resolvido. O Better Auth está configurado para ler exclusivamente esse header interno, inclusive nas chamadas internas de sessão e troca de senha. A versão instalada 1.7.14 foi inspecionada: o limiter usa IP normalizado + caminho; IPv4 mapeado é normalizado e IPv6 agrupa por /64. Chamadas diretas `auth.api` não passam pelo limiter HTTP; por isso os testes de tentativas usam `/api/auth/sign-in/email`.

O login tem regra **explícita de 5 tentativas por 60 segundos**, contando falhas e sucessos; as demais rotas Better Auth mantêm 30/60 s por caminho, respeitando regras especiais da biblioteca. Excesso retorna 429 com `X-Retry-After`. Armazenamento explicitamente em memória: **uma réplica, um processo Node; sem autoscaling, cluster ou múltiplos workers**. Reinício/deploy perde contadores; durante sobreposição de deploys eles também não são compartilhados. Persistência distribuída é melhoria futura obrigatória antes de ampliar instâncias, não capacidade já implementada. IP não identifica uma pessoa; clientes atrás do mesmo NAT ou /64 compartilham o limite.

Referências oficiais consultadas em 31/10: [headers do Railway](https://docs.railway.com/networking/public-networking/specs-and-limits), [limites/IP do Better Auth](https://better-auth.com/docs/concepts/rate-limit) e [trustProxy do Fastify](https://fastify.dev/docs/latest/Reference/Server/#trustproxy). As especificações do Railway identificam X-Real-IP como endereço remoto do cliente. A sobrescrita efetiva e ausência de rotas alternativas precisam ser confirmadas no ambiente criado; o teste local utiliza um edge controlado que reproduz esse contrato.

## TLS PostgreSQL — implementado em 31/10/2026

O código monta os campos da conexão explicitamente; a URL não é mais repassada ao parser do pg com opções capazes de substituir o objeto SSL ou o host. Parâmetros não permitidos impedem a conexão, sem imprimir seus valores. `verify-full` usa TLS 1.2+, `rejectUnauthorized:true`, CA confiável e verificação Node do hostname exato de DATABASE_URL (ou IP, se for IP). Não há opção para ignorar hostname, aceitar certificado inválido, fazer fallback remoto para texto puro ou desligar verificação. A exceção `disable-local` é restrita ao loopback e não funciona com destino remoto.

CA pode vir de `DATABASE_CA_FILE` **ou** `DATABASE_CA_PEM`, com validação de formato X.509 antes de conectar. Sem CA adicional, vale a confiança do sistema. No Railway, preferir PEM injetado, disponível tanto no pre-deploy quanto na aplicação; arquivos em volume não ficam disponíveis automaticamente no pre-deploy.

O [script oficial da imagem PostgreSQL Railway](https://github.com/railwayapp-templates/postgres-ssl/blob/main/init-ssl.sh) gera CA própria e certificado com localhost e, quando fornecido no momento da geração, `RAILWAY_PRIVATE_DOMAIN` no SAN. Isso **não prova** o certificado da instância que será criada. Obter a CA pública do banco por canal administrativo autenticado (o script usa `/var/lib/postgresql/data/certs/root.crt`), sem exportar chaves privadas, e injetá-la na aplicação. Conferir SAN, validade e a versão da imagem; se o hostname privado não estiver coberto, corrigir o certificado do banco, sem desativar a verificação no cliente. Renovação/rotação da CA exige atualizar a confiança da aplicação de forma coordenada.

Referências: [TLS no node-postgres](https://node-postgres.com/features/ssl) e o script oficial acima. Apenas adicionar `sslmode=require` à URL não resolve confiança nem divergência de hostname; neste projeto ele mantém a verificação completa.

## Evidência local de 31/10/2026

- `npm run test:security`: **15 testes direcionados, 0 falhas, 0 ignorados**, usando `minimercado_security_20261031154854_811dbc`, criado e preservado. A suíte anterior completa de 62 testes não foi reexecutada; esse resultado de 30/10 permanece histórico.
- Testes HTTP por `app.inject` usam o handler e limiter reais do Better Auth: sexta tentativa 429, clientes distintos com buckets separados, IP de sessão persistido corretamente, cabeçalhos forjados ignorados no modo socket e sobrescritos pelo edge controlado, IP inválido/duplicado recusado, concorrência de oito tentativas com somente cinco admitidas, IPv4 mapeado e IPv6 /64 sem bypass. Não foi comprovada a sobrescrita do Railway real.
- Testes com `pg.Client` e handshake TLS real em loopback, usando uma fixture que responde à negociação SSLRequest PostgreSQL: CA em arquivo/PEM aceita; CA ausente/incorreta, hostname divergente, certificado expirado e servidor sem TLS recusados. A fixture não é um servidor PostgreSQL completo; o banco local das rotas de login usa loopback sem TLS. Nenhuma dessas evidências equivale a conectar ao banco real Railway.
- `npm run build` aprovado, incluindo checagem dos tipos dos testes e artefato compilado. Não houve inspeção de UI, teste de hardware, publicação ou criação de serviços.
- Ensaios anteriores desta execução preservados: `minimercado_security_20261031154601_135904`, `minimercado_security_20261031154640_90c883` e `minimercado_security_20261031154720_15126e`. Foram corrigidos o ambiente do harness (CA vazia) e a seleção da sessão de teste; o primeiro build apontou uma tipagem da fixture, corrigida antes do build final. Nenhum banco principal/restaurado ou backup foi alterado.
- Certificados/chaves **fictícios** gerados pelo teste ficam em `.local/tls-fixtures-*`, ignorado pelo Git; nunca são usados no banco/aplicação real e não foram impressos. Testes TLS exigem OpenSSL: PATH no Linux ou instalação Git for Windows padrão; `TEST_OPENSSL_BIN` permite apontar outro executável existente. `node scripts/test-security.mjs proxy` e `node scripts/test-security.mjs tls` permitem repetir somente a parte pertinente, sempre criando outro banco local separado. Requer permissão CREATEDB.

## Evidência local de 30/10/2026 (histórico anterior)

- `npm run build` aprovado (frontend, checagem de tipos e backend); após a correção de HEAD e diagnóstico de startup, somente `npm run build:server` foi refeito.
- **62 testes, 0 falhas, 0 ignorados**, incluindo o conjunto anterior e os novos testes de configuração, estáticos, migração explícita, bootstrap único, troca inicial, CSRF, sessão/logout e cookies via injeção. As suítes usam schemas temporários exclusivamente dentro do banco separado; removem somente seus próprios schemas ao terminar.
- `npm run verify:online` criou bancos separados com prefixo `minimercado_online_`, preservados. O banco principal, restaurações e backups não foram migrados nem usados para operações destrutivas. A conexão local existente foi usada internamente apenas para criar bancos novos; valores não foram impressos.
- O primeiro ensaio encontrou PostgreSQL desligado e Docker sem permissão. Depois de o usuário iniciar o Docker, migração em banco vazio/existente, recusa do bootstrap repetido e recusa de startup sem configuração/schema foram aprovadas.
- O ensaio de reinício inicialmente falhou porque `taskkill` não tinha permissão. O harness passou a enviar um pedido por stdin a um preload exclusivo de teste, que emite SIGTERM dentro do processo compilado e exercita o handler normal. Não há endpoint de shutdown na aplicação; o preload não faz parte do `npm start` normal. Encerramento cooperativo, reinício com o mesmo banco/secret e preservação da sessão foram aprovados. Sinal POSIX entregue pelo sistema operacional em Linux ainda não foi validado.
- `npm start` com `NODE_ENV=production` passou em loopback: HTML/JS/CSS, manifesto/worker, recarga de `/painel/estoque`, 404 sem HTML, health/API, senha errada, login, troca obrigatória, acesso autenticado, rejeição de origem externa, sessão após reinício e logout. Origem HTTPS foi **simulada** e cookies foram enviados manualmente pelo cliente de teste sobre HTTP local; isso comprova comportamento/headers do servidor, não aceitação dos cookies pelo navegador em HTTPS real.
- A abertura visual automatizada foi tentada, mas o host de acesso ao navegador estava indisponível. Não houve nova validação visual, teste TLS real, proxy hospedado ou instalação PWA em aparelho. A aprovação visual anterior do usuário continua registrada separadamente.

Para repetir a verificação completa quando necessário, com PostgreSQL local disponível e build atualizado:

```powershell
npm run verify:online
```

O script cria e preserva outro banco, executa a suíte e o smoke de `npm start`. Requer permissão CREATEDB. Não apaga bancos nem backups; o nome gerado é informado, sem credenciais. `--skip-tests` permite retomar somente o smoke após uma suíte já aprovada; `--serve` mantém uma prévia local anônima para inspeção. No PowerShell gerenciado, o encaminhamento desses argumentos pelo wrapper `npm.ps1` não funcionou; no ensaio foi usado diretamente o `npm-cli.js` da instalação local. Sem opções, o comando acima não depende desse encaminhamento. A validação completa precisa ser refeita após mudanças pertinentes; não tomar os resultados históricos como validação de um deploy.

Bancos preservados nesta sessão: `minimercado_online_20261030202410_1dd45f`, `minimercado_online_20261030202542_4f82ee` e `minimercado_online_20261030202657_101cd7`. Os dois primeiros são ensaios interrompidos durante o controle de processos; o terceiro concluiu o smoke. Nenhuma limpeza foi automatizada.

## Autorização e verificações após criar o ambiente

1. Apresentar projeto/serviços, banco exclusivo, endereço, responsáveis e custos para autorização; nenhum serviço foi criado nesta etapa.
2. Configurar HTTPS com certificado válido no domínio escolhido e verificar no navegador login/logout, sessão após reload/reinício, CSRF e cookies Secure/HttpOnly/SameSite. Depois testar instalação, offline e atualização PWA em aparelho.
3. Configurar `DATABASE_TLS_MODE=verify-full` e a CA do PostgreSQL privado, obtida por canal administrativo confiável. Conferir SAN/hostname e validade reais. Depois de conectar com verificação completa, consultar `SELECT ssl, version FROM pg_stat_ssl WHERE pid = pg_backend_pid();` na mesma conexão e exigir SSL ativo. Exercitar reconexão com CA incorreta em uma instância de verificação isolada; deve falhar. Não desativar certificados nem abrir o banco publicamente para contornar erro.
4. Definir execução explícita das migrações antes de liberar tráfego e healthcheck `/api/health`; testar falha de migração e encerramento pelo provedor. O [pre-deploy do Railway](https://docs.railway.com/deployments/pre-deploy-command) acessa rede/variáveis, mas não fornece persistência de arquivos entre processos.
5. Configurar `TRUSTED_PROXY_MODE=railway-edge`, somente na topologia de ingresso exclusivo descrita acima, e fixar uma réplica/processo. Confirmar no domínio HTTPS que variar X-Forwarded-For, X-Real-IP, Forwarded e o header interno enviados pelo cliente não contorna 429; outro cliente/IP deve conservar seu bucket. Conferir sobrescrita pelo edge, IP normalizado da sessão, recuperação após a janela e ausência de TCP Proxy/chamadores privados não confiáveis. Essa verificação real é condição de liberar o acesso aos testadores; não precisa de endpoint público de diagnóstico. Persistência dos contadores fica para antes de ampliar instâncias.
6. Definir backups online, retenção, acesso restrito, cópia externa e restauração em banco separado. [Backups de volume Railway](https://docs.railway.com/volumes/backups) não substituem a configuração e o teste do procedimento do projeto. Cópia externa do backup local continua sem confirmação.
7. Usar somente dados fictícios no ambiente de testes. Pagamentos, fiscal, CPF e equipamentos continuam fora desta entrega; a interface mantém os rótulos locais existentes por decisão de escopo, portanto não apresentá-la como operação de produção.

A avaliação de 29/10 identificou falta de artefato/start, estáticos, configuração por ambiente e bootstrap separado, implementados em 30/10. Em 31/10, proxy e TLS receberam configuração e testes direcionados; as verificações reais acima continuam abertas. São condições de provisionamento/aceite, não evidência de um deploy concluído. Referências da proposta anterior: [Fastify no Railway](https://docs.railway.com/guides/fastify) e [PostgreSQL no Railway](https://docs.railway.com/databases/postgresql). Nenhuma compatibilidade hospedada foi comprovada nesta sessão.
