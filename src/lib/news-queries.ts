import { isDbConfigured, query } from "@/lib/db";
import type { News, PublicNewsItem } from "@/lib/types";

/** Mapeia um registro `news` para o formato público (resumo editado tem precedência). */
function toPublic(n: News): PublicNewsItem {
  return {
    id: n.id,
    title: n.title,
    source: n.source,
    url: n.url,
    image_url: n.image_url,
    published_at: n.published_at,
    summary: n.summary_edited ?? n.summary,
    category: n.category,
  };
}

export interface ApprovedNewsResult {
  items: PublicNewsItem[];
  /** true quando a consulta falhou (ex.: banco indisponível) — dispara estado de erro na UI. */
  error: boolean;
}

/**
 * Retorna notícias APROVADAS. A autorização (somente `approved` para o
 * público) é feita aqui na aplicação — o MySQL não tem RLS.
 * @param query    filtro simples por palavra-chave (título/resumo)
 * @param category filtro por tema de saúde
 * @param limit    máximo de itens
 */
export async function getApprovedNews({
  query: term,
  category,
  limit = 30,
}: { query?: string; category?: string; limit?: number } = {}): Promise<ApprovedNewsResult> {
  // Sem banco configurado ainda: retorna vazio (a UI mostra "sem notícias").
  if (!isDbConfigured()) return { items: [], error: false };

  try {
    const where: string[] = ["status = 'approved'"];
    const params: unknown[] = [];

    if (category && category.trim()) {
      where.push("category = ?");
      params.push(category.trim());
    }

    if (term && term.trim()) {
      // LIKE é case-insensitive na collation padrão (utf8mb4_unicode_ci).
      const like = `%${term.trim()}%`;
      where.push("(title LIKE ? OR summary LIKE ? OR summary_edited LIKE ?)");
      params.push(like, like, like);
    }

    // LIMIT é inlined como inteiro sanitizado (prepared statements do MySQL
    // não aceitam placeholder em LIMIT de forma portável).
    const safeLimit = Math.max(1, Math.min(200, Math.floor(limit)));

    const rows = await query<News>(
      `SELECT * FROM news
        WHERE ${where.join(" AND ")}
        ORDER BY published_at IS NULL, published_at DESC
        LIMIT ${safeLimit}`,
      params
    );

    return { items: rows.map(toPublic), error: false };
  } catch {
    return { items: [], error: true };
  }
}
