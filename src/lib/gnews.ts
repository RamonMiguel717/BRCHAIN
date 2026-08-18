import type { GNewsArticle, GNewsResponse } from "./types";

const GNEWS_BASE = "https://gnews.io/api/v4";

/**
 * Categorias/temas de saúde usados na ingestão. Cada tema vira uma query
 * de keywords no endpoint de busca da GNews (P-03: filtro por keywords).
 * Mantemos poucas queries para respeitar o limite de 100 req/dia do plano
 * gratuito (a ingestão roda 1x/dia — ver vercel.json).
 */
// Atenção à sintaxe de busca da GNews: o hífen `-` é operador de exclusão.
// Frases com hífen/múltiplas palavras vão entre aspas para busca exata.
export const HEALTH_TOPICS: { slug: string; label: string; query: string }[] = [
  { slug: "saude", label: "Saúde", query: "saúde" },
  { slug: "bem-estar", label: "Bem-estar", query: '"bem estar"' },
  { slug: "alimentacao", label: "Alimentação", query: '"alimentação saudável"' },
  { slug: "exercicios", label: "Exercícios", query: '"exercícios físicos"' },
  { slug: "tecnologia", label: "Tecnologia", query: '"saúde digital"' },
];

/** Artigo normalizado, pronto para inserção na tabela `news` (status=pending). */
export interface NormalizedArticle {
  external_id: string;
  title: string;
  source: string | null;
  url: string;
  image_url: string | null;
  published_at: string | null;
  summary: string | null;
  category: string;
  status: "pending";
}

/**
 * Busca notícias de saúde em pt-BR na GNews para uma query de keywords.
 * A chave de API vive apenas no servidor (proxy) — nunca no cliente.
 */
export async function fetchHealthNews(query: string): Promise<GNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) throw new Error("GNEWS_API_KEY não configurada");

  const params = new URLSearchParams({
    q: query,
    lang: "pt", // P-04: pt-BR nesta primeira versão
    country: "br",
    max: "10", // teto do plano gratuito
    apikey: apiKey,
  });

  const res = await fetch(`${GNEWS_BASE}/search?${params.toString()}`, {
    // Não cachear no fetch — o cache real é a persistência no Supabase.
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`GNews respondeu ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as GNewsResponse;
  return data.articles ?? [];
}

/**
 * Normaliza um artigo da GNews para o formato da tabela `news`.
 * @param category rótulo do tema que originou a busca (ex.: "Alimentação").
 */
export function normalizeArticle(
  article: GNewsArticle,
  category: string
): NormalizedArticle | null {
  // Sem URL não há como deduplicar nem redirecionar — descartamos.
  if (!article.url || !article.title) return null;

  return {
    // A URL é estável e única por notícia — serve de external_id (dedupe).
    external_id: article.url,
    title: article.title.trim(),
    source: article.source?.name?.trim() || null,
    url: article.url,
    image_url: article.image || null,
    published_at: article.publishedAt || null,
    summary: (article.description || article.content || "").trim() || null,
    category,
    status: "pending",
  };
}
