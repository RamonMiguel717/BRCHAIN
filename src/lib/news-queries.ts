import { createClient } from "@/lib/supabase/server";
import type { News, PublicNewsItem } from "@/lib/types";

function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

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
  /** true quando a consulta falhou (ex.: API/Supabase indisponível) — dispara estado de erro na UI. */
  error: boolean;
}

/**
 * Retorna notícias APROVADAS (a RLS garante que só `approved` é lido por anônimos).
 * @param query  filtro simples por palavra-chave (título/resumo)
 * @param limit  máximo de itens
 */
export async function getApprovedNews({
  query,
  category,
  limit = 30,
}: { query?: string; category?: string; limit?: number } = {}): Promise<ApprovedNewsResult> {
  // Sem Supabase configurado ainda: retorna vazio (a UI mostra "sem notícias").
  if (!isSupabaseConfigured()) return { items: [], error: false };

  try {
    const supabase = await createClient();
    let q = supabase
      .from("news")
      .select("*")
      .eq("status", "approved")
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (category && category.trim()) {
      q = q.eq("category", category.trim());
    }

    if (query && query.trim()) {
      const term = `%${query.trim()}%`;
      q = q.or(`title.ilike.${term},summary.ilike.${term},summary_edited.ilike.${term}`);
    }

    const { data, error } = await q;
    if (error) return { items: [], error: true };

    return { items: (data as News[]).map(toPublic), error: false };
  } catch {
    return { items: [], error: true };
  }
}
