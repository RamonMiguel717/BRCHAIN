import { NextResponse } from "next/server";
import { isDbConfigured } from "@/lib/db";
import { runIngestion } from "@/lib/ingest";

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
 *
 * O painel de curadoria dispara a mesma lógica sob demanda (server action
 * `ingestNews`), reutilizando runIngestion de @/lib/ingest.
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

  try {
    const result = await runIngestion();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: `Falha ao inserir: ${(e as Error).message}` },
      { status: 500 }
    );
  }
}
