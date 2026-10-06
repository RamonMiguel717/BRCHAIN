import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { execute, isDbConfigured } from "@/lib/db";
import { HEALTH_TOPICS, fetchHealthNews, normalizeArticle, type NormalizedArticle } from "@/lib/gnews";

// Sempre dinâmica — nunca deve ser pré-renderizada/cacheada.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Ingestão automática das notícias (cron 1x/dia — vercel.json).
 * Busca a GNews por tema, normaliza e insere em `news` como `pending`.
 * Deduplicação por `external_id` (UNIQUE) via INSERT IGNORE.
 *
 * Proteção: exige header Authorization: Bearer <CRON_SECRET>.
 * A Vercel injeta esse header automaticamente nas execuções de cron.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }
  }

  if (!process.env.GNEWS_API_KEY || !isDbConfigured()) {
    return NextResponse.json(
      { error: "Ingestão não configurada (GNEWS_API_KEY / conexão MySQL)." },
      { status: 500 }
    );
  }

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

    try {
      const result = await execute(
        `INSERT IGNORE INTO news
           (id, external_id, title, source, url, image_url, published_at, summary, category, status)
         VALUES ?`,
        [values]
      );
      inserted = result.affectedRows;
    } catch (e) {
      return NextResponse.json(
        { error: `Falha ao inserir: ${(e as Error).message}`, fetched: rows.length, errors },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    fetched: rows.length,
    inserted, // novos (duplicatas são ignoradas)
    topics: HEALTH_TOPICS.length,
    errors,
  });
}
