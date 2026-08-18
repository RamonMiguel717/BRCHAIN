"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { News } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
  /** Aviso não-bloqueante (ex.: resumo original recuperado). */
  warning?: string;
}

/** Um resumo é válido para publicação se contiver ao menos uma letra (texto). */
function hasText(value: string): boolean {
  return /\p{L}/u.test(value);
}

/** Garante que há um moderador autenticado; retorna o id do usuário. */
async function requireModerator() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");
  return { supabase, userId: user.id };
}

/**
 * Aprova uma notícia (com edição opcional do resumo). Funciona a partir de
 * qualquer status — também serve para RE-aprovar uma arquivada (correção) ou
 * salvar a edição do resumo de uma já aprovada.
 * status → approved e grava audit_log(action=approved). Decisão HUMANA.
 */
export async function approveNews(
  newsId: string,
  editedSummary: string | null,
  category?: string | null
): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireModerator();

    const raw = editedSummary?.trim() ?? "";
    const clearing = raw === "";

    // Validação: resumo não pode conter apenas números/símbolos (deve ter texto).
    if (!clearing && !hasText(raw)) {
      return {
        ok: false,
        error: "O resumo precisa conter texto, não apenas números.",
      };
    }

    // Resumo vazio → recupera o original (summary_edited = null faz o público
    // exibir o `summary` da fonte). O aviso é calculado após o update.
    const summaryEdited = clearing ? null : raw;

    const update: {
      status: "approved";
      summary_edited: string | null;
      category?: string | null;
    } = { status: "approved", summary_edited: summaryEdited };
    // Só altera a categoria quando o moderador informou uma.
    if (category !== undefined) update.category = category?.trim() || null;

    const { data, error } = await supabase
      .from("news")
      .update(update)
      .eq("id", newsId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Notícia não encontrada." };
    }

    const news = data as News;

    // Aviso de recuperação do resumo original quando o campo foi enviado vazio.
    let warning: string | undefined;
    if (clearing) {
      warning =
        news.summary && news.summary.trim()
          ? "O resumo estava vazio — o resumo original da fonte foi recuperado."
          : "Publicada sem resumo: a fonte não forneceu um resumo original.";
    }
    const { error: auditError } = await supabase.from("audit_log").insert({
      news_id: newsId,
      moderator_id: userId,
      action: "approved",
      snapshot: {
        title: news.title,
        original_summary: news.summary,
        edited_summary: summaryEdited,
        was_edited: summaryEdited !== null && summaryEdited !== news.summary,
        recovered_original: clearing && Boolean(news.summary && news.summary.trim()),
        category: news.category,
      },
    });
    if (auditError) return { ok: false, error: auditError.message };

    revalidatePath("/admin");
    return { ok: true, warning };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * Rejeita/arquiva uma notícia. Funciona a partir de qualquer status — também
 * serve para reverter uma notícia já aprovada (correção).
 * status → archived (fica no banco, fora da listagem pública) e grava
 * audit_log(action=rejected). Decisão HUMANA.
 */
export async function rejectNews(newsId: string): Promise<ActionResult> {
  try {
    const { supabase, userId } = await requireModerator();

    const { data, error } = await supabase
      .from("news")
      .update({ status: "archived" })
      .eq("id", newsId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, error: error?.message ?? "Notícia não encontrada." };
    }

    const news = data as News;
    const { error: auditError } = await supabase.from("audit_log").insert({
      news_id: newsId,
      moderator_id: userId,
      action: "rejected",
      snapshot: { title: news.title, source: news.source, url: news.url },
    });
    if (auditError) return { ok: false, error: auditError.message };

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Encerra a sessão do moderador. */
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/admin");
}
