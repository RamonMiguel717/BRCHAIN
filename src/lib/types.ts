// ============================================================
// Tipos de domínio do BRChain
// Schema alinhado à Documentação Técnica v1.5 (seção 3.3)
// ============================================================

export type NewsStatus = "pending" | "approved" | "archived";

/** Registro da tabela `news` no MySQL. */
export interface News {
  id: string;
  external_id: string;
  title: string;
  source: string | null;
  url: string;
  image_url: string | null;
  published_at: string | null;
  summary: string | null;
  /** Resumo editado pelo moderador (tem precedência sobre `summary` na exibição). */
  summary_edited: string | null;
  /** Tema de saúde definido na ingestão (ex.: "Alimentação"). */
  category: string | null;
  status: NewsStatus;
  created_at: string;
  updated_at: string;
}

export type AuditAction = "approved" | "rejected";

/** Registro imutável da tabela `audit_log`. Nunca é atualizado ou apagado. */
export interface AuditLog {
  id: string;
  news_id: string;
  moderator_id: string;
  action: AuditAction;
  /** Snapshot (jsonb) do que foi editado/decidido no momento da ação. */
  snapshot: Record<string, unknown>;
  created_at: string;
}

/** Formato "público" de uma notícia consumido pela Landing e pela BRChain News. */
export interface PublicNewsItem {
  id: string;
  title: string;
  source: string | null;
  url: string;
  image_url: string | null;
  published_at: string | null;
  summary: string | null;
  category: string | null;
}

/** Item bruto retornado pela API GNews. */
export interface GNewsArticle {
  title: string;
  description: string | null;
  content: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: { name: string; url: string };
}

export interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}
