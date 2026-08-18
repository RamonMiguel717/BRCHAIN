import { NextResponse } from "next/server";
import { getApprovedNews } from "@/lib/news-queries";

/**
 * Camada de acesso aos dados (API Route do Next.js).
 * Retorna notícias aprovadas; aceita ?q= para busca por palavra-chave (P-03).
 * A RLS do Supabase garante que apenas notícias `approved` são retornadas.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  const { items, error } = await getApprovedNews({ query: q, category, limit: 60 });

  if (error) {
    return NextResponse.json({ items: [], error: true }, { status: 502 });
  }
  return NextResponse.json({ items, error: false });
}
