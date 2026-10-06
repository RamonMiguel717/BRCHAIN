import { randomUUID } from "node:crypto";
import { execute } from "@/lib/db";
import {
  HEALTH_TOPICS,
  fetchHealthNews,
  normalizeArticle,
  type NormalizedArticle,
} from "@/lib/gnews";

export interface IngestResult {
  ok: boolean;
  /** notícias únicas coletadas da GNews neste ciclo */
  fetched: number;
  /** novas de fato gravadas (duplicatas são ignoradas pela UNIQUE em external_id) */
  inserted: number;
  topics: number;
  /** erros por tema (não-fatais) */
  errors: string[];
}

/**
 * Executa a ingestão da GNews: busca por tema, normaliza/dedupe e grava em
 * `news` como `pending`. Lança em caso de falha de escrita no banco.
 *
 * Reutilizado tanto pela rota /api/ingest (cron) quanto pela ação sob demanda
 * do painel de curadoria.
 */
export async function runIngestion(): Promise<IngestResult> {
  const collected = new Map<string, NormalizedArticle>();
  const errors: string[] = [];
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < HEALTH_TOPICS.length; i++) {
    const topic = HEALTH_TOPICS[i];
    // Espaça as chamadas: o plano gratuito da GNews limita requisições por
    // segundo (429). Um intervalo curto entre temas evita o bloqueio.
    if (i > 0) await sleep(1200);
    try {
      const articles = await fetchHealthNews(topic.query);
      for (const a of articles) {
        const n = normalizeArticle(a, topic.label);
        // Deduplica também dentro do mesmo lote (mesma URL em temas diferentes;
        // o primeiro tema que trouxe a notícia define a categoria).
        if (n && !collected.has(n.external_id)) collected.set(n.external_id, n);
      }
    } catch (e) {
      errors.push(`${topic.slug}: ${(e as Error).message}`);
    }
  }

  const rows = [...collected.values()];
  let inserted = 0;

  if (rows.length > 0) {
    // Bulk insert com `VALUES ?` (mysql2 expande a matriz de tuplas).
    // INSERT IGNORE descarta duplicatas pela UNIQUE KEY em external_id.
    const values = rows.map((r) => [
      randomUUID(),
      r.external_id,
      r.title,
      r.source,
      r.url,
      r.image_url,
      // ISO string → Date (o pool usa timezone "Z" para gravar em UTC).
      r.published_at ? new Date(r.published_at) : null,
      r.summary,
      r.category,
      r.status,
    ]);

    const result = await execute(
      `INSERT IGNORE INTO news
         (id, external_id, title, source, url, image_url, published_at, summary, category, status)
       VALUES ?`,
      [values]
    );
    inserted = result.affectedRows;
  }

  return {
    ok: true,
    fetched: rows.length,
    inserted,
    topics: HEALTH_TOPICS.length,
    errors,
  };
}
