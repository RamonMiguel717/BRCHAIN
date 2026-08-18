-- ============================================================
-- Migração: adiciona a coluna `category` em news (P-07)
-- Rode UMA VEZ no SQL Editor do Supabase.
-- ============================================================

-- 1) Coluna + índice
alter table public.news add column if not exists category text;
create index if not exists news_category_idx on public.news (category);

-- 2) Backfill das notícias já existentes (que entraram antes da coluna).
--    Heurística por palavras-chave no título/resumo — só afeta linhas sem
--    categoria. Novas ingestões já definem a categoria pelo tema da GNews.
update public.news
set category = case
  when lower(coalesce(title,'') || ' ' || coalesce(summary,'')) ~ '(exerc|treino|físic|corrida|muscul|academia)'
    then 'Exercícios'
  when lower(coalesce(title,'') || ' ' || coalesce(summary,'')) ~ '(aliment|dieta|nutri|comida|café da manh|receita)'
    then 'Alimentação'
  when lower(coalesce(title,'') || ' ' || coalesce(summary,'')) ~ '(tecnolog|digital|aplicativo|intelig|software|dados)'
    then 'Tecnologia'
  when lower(coalesce(title,'') || ' ' || coalesce(summary,'')) ~ '(bem-estar|mental|sono|estresse|ansied|qualidade de vida)'
    then 'Bem-estar'
  else 'Saúde'
end
where category is null;
