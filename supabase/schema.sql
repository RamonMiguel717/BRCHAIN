-- ============================================================
-- BRChain — Schema Supabase (Documentação Técnica v1.5, seção 3.3)
-- Execute no SQL Editor do Supabase.
-- ============================================================

-- ---- Tabela: news --------------------------------------------------
create table if not exists public.news (
  id             uuid primary key default gen_random_uuid(),
  external_id    text not null unique,          -- evita duplicata (dedupe)
  title          text not null,
  source         text,
  url            text not null,
  image_url      text,
  published_at   timestamptz,
  summary        text,
  summary_edited text,                           -- resumo editado pelo moderador
  category       text,                           -- tema de saúde (definido na ingestão)
  status         text not null default 'pending'
                 check (status in ('pending', 'approved', 'archived')),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists news_status_idx      on public.news (status);
create index if not exists news_published_at_idx on public.news (published_at desc);
create index if not exists news_category_idx     on public.news (category);

-- Migração (se a tabela já existia sem a coluna category):
alter table public.news add column if not exists category text;

-- ---- Tabela: audit_log (imutável) ----------------------------------
create table if not exists public.audit_log (
  id           uuid primary key default gen_random_uuid(),
  news_id      uuid not null references public.news (id) on delete cascade,
  moderator_id uuid not null references auth.users (id),
  action       text not null check (action in ('approved', 'rejected')),
  snapshot     jsonb not null default '{}'::jsonb,  -- o que foi editado/decidido
  created_at   timestamptz not null default now()
);

create index if not exists audit_log_news_id_idx on public.audit_log (news_id);

-- ---- Trigger: manter updated_at em news ----------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_set_updated_at on public.news;
create trigger news_set_updated_at
  before update on public.news
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================
alter table public.news      enable row level security;
alter table public.audit_log enable row level security;

-- news: visitante anônimo lê SOMENTE notícias aprovadas ...............
drop policy if exists "public reads approved news" on public.news;
create policy "public reads approved news"
  on public.news for select
  using (status = 'approved');

-- news: moderador autenticado lê tudo (pending/approved/archived) .....
drop policy if exists "moderator reads all news" on public.news;
create policy "moderator reads all news"
  on public.news for select
  to authenticated
  using (true);

-- news: apenas moderador autenticado altera status/resumo .............
drop policy if exists "moderator updates news" on public.news;
create policy "moderator updates news"
  on public.news for update
  to authenticated
  using (true)
  with check (true);

-- audit_log: apenas moderador autenticado insere (registro imutável) ..
-- Sem policy de update/delete → ninguém atualiza ou apaga via API.
drop policy if exists "moderator inserts audit" on public.audit_log;
create policy "moderator inserts audit"
  on public.audit_log for insert
  to authenticated
  with check (moderator_id = auth.uid());

drop policy if exists "moderator reads audit" on public.audit_log;
create policy "moderator reads audit"
  on public.audit_log for select
  to authenticated
  using (true);

-- Observações:
-- • A INSERÇÃO de novas notícias (ingestão GNews) usa a SERVICE ROLE KEY,
--   que bypassa a RLS — por isso não há policy de insert público em `news`.
-- • O moderador é criado por CONVITE direto no painel do Supabase
--   (Authentication → Users), sem tela de cadastro no produto.
