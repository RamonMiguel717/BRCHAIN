"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { execute, isDbConfigured, query } from "@/lib/db";
import { runIngestion } from "@/lib/ingest";
import {
  clearSessionCookie,
  createSessionToken,
  getSession,
  isAuthConfigured,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";
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
async function requireModerator(): Promise<{ userId: string }> {
  const session = await getSession();
  if (!session) throw new Error("Não autenticado.");
  return { userId: session.sub };
}

/** Busca uma notícia por id (helper interno). */
async function findNews(newsId: string): Promise<News | null> {
  const rows = await query<News>("SELECT * FROM news WHERE id = ? LIMIT 1", [
    newsId,
  ]);
  return rows[0] ?? null;
}

/**
 * Autentica o moderador (login do painel). Valida e-mail/senha contra a
 * tabela `moderators` e grava o cookie de sessão assinado.
 */
export async function signIn(
  email: string,
  password: string
): Promise<ActionResult> {
  try {
    if (!isDbConfigured() || !isAuthConfigured()) {
      return { ok: false, error: "Autenticação não configurada." };
    }

    const rows = await query<{
      id: string;
      email: string;
      password_hash: string;
    }>("SELECT id, email, password_hash FROM moderators WHERE email = ? LIMIT 1", [
      email.trim().toLowerCase(),
    ]);

    const mod = rows[0];
    // Mesmo sem usuário, compara para reduzir enumeração por timing.
    const valid = mod ? await verifyPassword(password, mod.password_hash) : false;
    if (!mod || !valid) {
      return { ok: false, error: "E-mail ou senha inválidos." };
    }

    await setSessionCookie(createSessionToken(mod.id, mod.email));
    revalidatePath("/admin");
    return { ok: true };
  } catch {
    return { ok: false, error: "Falha ao autenticar. Tente novamente." };
  }
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
    const { userId } = await requireModerator();

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

    // Só altera a categoria quando o moderador informou uma.
    const setCategory = category !== undefined;
    const categoryValue = setCategory ? category?.trim() || null : null;

    const sets = ["status = 'approved'", "summary_edited = ?", "updated_at = NOW()"];
    const updateParams: unknown[] = [summaryEdited];
    if (setCategory) {
      sets.push("category = ?");
      updateParams.push(categoryValue);
    }
    updateParams.push(newsId);

    const result = await execute(
      `UPDATE news SET ${sets.join(", ")} WHERE id = ?`,
      updateParams
    );
    if (result.affectedRows === 0) {
      return { ok: false, error: "Notícia não encontrada." };
    }

    const news = await findNews(newsId);
    if (!news) return { ok: false, error: "Notícia não encontrada." };

    // Aviso de recuperação do resumo original quando o campo foi enviado vazio.
    let warning: string | undefined;
    if (clearing) {
      warning =
        news.summary && news.summary.trim()
          ? "O resumo estava vazio — o resumo original da fonte foi recuperado."
          : "Publicada sem resumo: a fonte não forneceu um resumo original.";
    }

    await execute(
      `INSERT INTO audit_log (id, news_id, moderator_id, action, snapshot)
       VALUES (?, ?, ?, 'approved', ?)`,
      [
        randomUUID(),
        newsId,
        userId,
        JSON.stringify({
          title: news.title,
          original_summary: news.summary,
          edited_summary: summaryEdited,
          was_edited: summaryEdited !== null && summaryEdited !== news.summary,
          recovered_original:
            clearing && Boolean(news.summary && news.summary.trim()),
          category: news.category,
        }),
      ]
    );

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
    const { userId } = await requireModerator();

    const result = await execute(
      "UPDATE news SET status = 'archived', updated_at = NOW() WHERE id = ?",
      [newsId]
    );
    if (result.affectedRows === 0) {
      return { ok: false, error: "Notícia não encontrada." };
    }

    const news = await findNews(newsId);
    if (!news) return { ok: false, error: "Notícia não encontrada." };

    await execute(
      `INSERT INTO audit_log (id, news_id, moderator_id, action, snapshot)
       VALUES (?, ?, ?, 'rejected', ?)`,
      [
        randomUUID(),
        newsId,
        userId,
        JSON.stringify({
          title: news.title,
          source: news.source,
          url: news.url,
        }),
      ]
    );

    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export interface IngestActionResult extends ActionResult {
  fetched?: number;
  inserted?: number;
  /** erros não-fatais por tema (ex.: limite da GNews) */
  topicErrors?: string[];
}

/**
 * Dispara a ingestão da GNews sob demanda a partir do painel (botão
 * "Buscar novas notícias"). Exige moderador autenticado. As notícias entram
 * como `pending` para curadoria; duplicatas são ignoradas.
 */
export async function ingestNews(): Promise<IngestActionResult> {
  try {
    await requireModerator();

    if (!isDbConfigured()) {
      return { ok: false, error: "Banco de dados não configurado." };
    }
    if (!process.env.GNEWS_API_KEY) {
      return {
        ok: false,
        error: "GNEWS_API_KEY não configurada no servidor.",
      };
    }

    const result = await runIngestion();
    revalidatePath("/admin");
    return {
      ok: true,
      fetched: result.fetched,
      inserted: result.inserted,
      topicErrors: result.errors.length ? result.errors : undefined,
    };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Encerra a sessão do moderador. */
export async function signOut(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/admin");
}
