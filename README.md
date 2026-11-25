# SIPAT Photo Drive

Plataforma web para compartilhar as fotografias dos eventos da SIPAT (Semana Interna de Prevenção de Acidentes do Trabalho).
O fluxo do participante é: **QR Code → site → câmera → foto → pré-visualização → envio → confirmação**, sem cadastro.
Os administradores gerenciam eventos, álbuns, QR Codes e fotos em um painel protegido por login.

## O que o sistema faz

| Área | Funcionalidades |
|---|---|
| **Participante** (sem login) | Lê o QR Code e cai na tela de envio do evento certo · abre a câmera traseira (API MediaDevices) com alternativa `input capture="environment"` · escolhe fotos da galeria do aparelho · pré-visualiza, refaz ou descarta · envia várias fotos com barra de progresso · mensagens de erro para permissão da câmera, conexão e arquivo inválido |
| **Galeria** (estilo Drive) | Grade ou lista · miniaturas · visualização ampliada com navegação · download · álbuns como pastas · ordenação (recentes, antigas, nome) · pesquisa por nome · contador de fotos · carregamento progressivo · compartilhar link do álbum |
| **Painel admin** | Login por e-mail e senha · dashboard (eventos, fotos, álbuns, armazenamento, últimos envios) · CRUD de eventos e álbuns · QR Code exclusivo por evento com download em PNG · gerar novo QR (invalida o anterior) · ativar/desativar recebimento · ver, baixar e excluir fotos (individual e em lote) · ZIP de um álbum · configurações de rodapé, aviso de privacidade e retenção |
| **Segurança e LGPD** | Veja a seção "Segurança" abaixo |

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide React
- **Backend:** Node.js 22 + Express + TypeScript (API REST)
- **Banco:** PostgreSQL (Supabase) com **Prisma 7** (cliente) e migrations em SQL versionado
- **Armazenamento:** Supabase Storage (bucket privado, URLs assinadas e temporárias)
- **Outras:** `qrcode` (QR Code), `archiver` (ZIP em streaming), `sharp` (validação e tratamento de imagem), `multer`, `zod`, `bcryptjs`, `jsonwebtoken`, `helmet`, `express-rate-limit`
- **Testes:** Vitest + Supertest contra um PostgreSQL real

**Arquitetura:** um único serviço Node serve a API (`/api/*`) e o frontend compilado. Isso simplifica o HTTPS, evita CORS e cabe em um único serviço na Render.

### Decisões que diferem da sugestão original

- **Migrations em SQL próprio** (`server/migrations/*.sql`, aplicadas automaticamente na partida) em vez de `prisma migrate`. O Prisma continua sendo o ORM das consultas.
- **Fotos reprocessadas no envio:** o servidor valida o conteúdo real do arquivo, corrige a orientação, limita a 2560 px e regrava como JPEG. Isso remove metadados EXIF (inclusive localização GPS), o que protege a privacidade dos participantes. Aceita JPG, PNG e WebP.
- **Tabela extra `settings`** para contatos do rodapé, aviso de privacidade e retenção (a especificação pedia que fossem editáveis).
- **Campo extra `events.is_listed`:** o evento aparece na galeria pública ou só para quem tem o QR Code/link.

## Estrutura de pastas

```
sipat-photo-drive/
├── docs
│   └── superpowers
│       └── plans
│           └── 2026-11-24-sipat-photo-drive.md
├── server
│   ├── migrations
│   │   └── 0001_init.sql
│   ├── prisma
│   │   └── schema.prisma
│   ├── src
│   │   ├── config
│   │   │   └── env.ts
│   │   ├── controllers
│   │   │   ├── albums.ts
│   │   │   ├── auth.ts
│   │   │   ├── dashboard.ts
│   │   │   ├── events.ts
│   │   │   ├── files.ts
│   │   │   ├── photos.ts
│   │   │   ├── public.ts
│   │   │   └── settings.ts
│   │   ├── lib
│   │   │   ├── db.ts
│   │   │   ├── errors.ts
│   │   │   ├── http.ts
│   │   │   └── prisma.ts
│   │   ├── middlewares
│   │   │   ├── auth.ts
│   │   │   ├── error.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── upload.ts
│   │   ├── routes
│   │   │   └── index.ts
│   │   ├── scripts
│   │   │   ├── migrate.ts
│   │   │   └── seed-admin.ts
│   │   ├── services
│   │   │   ├── admin.ts
│   │   │   ├── images.ts
│   │   │   ├── photos.ts
│   │   │   ├── qr.ts
│   │   │   ├── retention.ts
│   │   │   ├── settings.ts
│   │   │   └── zip.ts
│   │   ├── storage
│   │   │   ├── index.ts
│   │   │   ├── local.ts
│   │   │   ├── supabase.ts
│   │   │   └── types.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests
│   │   ├── flow.test.ts
│   │   └── pg-server.mjs
│   ├── .env.example
│   ├── package.json
│   ├── prisma.config.ts
│   ├── tsconfig.json
│   └── vitest.config.ts
├── web
│   ├── public
│   │   └── favicon.svg
│   ├── src
│   │   ├── components
│   │   │   ├── EventForm.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Lightbox.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── PhotoBrowser.tsx
│   │   │   ├── PublicLayout.tsx
│   │   │   ├── SettingsContext.tsx
│   │   │   └── Toast.tsx
│   │   ├── lib
│   │   │   ├── api.ts
│   │   │   ├── format.ts
│   │   │   └── types.ts
│   │   ├── pages
│   │   │   ├── admin
│   │   │   │   ├── AdminLayout.tsx
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── EventDetail.tsx
│   │   │   │   ├── Events.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   └── SettingsPage.tsx
│   │   │   ├── ChooseEvent.tsx
│   │   │   ├── EventGallery.tsx
│   │   │   ├── Gallery.tsx
│   │   │   ├── Home.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── Privacy.tsx
│   │   │   └── Upload.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .gitignore
├── docker-compose.yml
├── package.json
└── render.yaml
```

## Preparar o banco no Supabase

1. Use um banco dedicado ao SIPAT Photo Drive. Se o schema `public` já tiver a estrutura esperada do SIPAT, a aplicação registra a migration inicial sem apagar dados. Se houver tabelas de outra aplicação ou estrutura incompatível, a inicialização é recusada; não apague o schema compartilhado para contornar isso.
2. Em **Project Settings → Database → Connection string**, copie a string do **Session pooler** (porta 5432). Ela é o `DATABASE_URL`. Use o pooler porque a conexão direta do Supabase é só IPv6 e a Render usa IPv4.
3. Em **Project Settings → API Keys**, copie a **Project URL** (`SUPABASE_URL`) e a chave **service_role / secret** (`SUPABASE_SERVICE_ROLE_KEY`). Essa chave dá acesso total e **só pode ficar no servidor**.
4. Não é preciso criar tabelas nem o bucket. Na primeira partida o sistema aplica as migrations, cria o bucket privado `sipat-photos` e cria o administrador inicial.

## Variáveis de ambiente (`server/.env.example`)

Copie `server/.env.example` para `server/.env` e preencha:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão PostgreSQL (Supabase ou local) |
| `JWT_SECRET` | Segredo da sessão do admin. Gere com `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Administrador criado na primeira partida (se ainda não existir) |
| `STORAGE_DRIVER` | `supabase` (produção) ou `local` (só desenvolvimento) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET` | Armazenamento das fotos |
| `PUBLIC_URL` | Endereço público do site; é ele que vai dentro do QR Code. Se vazio, usa o endereço da requisição |
| `MAX_UPLOAD_MB`, `MAX_FILES_PER_REQUEST` | Limites de envio (padrão 15 MB e 10 fotos) |

## Executar localmente

Requisitos: Node 20.19+ (ou 22.12+/24+) e um PostgreSQL (use o Supabase ou o `docker-compose.yml`).

```bash
npm install
cp server/.env.example server/.env        # use PUBLIC_URL=http://localhost:5173 no desenvolvimento
# opção A: PostgreSQL local com Docker
docker compose up -d                       # use DATABASE_URL=postgresql://sipat:sipat@localhost:5433/sipat
# para fotos em disco no desenvolvimento: STORAGE_DRIVER=local

npm run dev:server    # API em http://localhost:3000 (aplica migrations e cria o admin)
npm run dev:web       # site em http://localhost:5173 (já faz proxy de /api)
```

A câmera do navegador só funciona em **HTTPS** ou em `localhost`. Para testar no celular em desenvolvimento, use um túnel HTTPS (por exemplo, `cloudflared tunnel --url http://localhost:5173`) ou publique na Render.

Para rodar a versão de produção localmente: `npm run build && npm start` (http://localhost:3000).

### Testes

```bash
npm test
```
Os 41 testes de integração usam um PostgreSQL real. Aponte `TEST_DATABASE_URL` para um banco **descartável** (o teste apaga o schema `public` dele) ou, em uma máquina Linux sem Postgres, suba um com `node server/tests/pg-server.mjs` (como usuário não-root).
Cobrem: migrations, login, rotas protegidas, criação de evento e QR Code PNG, upload (JPEG/PNG/WebP, arquivo falso, GIF, arquivo grande demais, excesso de arquivos, token inválido, evento desativado), URLs assinadas, galeria, pesquisa, download, ZIP, exclusão com remoção do arquivo, retenção e isolamento entre eventos.

## Publicar em produção (Render + Supabase)

1. Suba o projeto para um repositório no GitHub.
2. Na Render: **New → Blueprint** e aponte para o repositório (ele lê o `render.yaml`). Ou crie um **Web Service** manualmente:
   - Build: `npm ci --include=dev && npm run build`
   - Start: `npm run start`
   - Health check: `/api/health`
3. Preencha as variáveis marcadas no painel: `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `PUBLIC_URL` (o endereço final do site). O `JWT_SECRET` é gerado pela Render.
4. Faça o deploy. A Render fornece HTTPS automaticamente, o que libera a câmera nos celulares.
5. Entre em `https://SEU-SITE/admin`, crie o evento, baixe o QR Code em PNG e imprima.
6. **Defina `PUBLIC_URL` com o domínio definitivo antes de imprimir.** O QR Code carrega esse endereço; se o domínio mudar depois, será preciso reimprimir.
7. Em **Configurações**, preencha os contatos do rodapé e revise o aviso de privacidade e o prazo de retenção.

Dica para o dia do evento: o plano gratuito da Render hiberna após alguns minutos sem uso, e o primeiro acesso demora cerca de um minuto. Use um plano pago (como o `starter` do `render.yaml`) durante o evento.

## Segurança e LGPD

- Senhas com hash **bcrypt** (custo 12); login com limite de tentativas e resposta idêntica para e-mail inexistente ou senha errada.
- Sessão por **JWT em cookie `httpOnly`**, `SameSite=Lax` e `Secure` em produção. Rotas `/api/admin/*` exigem sessão, e mutações exigem o cabeçalho `X-Requested-With` (defesa contra CSRF).
- **Token do QR Code:** 24 bytes aleatórios (criptográficos), em base64url, 32 caracteres, não previsível. É possível gerar um novo token se o QR vazar.
- **Uploads:** o conteúdo é validado com `sharp` (não confia em extensão nem em `Content-Type`); só JPG, PNG e WebP; limite de tamanho e de quantidade; nome do arquivo higienizado; imagem regravada (neutraliza arquivos maliciosos); o token e o status do evento são verificados **antes** de receber os bytes.
- **Fotos em bucket privado**, entregues por URLs assinadas que expiram em 1 hora. Nenhuma foto é guardada em Base64 no banco, só metadados e caminho.
- **Limite de requisições** (API geral, login e upload), `helmet` com Content-Security-Policy, `Permissions-Policy` liberando só a câmera do próprio site.
- Credenciais só em variáveis de ambiente; `.env` está no `.gitignore`.
- **LGPD:** aviso de privacidade na tela de envio e em `/privacidade` (editável), remoção de EXIF/GPS, exclusão pelo administrador (foto, álbum ou evento, sempre com o arquivo) e **retenção automática** configurável (excluir fotos após N dias, verificação a cada hora).

## Pontos de atenção

- **Teste de envio após o deploy:** o driver do Supabase Storage foi escrito conforme a API oficial, mas não pôde ser exercitado de verdade durante o desenvolvimento (sem acesso às suas credenciais). Todo o restante foi testado com armazenamento em disco. Logo após publicar, envie uma foto de teste pelo QR Code e confirme que ela aparece na galeria e no painel.
- **Logotipo:** o sistema usa um símbolo provisório (escudo) com o texto "SIPAT". Para usar o logo oficial, troque o componente `web/src/components/Logo.tsx` e o `web/public/favicon.svg`.
- **Contatos do rodapé:** vazios por padrão e exibidos como "a definir" até você preencher em Configurações. Nenhum dado real foi inventado.
- **iPhone (HEIC):** o Safari converte para JPEG ao escolher fotos pelo navegador. Arquivos HEIC enviados diretamente não são aceitos (o servidor responde com mensagem clara).
- **Fontes:** o site carrega Bricolage Grotesque e Instrument Sans do Google Fonts; sem internet, usa a fonte do sistema.
- **Evento listado:** por padrão, os eventos aparecem em `/galeria`. Para um evento só acessível por QR Code, desmarque "Mostrar na galeria pública" ao criá-lo.
