# BRChain

Plataforma web composta por três partes:

- **Landing Page institucional (B2B)** — apresenta a BRCHAIN para hospitais, clínicas e decisores, com formulário "Fale com um Especialista".
- **BRChain News (B2C)** — central pública de notícias de saúde, com busca e filtro por tema.
- **Painel de Curadoria/Moderação (interno)** — área restrita onde moderadores revisam as notícias importadas automaticamente antes de publicá-las.

O conteúdo da BRChain News vem da API **GNews**, mas **nada é publicado sem decisão humana**: toda notícia entra como *pendente*, é revisada no painel e cada aprovação/rejeição fica registrada em um log de auditoria imutável.

> 📄 A especificação original está em [`BRChain_Documentacao_Tecnica.pdf`](BRChain_Documentacao_Tecnica.pdf) (v1.5). A implementação atual **substituiu o Supabase por MySQL** — ver [Diferenças em relação à Documentação Técnica](#12-diferenças-em-relação-à-documentação-técnica-v15).

---

## Sumário

1. [Visão geral do fluxo](#1-visão-geral-do-fluxo)
2. [Stack tecnológica](#2-stack-tecnológica)
3. [Arquitetura](#3-arquitetura)
4. [Funcionalidades](#4-funcionalidades)
5. [Modelo de dados](#5-modelo-de-dados)
6. [Segurança e controle de acesso](#6-segurança-e-controle-de-acesso)
7. [Pré-requisitos](#7-pré-requisitos)
8. [Configuração: variáveis de ambiente e serviços externos](#8-configuração-variáveis-de-ambiente-e-serviços-externos)
9. [Como executar](#9-como-executar)
10. [Roteiro de validação ponta a ponta](#10-roteiro-de-validação-ponta-a-ponta)
11. [Critérios de aceite (Documentação v1.5, seção 8)](#11-critérios-de-aceite-documentação-v15-seção-8)
12. [Diferenças em relação à Documentação Técnica v1.5](#12-diferenças-em-relação-à-documentação-técnica-v15)
13. [Rotas e API](#13-rotas-e-api)
14. [Scripts utilitários](#14-scripts-utilitários)
15. [Estrutura de pastas](#15-estrutura-de-pastas)
16. [Deploy em produção](#16-deploy-em-produção)
17. [Solução de problemas](#17-solução-de-problemas)
18. [Limitações conhecidas e próximos passos](#18-limitações-conhecidas-e-próximos-passos)

---

## 1. Visão geral do fluxo

```
 API GNews
     │   1. INGESTÃO — cron diário ou botão "Buscar novas notícias"
     ▼
 news  [status = pending]
     │   2. CURADORIA — moderador revisa em /admin (pode editar resumo e categoria)
     ├── Aprovar  ──▶ [approved] ──▶ 3. PUBLICAÇÃO em /news e na Landing
     └── Rejeitar ──▶ [archived] ──▶ permanece no banco, fora da área pública

     Toda decisão grava uma linha em audit_log (quem, o quê, quando).
```

1. **Ingestão:** a aplicação busca notícias de saúde em português na GNews (5 temas), descarta duplicatas e grava cada uma com `status = pending`. Roda automaticamente 1x/dia (cron) ou sob demanda pelo botão **"Buscar novas notícias"** do painel.
2. **Curadoria:** o moderador autenticado revisa cada notícia, pode editar o resumo e a categoria, e decide **aprovar** (`approved`) ou **rejeitar** (`archived`). Toda decisão gera uma linha em `audit_log`.
3. **Publicação:** apenas notícias `approved` aparecem na BRChain News e na seção de notícias da Landing. Rejeitadas continuam no banco (arquivadas), fora da listagem pública.

---

## 2. Stack tecnológica

| Camada | Tecnologia | Observações |
|---|---|---|
| Framework | **Next.js 15** (App Router) + **React 19** | SSR/ISR para SEO; API Routes e Server Actions como backend |
| Linguagem | **TypeScript** (modo `strict`) | |
| Estilização | **CSS Modules** | tokens de marca em `src/app/globals.css` |
| Banco de dados | **MySQL 8+** | driver [`mysql2`](https://github.com/sidorares/node-mysql2) |
| Autenticação | Própria | senha com hash **bcrypt** + cookie de sessão assinado (HMAC-SHA256) |
| Fonte de notícias | **API GNews** (plano gratuito) | 100 requisições/dia |
| E-mail (contato) | **Resend** | envio do formulário "Fale com um Especialista" |
| Carrosséis | `embla-carousel-react` | |
| Hospedagem | **Vercel** (com cron) ou **Docker** | ver [Deploy](#16-deploy-em-produção) |

---

## 3. Arquitetura

Não há um servidor de backend separado: o próprio Next.js serve as páginas e expõe a camada de API.

```
 Visitante ──▶ /  e  /news ─────────────────┐
               (busca: GET /api/news)       │  src/lib/news-queries.ts
                                            │  (somente status = 'approved')
                                            ▼
 Moderador ──▶ /admin ──▶ Server Actions ──────────────▶  MySQL
  (cookie)                (signIn, approveNews,           ├─ moderators
                           rejectNews, ingestNews,        ├─ news
                           signOut)                       └─ audit_log
                               │                              ▲
                               ▼                              │
 Vercel Cron ──▶ GET /api/ingest ──▶ src/lib/ingest.ts ───────┘
                                          │
                                          ▼
                                      API GNews

 Formulário de contato ──▶ POST /api/contact ──▶ Resend (e-mail)
```

**Pontos-chave**

- **Server Components** buscam os dados direto no servidor (nenhuma credencial vai para o navegador).
- **Server Actions** executam as operações do painel; cada uma verifica a sessão do moderador antes de agir.
- **Cache:** `/` e `/news` são pré-renderizadas e revalidadas a cada 5 minutos (ISR). Ao aprovar/rejeitar, o cache dessas páginas é invalidado na hora, então a mudança aparece imediatamente.
- **Conexão com o banco:** um pool de conexões único (`src/lib/db.ts`), configurado por `DATABASE_URL` ou pelas variáveis `MYSQL_*`.

---

## 4. Funcionalidades

### 4.1 Landing Page — `/`

- Seções: Hero, Governança, Pesquisa e DaaS, Soluções Corporativas, **BRChain News** e chamada final para contato.
- Menu por âncoras (com menu hambúrguer no mobile).
- Botão **"Fale com um Especialista"** (vendas) abre um formulário em modal que envia e-mail via Resend.
- A seção **BRChain News** mostra até 10 notícias aprovadas em carrossel e o botão **"Acesse a BRChain News →"**, que abre `/news`.

### 4.2 BRChain News — `/news`

- Lista de notícias **aprovadas** em cards (imagem, categoria, título, resumo, fonte e data). O card abre a notícia original em nova aba.
- **Busca por palavra-chave** no título e no resumo (executa automaticamente enquanto o usuário digita).
- **Filtro por categoria**: os botões mostram os temas presentes nas notícias aprovadas (entre Saúde, Bem-estar, Alimentação, Exercícios e Tecnologia).
- Estados tratados: **carregando** (skeleton), **erro** (com "Tentar novamente") e **vazio**.
- O logo "BRchain News" no topo retorna à Landing.

### 4.3 Painel de Curadoria — `/admin`

- Acesso **somente com login** (e-mail + senha do moderador). Não existe tela de cadastro: moderadores são criados por script (ver [Scripts](#14-scripts-utilitários)).
- Abas **Pendentes**, **Aprovadas** e **Rejeitadas**, com contadores.
- Para cada notícia: editar **resumo** e **categoria**, e:
  - Pendente → **Aprovar** ou **Rejeitar**
  - Aprovada → **Salvar edição** (correção) ou **Rejeitar**
  - Rejeitada → **Aprovar** (reverter decisão)
- Regras de validação: o resumo editado precisa conter texto (não apenas números/símbolos). Se for salvo vazio, o resumo original da fonte é restaurado, com aviso.
- **Auditoria:** toda aprovação, edição ou rejeição grava em `audit_log` quem decidiu, quando e um *snapshot* do conteúdo (resumo original × editado, categoria etc.).
- Botão **"↻ Buscar novas notícias"**: dispara a ingestão da GNews na hora e atualiza as listas.

### 4.4 Ingestão de notícias (GNews)

- Busca 5 temas de saúde (`src/lib/gnews.ts`), em português do Brasil, até 10 notícias por tema.
- **Deduplicação** pela URL da notícia (`external_id` único): rodar várias vezes não duplica registros. Uma notícia que aparece em dois temas fica com a categoria do primeiro.
- Chamadas espaçadas em ~1,2 s para respeitar o limite de requisições do plano gratuito.
- Disparos: **cron diário** às 09:00 UTC (06:00 de Brasília), definido em [`vercel.json`](vercel.json), ou o botão do painel.

### 4.5 Formulário de contato

- Campos: nome, e-mail, celular, instituição e mensagem — todos obrigatórios, com validação de formato do e-mail e limite de tamanho no servidor.
- Enviado para `CONTACT_TO_EMAIL` via Resend; o "responder para" é o e-mail do visitante.

---

## 5. Modelo de dados

Definido em [`db/schema.sql`](db/schema.sql) (MySQL 8+, `utf8mb4`).

**`moderators`** — usuários do painel

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) PK | UUID |
| `email` | VARCHAR(255) UNIQUE | login |
| `password_hash` | VARCHAR(255) | hash bcrypt (a senha nunca é armazenada) |
| `name` | VARCHAR(255) | opcional |
| `created_at` | DATETIME | |

**`news`** — notícias importadas

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) PK | UUID |
| `external_id` | VARCHAR(512) UNIQUE | URL da notícia — chave de deduplicação |
| `title`, `source`, `url`, `image_url` | | dados da fonte |
| `published_at` | DATETIME | data de publicação na fonte |
| `summary` | TEXT | resumo original da fonte |
| `summary_edited` | TEXT | resumo editado pelo moderador (tem precedência na exibição) |
| `category` | VARCHAR(120) | tema de saúde |
| `status` | ENUM | `pending` · `approved` · `archived` |
| `created_at`, `updated_at` | DATETIME | `updated_at` atualizado automaticamente |

**`audit_log`** — registro imutável das decisões

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | CHAR(36) PK | UUID |
| `news_id` | FK → `news.id` | notícia afetada |
| `moderator_id` | FK → `moderators.id` | quem decidiu |
| `action` | ENUM | `approved` · `rejected` |
| `snapshot` | JSON | o que foi decidido/editado no momento |
| `created_at` | DATETIME | quando |

**Ciclo de vida de uma notícia** — cada transição grava uma linha em `audit_log`:

| Status atual | Ação no painel | Novo status |
|---|---|---|
| `pending` | Aprovar | `approved` |
| `pending` | Rejeitar | `archived` |
| `approved` | Salvar edição | `approved` |
| `approved` | Rejeitar | `archived` |
| `archived` | Aprovar | `approved` |

Notícias nunca são apagadas pela aplicação.

---

## 6. Segurança e controle de acesso

| Aspecto | Como funciona |
|---|---|
| **Credenciais** | Tabela `moderators` no MySQL, senha com hash **bcrypt**. |
| **Sessão** | Cookie `brchain_session` (`httpOnly`, `SameSite=Lax`, `Secure` em produção) com token assinado por HMAC-SHA256 usando `AUTH_SECRET`. Validade de 7 dias. Token adulterado é rejeitado. |
| **Autorização** | Como o MySQL não tem RLS (*Row Level Security*), as regras ficam na aplicação: o público só recebe notícias `approved` (`src/lib/news-queries.ts`) e toda Server Action do painel exige sessão válida (`requireModerator`). |
| **Login** | Mensagem genérica para e-mail ou senha errados, com tempo de resposta equivalente nos dois casos (evita descobrir quais e-mails existem). |
| **Cron** | `/api/ingest` exige o header `Authorization: Bearer <CRON_SECRET>` quando `CRON_SECRET` está definido. |
| **Entrada de dados** | SQL sempre parametrizado; formulário de contato valida tipo, tamanho e formato, e o HTML do e-mail é escapado. |
| **Segredos** | Ficam só em variáveis de ambiente no servidor. `.env`, `.env.local` e similares estão no `.gitignore`; nenhuma chave é exposta ao navegador (a única variável pública é `NEXT_PUBLIC_SITE_URL`). |

> ⚠️ O `AUTH_SECRET` é crítico: quem o conhece consegue forjar sessões. Use um valor aleatório longo e diferente em cada ambiente.

---

## 7. Pré-requisitos

**Para rodar com Docker (caminho mais simples):**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (ou Docker Engine + Compose v2).

**Para rodar localmente sem Docker:**
- **Node.js 20 LTS** ou superior (mínimo 18.18) e **npm**.
- Um **MySQL 8+** acessível: instalado na máquina, em container, ou em nuvem (ex.: Railway).

**Contas externas (opcionais — o sistema funciona sem elas, com as funções correspondentes desativadas):**
- **GNews** — para importar notícias reais. Sem ela, use `npm run db:seed` para inserir notícias de teste.
- **Resend** — para o formulário de contato enviar e-mails.

---

## 8. Configuração: variáveis de ambiente e serviços externos

O projeto lê as variáveis de:
- **`.env.local`** ao rodar com Node (`npm run dev`) — modelo em [`.env.example`](.env.example);
- **`.env`** ao rodar com Docker Compose — modelo em [`.env.docker.example`](.env.docker.example).

### 8.1 Referência completa

| Variável | Obrigatória? | Para que serve |
|---|---|---|
| `DATABASE_URL` | Sim\* | Conexão MySQL em uma URL: `mysql://usuario:senha@host:3306/banco` |
| `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` | Sim\* | Alternativa à `DATABASE_URL`, em variáveis separadas |
| `MYSQL_SSL` | Não | `true` para provedores que exigem TLS |
| `AUTH_SECRET` | **Sim** | Assina o cookie de sessão do painel |
| `COOKIE_SECURE` | Não | Força a flag `Secure` do cookie (`true`/`false`). Padrão: ligada em produção. Use `false` só para servir produção via HTTP (o Docker local já usa `false`) |
| `GNEWS_API_KEY` | Não | Importação de notícias (cron e botão do painel) |
| `CRON_SECRET` | Recomendada em produção | Protege `/api/ingest` contra chamadas públicas |
| `RESEND_API_KEY` | Não | Envio do formulário de contato |
| `CONTACT_FROM_EMAIL` | Com Resend | Remetente (de domínio verificado no Resend) |
| `CONTACT_TO_EMAIL` | Com Resend | Quem recebe os contatos (padrão `contato@brchain.com.br`) |
| `NEXT_PUBLIC_SITE_URL` | Não | URL pública, usada em metadados/SEO (padrão `http://localhost:3000` em dev) |

\* Informe **`DATABASE_URL`** *ou* o conjunto **`MYSQL_*`**. Se ambos existirem, `DATABASE_URL` tem prioridade.

> Sem banco e `AUTH_SECRET` configurados, o site continua funcionando: as listas de notícias aparecem vazias e o `/admin` exibe um aviso de configuração.

### 8.2 Como obter cada valor

**`AUTH_SECRET` e `CRON_SECRET`** — gere valores aleatórios (um diferente para cada):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**MySQL** — qualquer uma das opções:
- **Docker Compose:** já sobe um MySQL junto com a aplicação (nada a configurar além do `.env`).
- **Local:** instale o MySQL Community Server, crie um banco (`CREATE DATABASE brchain CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`) e preencha as `MYSQL_*`.
- **Railway:** crie um projeto com o template **MySQL**, ative o acesso público (*Public Networking / TCP Proxy*) e monte a URL com os dados da aba *Variables*:
  `DATABASE_URL=mysql://root:<MYSQLPASSWORD>@<host-do-proxy>:<porta-do-proxy>/railway`

**GNews** (`GNEWS_API_KEY`):
1. Crie uma conta gratuita em [gnews.io](https://gnews.io).
2. Copie a *API Key* exibida no dashboard.
3. Limite do plano gratuito: 100 requisições/dia — cada ingestão usa 5.

**Resend** (`RESEND_API_KEY`, `CONTACT_FROM_EMAIL`, `CONTACT_TO_EMAIL`):
1. Crie uma conta em [resend.com](https://resend.com) e gere uma chave em **API Keys**.
2. Para enviar de um endereço próprio (ex.: `no-reply@brchain.com.br`), verifique o domínio em **Domains**.
3. Para apenas testar, sem domínio, use `CONTACT_FROM_EMAIL="BRChain <onboarding@resend.dev>"` — nesse modo o Resend só entrega para o e-mail da própria conta, então use esse e-mail em `CONTACT_TO_EMAIL`.

---

## 9. Como executar

### Opção A — Docker (recomendada para avaliação)

Sobe aplicação + MySQL com um comando; o banco já é criado com as tabelas.

1. Crie o arquivo de variáveis a partir do modelo e defina ao menos o `AUTH_SECRET`:
   ```bash
   cp .env.docker.example .env          # PowerShell: Copy-Item .env.docker.example .env
   ```
2. Suba a stack:
   ```bash
   docker compose up --build
   ```
   - Aplicação: http://localhost:3000 · MySQL: `localhost:3306`
   - O `db/schema.sql` é aplicado automaticamente no **primeiro** boot (volume vazio).
3. Em outro terminal, crie o moderador:
   ```bash
   docker compose exec app node scripts/create-moderator.mjs admin@brchain.com.br "SenhaForte123" "Admin"
   ```
4. (Opcional, sem GNews) Insira notícias de teste:
   ```bash
   docker compose exec app node scripts/seed-news.mjs
   ```

Comandos úteis: `docker compose down` (parar) · `docker compose down -v` (parar e **apagar o banco**) · `docker compose logs -f app` (logs).

> A imagem usa o build *standalone* do Next.js (`next.config.mjs`) e roda com usuário sem privilégios. O `.dockerignore` mantém `node_modules`, `.next` e arquivos `.env*` fora da imagem.

### Opção B — Local com Node.js + MySQL

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie o `.env.local` a partir do modelo e preencha a conexão com o MySQL e o `AUTH_SECRET`:
   ```bash
   cp .env.example .env.local           # PowerShell: Copy-Item .env.example .env.local
   ```
3. Crie as tabelas (não precisa do cliente `mysql` instalado):
   ```bash
   npm run db:schema
   ```
4. Crie o moderador (repetir o comando com o mesmo e-mail **troca a senha**):
   ```bash
   npm run db:moderator -- admin@brchain.com.br "SenhaForte123" "Admin"
   ```
5. (Opcional) Notícias de teste: `npm run db:seed`
6. Inicie em modo desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse http://localhost:3000 (Landing), http://localhost:3000/news e http://localhost:3000/admin.

Para testar o build de produção localmente: `npm run build` e depois `npm start`.

### Opção C — Banco na nuvem (Railway) + aplicação local

Siga a **Opção B**, usando no `.env.local` a `DATABASE_URL` pública do Railway (ver [8.2](#82-como-obter-cada-valor)). Os comandos `db:schema`, `db:moderator` e `db:seed` funcionam igual, apontando para o banco remoto.

---

## 10. Roteiro de validação ponta a ponta

Checklist para conferir o sistema completo após subir o projeto (qualquer opção da seção 9):

| # | Passo | Resultado esperado |
|---|---|---|
| 1 | Abrir `http://localhost:3000` | Landing carrega; menu leva às seções; seção BRChain News mostra aviso de "sem notícias" (banco vazio) |
| 2 | Clicar em **"Fale com um Especialista"** | Abre o formulário em modal. Com Resend configurado, o envio mostra "Mensagem enviada!"; sem Resend, mostra "Serviço de e-mail não configurado" |
| 3 | Abrir `/admin` | Tela de login (rota protegida) |
| 4 | Entrar com o moderador criado | Painel com as abas Pendentes / Aprovadas / Rejeitadas |
| 5 | Clicar em **"Buscar novas notícias"** (requer `GNEWS_API_KEY`) — ou rodar o seed | Notícias aparecem em **Pendentes** com mensagem de quantas foram importadas |
| 6 | Editar o resumo/categoria de uma notícia e **Aprovar** | Ela vai para **Aprovadas**; aparece **imediatamente** em `/news` e na seção de notícias da Landing |
| 7 | Em `/news`, buscar uma palavra do título e filtrar por categoria | Lista filtrada; o card abre a notícia original em nova aba |
| 8 | **Rejeitar** uma notícia (pendente ou aprovada) | Vai para **Rejeitadas** e some de `/news`, mas continua no banco com `status = archived` |
| 9 | Conferir a auditoria no MySQL | Uma linha por decisão: `SELECT action, created_at, JSON_EXTRACT(snapshot,'$.title') FROM audit_log ORDER BY created_at DESC;` |
| 10 | Clicar em **Sair** e tentar abrir `/admin` | Volta para a tela de login |

---

## 11. Critérios de aceite (Documentação v1.5, seção 8)

| Critério | Status | Como é atendido |
|---|---|---|
| Landing publicada, responsiva, com os dois botões funcionais (vendas e BRChain News) | ✅ | "Fale com um Especialista" (modal de contato) e "Acesse a BRChain News" (seção `#news`) |
| BRChain News em `/news`, exibindo apenas notícias aprovadas | ✅ | Filtro `status = 'approved'` em `src/lib/news-queries.ts` (página e `/api/news`) |
| Navegação cruzada nos dois sentidos | ✅ | Landing → `/news` pelo botão da seção de notícias; `/news` → Landing pelo logo do cabeçalho |
| Painel em `/admin` acessível apenas mediante autenticação | ✅ | Autenticação própria sobre MySQL (substitui o Supabase — ver seção 12) |
| Aprovar, rejeitar e editar geram entrada em `audit_log` | ✅ | `approveNews` (aprovar e "Salvar edição") e `rejectNews` em `src/app/admin/actions.ts` |
| Rejeitada não aparece na News, mas permanece arquivada (`archived`) | ✅ | Rejeitar muda o status para `archived`; não há exclusão |
| Nenhum cadastro público de usuários | ✅ | Não há tela de cadastro; moderadores só via `scripts/create-moderator.mjs` |
| Design legível e navegável, validado por teste informal de usabilidade | ⚠️ | Implementado; o teste informal de usabilidade não está registrado neste repositório |
| Nenhuma chave de API exposta no repositório | ✅ | Segredos só em variáveis de ambiente; arquivos `.env*` no `.gitignore`; modelos sem valores reais |

---

## 12. Diferenças em relação à Documentação Técnica v1.5

A documentação v1.5 especificava o **Supabase** (PostgreSQL gerenciado + Supabase Auth + RLS). A implementação foi migrada para **MySQL**:

| Documentação v1.5 | Implementação atual | Motivo / efeito |
|---|---|---|
| Supabase (PostgreSQL) | **MySQL 8+** via `mysql2` | Banco relacional padrão, portável (local, nuvem ou Docker) |
| Supabase Auth | **Autenticação própria**: tabela `moderators` + bcrypt + cookie assinado | Mesmo comportamento: login só para moderadores, sem cadastro público |
| Moderador convidado pelo painel do Supabase | Criado com `npm run db:moderator` | Continua sem tela de cadastro no produto |
| RLS (Row Level Security) | **Autorização na aplicação** | Público só lê `approved`; ações do painel exigem sessão |
| Service Role Key na ingestão | Conexão direta ao MySQL no servidor | A ingestão roda só no servidor |

**Acréscimos em relação à documentação:**
- Botão **"Buscar novas notícias"** no painel (ingestão sob demanda, além do cron).
- Execução via **Docker Compose** (aplicação + banco).
- Scripts para criar o schema, o moderador e dados de teste.

---

## 13. Rotas e API

| Rota | Tipo | Descrição |
|---|---|---|
| `/` | Página | Landing Page (revalida a cada 5 min) |
| `/news` | Página | BRChain News (revalida a cada 5 min) |
| `/admin` | Página | Painel de Curadoria (dinâmica, exige login) |
| `GET /api/news?q=&category=` | API | Notícias aprovadas, com busca e filtro opcionais (até 60) |
| `GET /api/ingest` | API | Ingestão da GNews (cron; exige `Authorization: Bearer <CRON_SECRET>` quando definido) |
| `POST /api/contact` | API | Envio do formulário de contato (JSON: `name`, `email`, `phone`, `institution`, `message`) |

Testar a ingestão manualmente:
```bash
# desenvolvimento (sem CRON_SECRET definido, a rota fica liberada)
curl http://localhost:3000/api/ingest

# produção
curl -H "Authorization: Bearer $CRON_SECRET" https://SEU-DOMINIO/api/ingest
```

---

## 14. Scripts utilitários

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` / `npm start` | Build e execução de produção |
| `npm run db:schema` | Cria as tabelas a partir de `db/schema.sql` |
| `npm run db:moderator -- <email> "<senha>" ["Nome"]` | Cria um moderador, ou troca a senha de um existente |
| `npm run db:seed` | Insere 3 notícias de teste como pendentes e mostra a contagem por status |

Os scripts ficam em [`scripts/`](scripts) e usam a conexão do `.env.local`. No Docker, rode-os com `docker compose exec app node scripts/<arquivo>.mjs ...`.

---

## 15. Estrutura de pastas

```
├── db/schema.sql                 # schema MySQL (tabelas, índices, chaves estrangeiras)
├── scripts/                      # apply-schema, create-moderator, seed-news
├── public/images/                # imagens estáticas (logos, mockups)
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing Page
│   │   ├── layout.tsx            # layout raiz, fonte e metadados/SEO
│   │   ├── globals.css           # tokens de marca e estilos globais
│   │   ├── news/                 # BRChain News
│   │   ├── admin/                # painel: página, Server Actions e estilos
│   │   └── api/                  # news · ingest · contact
│   ├── components/               # Header, Footer, botões, carrosséis, contato, news, admin
│   └── lib/
│       ├── db.ts                 # pool de conexões MySQL
│       ├── auth.ts               # senha (bcrypt) e sessão (cookie assinado)
│       ├── news-queries.ts       # consultas públicas (somente aprovadas)
│       ├── ingest.ts             # ingestão GNews → banco
│       ├── gnews.ts              # cliente GNews e temas de saúde
│       ├── categories.ts         # categorias canônicas
│       └── format.ts · types.ts  # formatação de datas e tipos de domínio
├── Dockerfile · docker-compose.yml · .dockerignore
├── .env.example                  # modelo de variáveis (execução com Node)
├── .env.docker.example           # modelo de variáveis (Docker Compose)
├── next.config.mjs · vercel.json · tsconfig.json
└── BRChain_Documentacao_Tecnica.pdf
```

---

## 16. Deploy em produção

### Vercel + MySQL gerenciado

1. Provisione um **MySQL acessível pela internet** (ex.: Railway) e crie as tabelas: `npm run db:schema` com a `DATABASE_URL` desse banco no `.env.local`.
2. Crie o moderador de produção: `npm run db:moderator -- email "senha" "Nome"` (mesma `DATABASE_URL`).
3. Importe o repositório na Vercel (o framework Next.js é detectado automaticamente).
4. Em *Settings → Environment Variables*, configure no mínimo `DATABASE_URL` e `AUTH_SECRET`, além de `GNEWS_API_KEY`, `CRON_SECRET`, as variáveis do Resend e `NEXT_PUBLIC_SITE_URL`.
5. O cron diário de `/api/ingest` é registrado automaticamente a partir de [`vercel.json`](vercel.json); a Vercel envia o `CRON_SECRET` no header.
6. Domínio: `brchain.com.br` → Landing; `/news` e `/admin` são subcaminhos (não subdomínios), conforme a seção 2.3 da documentação.

### Docker em servidor próprio

Use o mesmo `docker-compose.yml`, com senhas fortes no `.env` e a aplicação atrás de um proxy HTTPS (ex.: Nginx, Caddy). Nesse caso, defina `COOKIE_SECURE=true`. Para a ingestão diária, agende uma chamada a `/api/ingest` com o header do `CRON_SECRET` (ex.: cron do sistema).

---

## 17. Solução de problemas

| Sintoma | Causa provável | Solução |
|---|---|---|
| `/admin` mostra "Banco de dados ainda não configurado" | Faltam as variáveis do banco ou o `AUTH_SECRET` | Preencha o `.env.local` (ou `.env` no Docker) e **reinicie** o servidor |
| `/admin` mostra "Não foi possível conectar ao banco de dados" | MySQL fora do ar, credenciais erradas ou provedor exige TLS | Verifique o banco e as variáveis; tente `MYSQL_SSL=true` |
| Login retorna "E-mail ou senha inválidos" com os dados certos | Moderador criado em **outro** banco | Confira para qual banco o `.env.local` aponta e rode `db:moderator` de novo |
| Login parece funcionar mas volta para a tela de login | Produção servida por HTTP com cookie `Secure` | Use HTTPS ou defina `COOKIE_SECURE=false` |
| Botão "Buscar novas notícias" mostra "GNEWS_API_KEY não configurada" | Chave ausente | Defina `GNEWS_API_KEY` e reinicie |
| Ingestão retorna avisos por tema | Limite do plano gratuito da GNews | Aguarde a renovação diária do limite |
| `/news` vazia | Nenhuma notícia aprovada | Importe/insira notícias e aprove no painel |
| Contato: "Serviço de e-mail não configurado" | Variáveis do Resend ausentes | Defina `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` e `CONTACT_TO_EMAIL` |
| Contato: "Não foi possível enviar" | Remetente de domínio não verificado | Verifique o domínio no Resend ou use o modo de teste (seção 8.2) |
| Docker: tabelas não existem | O schema só roda no **primeiro** boot do volume | `docker compose down -v` e `docker compose up --build` (apaga os dados) |
| Docker: porta 3306 ou 3000 em uso | Outro MySQL/serviço local na mesma porta | Pare o serviço local ou troque o mapeamento no `docker-compose.yml` (ex.: `"3307:3306"`) |
| Build falha ao baixar a fonte Inter | O build precisa de internet (Google Fonts) | Verifique a conexão e rode o build de novo |

---

## 18. Limitações conhecidas e próximos passos

- **Dependência do Next.js:** resta um alerta (`postcss` interno do Next) que só atua durante o build, sobre o CSS do próprio projeto. A correção definitiva exige migrar para o Next 16 (versão major).
- **Responsividade:** em telas estreitas, a barra de busca da BRChain News encosta nas bordas laterais.
- **Sem limite de tentativas** no login e no formulário de contato; recomendável adicionar *rate limiting* antes de produção.
- **Sessão sem revogação no servidor:** o logout remove o cookie, mas um token copiado continua válido até expirar (7 dias). Uma tabela de sessões permitiria revogação.
- **Imagens externas:** `next.config.mjs` aceita imagens de qualquer domínio HTTPS (as notícias vêm de fontes variadas); restringir os domínios reduziria o uso indevido do otimizador de imagens.
- **Qualidade:** não há ESLint configurado nem testes automatizados.
- **Conteúdo:** o botão explícito "← Voltar para BRChain" em `/news` e o botão "Ver BRChain News" no cabeçalho da Landing estão comentados no código; a navegação acontece pelo logo e pela seção de notícias. Há imagens não utilizadas em `public/images/`.
