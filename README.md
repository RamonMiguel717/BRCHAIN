# BRChain

Landing Page institucional (B2B), **BRChain News** (B2C/investidores) e **Painel de Curadoria/Moderação** interno.
Stack: **Next.js (App Router) + TypeScript + CSS Modules + MySQL + Vercel + API GNews**.

## Arquitetura

```
GNews ─(Vercel Cron 1x/dia → /api/ingest)→ normaliza/dedupe → MySQL.news (pending)
                                                                     │
                       /admin (auth própria: cookie assinado) — HUMANA│
                              ├─ Aprovar (+editar resumo) → approved + audit_log(approved)
                              └─ Rejeitar → archived + audit_log(rejected)
                                                                     │
       Autorização na aplicação: anônimo lê só `approved` ←─────────┘
                                                                     │
                     /news (BRChain News) e / (carrossel na Landing) ┘
```

Não há backend dedicado: a camada de API são **API Routes** do Next.js; a
persistência é **MySQL** (via [`mysql2`](https://github.com/sidorares/node-mysql2))
e a autenticação do painel é própria (senha bcrypt na tabela `moderators` +
cookie de sessão assinado por HMAC). Como o MySQL não tem RLS, a autorização
(anônimo lê só `approved`) é feita na aplicação.

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing Page + seção de notícias aprovadas |
| `/news` | BRChain News (busca por palavra-chave, estados de loading/erro/vazio) |
| `/admin` | Painel de Curadoria (autenticado — sessão própria) |
| `/api/news` | Leitura de notícias aprovadas (`?q=` busca) |
| `/api/ingest` | Ingestão GNews (cron; protegida por `CRON_SECRET`) |
| `/api/contact` | Formulário "Fale com um Especialista" (Resend) |

## Setup local

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar variáveis** — copie `.env.example` para `.env.local` e preencha (veja abaixo).

3. **Criar o schema no MySQL** — com a conexão já no `.env.local`, rode (não precisa do cliente `mysql`):
   ```bash
   npm run db:schema
   ```
   Ele cria `moderators`, `news`, `audit_log`, a constraint de dedupe (`external_id`) e as chaves estrangeiras.
   (Alternativa com o cliente `mysql`: `mysql -h HOST -u USUARIO -p BANCO < db/schema.sql`.)

4. **Criar o moderador** — não há tela de cadastro no produto:
   ```bash
   npm run db:moderator -- email@dominio.com "SenhaForte" "Nome"
   ```
   (Rodar o mesmo comando de novo atualiza a senha.)

5. **(Opcional) Notícias de teste** sem a GNews: `npm run db:seed`.

6. **Rodar**
   ```bash
   npm run dev
   ```
   App em http://localhost:3000 — o painel de curadoria fica em `/admin`, com o botão **"Buscar novas notícias"** para importar da GNews sob demanda.

> O app funciona mesmo sem as variáveis preenchidas: as notícias aparecem vazias e o `/admin` mostra um aviso de configuração — nada quebra.

## Rodar com Docker

Sobe a stack completa (app Next.js + MySQL) em containers — sem instalar Node/MySQL localmente. Requer **Docker Desktop** (ou Docker Engine + Compose v2).

1. **Configurar variáveis** — copie `.env.docker.example` para `.env` (na raiz) e ajuste. No mínimo gere o `AUTH_SECRET`:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   (Sem Node à mão, use qualquer string aleatória longa.)

2. **Subir**
   ```bash
   docker compose up --build
   ```
   - App em http://localhost:3000 · MySQL exposto em `localhost:3306`.
   - O `db/schema.sql` é aplicado automaticamente no **primeiro** boot do banco (volume vazio), criando `moderators`, `news` e `audit_log`.

3. **Criar o moderador** (em outro terminal, com a stack no ar):
   ```bash
   docker compose exec app node scripts/create-moderator.mjs admin@brchain.com.br "SuaSenha" "Admin"
   ```

4. **(Opcional) Notícias de teste** sem a GNews:
   ```bash
   docker compose exec app node scripts/seed-news.mjs
   ```

Comandos úteis:
- Parar: `docker compose down` · Apagar também o banco: `docker compose down -v`.
- Logs da app: `docker compose logs -f app`.

> A imagem usa o build **standalone** do Next (`output: "standalone"` em `next.config.mjs`) para um container enxuto. O `.dockerignore` mantém `node_modules`, `.next` e segredos (`.env*`) fora da imagem.

## Variáveis de ambiente

| Variável | Onde obter | Escopo |
|---|---|---|
| `DATABASE_URL` | conexão MySQL (`mysql://user:senha@host:3306/brchain`) — alternativa às `MYSQL_*` | **servidor** |
| `MYSQL_HOST` / `MYSQL_PORT` / `MYSQL_USER` / `MYSQL_PASSWORD` / `MYSQL_DATABASE` | credenciais do MySQL (se não usar `DATABASE_URL`) | **servidor** |
| `MYSQL_SSL` | `true` em provedores que exigem TLS | servidor |
| `AUTH_SECRET` | gere aleatório (`openssl rand -hex 32`) — assina o cookie de sessão | **servidor** |
| `COOKIE_SECURE` | opcional: `true`/`false` força a flag Secure do cookie (padrão: ligada em produção; o Docker local usa `false`) | servidor |
| `GNEWS_API_KEY` | gnews.io (plano gratuito) | servidor |
| `CRON_SECRET` | gere aleatório (`openssl rand -hex 32`) | servidor |
| `RESEND_API_KEY` | resend.com → API Keys | servidor |
| `CONTACT_FROM_EMAIL` | remetente verificado no Resend | servidor |
| `CONTACT_TO_EMAIL` | `contato@brchain.com.br` | servidor |
| `NEXT_PUBLIC_SITE_URL` | URL pública do site | público |

## Ingestão de notícias (GNews)

- Executada automaticamente pela Vercel **1x/dia** (plano Hobby) — ver [`vercel.json`](vercel.json).
- Para testar manualmente em produção:
  ```bash
  curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/ingest
  ```
- Em dev (sem `CRON_SECRET` setado, a proteção fica desativada): `curl http://localhost:3000/api/ingest`
- Limite do plano gratuito: **100 requisições/dia**. A ingestão faz ~5 requisições/dia (uma por tema em `src/lib/gnews.ts`). Notícias ficam com `status = pending` até a curadoria.

## Deploy (Vercel)

1. Provisione um **MySQL acessível pela internet** (ex.: Railway com proxy TCP público) e aplique o schema (`npm run db:schema` com a `DATABASE_URL` dele no `.env.local`).
2. Importe o repositório na Vercel (framework Next.js detectado automaticamente).
3. Configure as variáveis de ambiente no projeto Vercel — no mínimo `DATABASE_URL` e `AUTH_SECRET`, além de `GNEWS_API_KEY`, `CRON_SECRET` e as do Resend.
4. Crie o moderador apontando para o banco de produção: `npm run db:moderator -- email "senha" "Nome"`.
5. O cron de `/api/ingest` é registrado a partir de `vercel.json`.
6. Domínio `brchain.com.br` → Landing; `/news` e `/admin` são subcaminhos.
