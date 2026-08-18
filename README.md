# BRChain

Landing Page institucional (B2B), **BRChain News** (B2C/investidores) e **Painel de Curadoria/Moderação** interno.
Stack conforme a Documentação Técnica v1.5: **Next.js (App Router) + TypeScript + CSS Modules + Supabase + Vercel + API GNews**.

## Arquitetura

```
GNews ─(Vercel Cron 1x/dia → /api/ingest)→ normaliza/dedupe → Supabase.news (pending)
                                                                     │
                              /admin (Supabase Auth) — DECISÃO HUMANA │
                              ├─ Aprovar (+editar resumo) → approved + audit_log(approved)
                              └─ Rejeitar → archived + audit_log(rejected)
                                                                     │
              RLS: anônimo lê só `approved`  ←──────────────────────┘
                                                                     │
                     /news (BRChain News) e / (carrossel na Landing) ┘
```

Não há backend dedicado: a camada de API são **API Routes** do Next.js; a persistência/auth é o **Supabase** (BaaS).

## Rotas

| Rota | Descrição |
|---|---|
| `/` | Landing Page + seção de notícias aprovadas |
| `/news` | BRChain News (busca por palavra-chave, estados de loading/erro/vazio) |
| `/admin` | Painel de Curadoria (autenticado via Supabase) |
| `/api/news` | Leitura de notícias aprovadas (`?q=` busca) |
| `/api/ingest` | Ingestão GNews (cron; protegida por `CRON_SECRET`) |
| `/api/contact` | Formulário "Fale com um Especialista" (Resend) |

## Setup local

1. **Instalar dependências**
   ```bash
   npm install
   ```

2. **Configurar variáveis** — copie `.env.example` para `.env.local` e preencha (veja abaixo).

3. **Criar o schema no Supabase** — no SQL Editor do Supabase, rode o conteúdo de [`supabase/schema.sql`](supabase/schema.sql). Ele cria `news`, `audit_log`, a constraint de dedupe (`external_id`) e as políticas de RLS.

4. **Criar o moderador** — no painel Supabase: Authentication → Users → *Add user* (ou *Invite*). Não há tela de cadastro no produto.

5. **Rodar**
   ```bash
   npm run dev
   ```
   App em http://localhost:3000

> O app funciona mesmo sem as chaves preenchidas: as notícias aparecem vazias e o `/admin` mostra um aviso de configuração — nada quebra.

## Variáveis de ambiente

| Variável | Onde obter | Escopo |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | público |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API | público |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API | **servidor** (cron) |
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

1. Importe o repositório na Vercel (framework Next.js detectado automaticamente).
2. Configure todas as variáveis de ambiente no projeto Vercel.
3. O cron de `/api/ingest` é registrado a partir de `vercel.json`.
4. Domínio `brchain.com.br` → Landing; `/news` e `/admin` são subcaminhos.
