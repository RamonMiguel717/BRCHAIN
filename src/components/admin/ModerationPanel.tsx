"use client";

import { useState, useTransition } from "react";
import type { News, NewsStatus } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { CATEGORY_OPTIONS } from "@/lib/categories";
import { approveNews, rejectNews, signOut } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

type Groups = { pending: News[]; approved: News[]; archived: News[] };
type Tab = keyof Groups;

const TAB_LABEL: Record<Tab, string> = {
  pending: "Pendentes",
  approved: "Aprovadas",
  archived: "Rejeitadas",
};

export function ModerationPanel({
  groups,
  moderatorEmail,
}: {
  groups: Groups;
  moderatorEmail: string;
}) {
  const [tab, setTab] = useState<Tab>("pending");
  const list = groups[tab];

  return (
    <div className={styles.wrap}>
      <div className={styles.topbar}>
        <h1>BRChain — Painel de Curadoria</h1>
        <div className={styles.user}>
          <span>{moderatorEmail}</span>
          <form action={signOut}>
            <button type="submit" className={styles.signout}>
              Sair
            </button>
          </form>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.tabs} role="tablist">
          {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`${styles.tab} ${tab === t ? styles.tabActive : ""}`}
              onClick={() => setTab(t)}
            >
              {TAB_LABEL[t]} <span className={styles.tabCount}>{groups[t].length}</span>
            </button>
          ))}
        </div>

        <p className={styles.sub}>{helpText(tab)}</p>

        {list.length === 0 ? (
          <div className={styles.empty}>{emptyText(tab)}</div>
        ) : (
          list.map((news) => <NewsItem key={news.id} news={news} status={tab} />)
        )}
      </div>
    </div>
  );
}

function helpText(tab: Tab) {
  switch (tab) {
    case "pending":
      return "Revise cada notícia trazida pela GNews. Aprovar publica na BRChain News (com edição opcional do resumo); rejeitar arquiva. Toda decisão é registrada no log de auditoria.";
    case "approved":
      return "Notícias publicadas. Você pode corrigir o resumo (Salvar edição) ou rejeitá-las — cada correção gera uma nova entrada no log de auditoria.";
    case "archived":
      return "Notícias rejeitadas, fora da listagem pública. Você pode editar o resumo e aprová-las posteriormente.";
  }
}

function emptyText(tab: Tab) {
  switch (tab) {
    case "pending":
      return "Nenhuma notícia pendente. Novas notícias entram automaticamente pela ingestão diária da GNews.";
    case "approved":
      return "Nenhuma notícia aprovada ainda.";
    case "archived":
      return "Nenhuma notícia rejeitada.";
  }
}

function NewsItem({ news, status }: { news: News; status: NewsStatus }) {
  const [summary, setSummary] = useState(news.summary_edited ?? news.summary ?? "");
  const [category, setCategory] = useState(news.category ?? CATEGORY_OPTIONS[0]);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [warn, setWarn] = useState("");
  const [isPending, startTransition] = useTransition();

  // Inclui a categoria atual como opção mesmo que não esteja na lista canônica.
  const options = CATEGORY_OPTIONS.includes(category as (typeof CATEGORY_OPTIONS)[number])
    ? CATEGORY_OPTIONS
    : [category, ...CATEGORY_OPTIONS];

  function run(
    action: () => Promise<{ ok: boolean; error?: string; warning?: string }>,
    successMsg: string
  ) {
    setError("");
    setOk("");
    setWarn("");
    startTransition(async () => {
      const res = await action();
      if (res.ok) {
        setOk(successMsg);
        if (res.warning) setWarn(res.warning);
      } else {
        setError(res.error ?? "Erro ao processar.");
      }
    });
  }

  // Camada de validação no cliente (o servidor revalida por segurança):
  // resumo preenchido não pode conter apenas números/símbolos.
  function validateSummary(): boolean {
    const t = summary.trim();
    if (t !== "" && !/\p{L}/u.test(t)) {
      setOk("");
      setWarn("");
      setError("O resumo precisa conter texto, não apenas números.");
      return false;
    }
    return true;
  }

  const approve = () => {
    if (validateSummary()) run(() => approveNews(news.id, summary, category), "Aprovada e publicada.");
  };
  const saveEdit = () => {
    if (validateSummary()) run(() => approveNews(news.id, summary, category), "Alterações salvas.");
  };
  const reject = () => run(() => rejectNews(news.id), "Arquivada.");

  return (
    <div className={styles.item}>
      {news.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={news.image_url} alt="" className={styles.thumb} />
      ) : (
        <div className={styles.noThumb}>Sem imagem</div>
      )}

      <div className={styles.body}>
        <h3>{news.title}</h3>
        <div className={styles.metaRow}>
          {news.category && <span className={styles.catTag}>{news.category}</span>}
          {news.source && <span>{news.source}</span>}
          {news.published_at && <span>{formatDate(news.published_at)}</span>}
          <a href={news.url} target="_blank" rel="noopener noreferrer">
            Abrir original ↗
          </a>
        </div>

        <div className={styles.field}>
          <label htmlFor={`category-${news.id}`}>Categoria</label>
          <select
            id={`category-${news.id}`}
            className={styles.select}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor={`summary-${news.id}`}>Resumo (editável)</label>
          <textarea
            id={`summary-${news.id}`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Sem resumo — você pode escrever um."
          />
        </div>

        {error && <p className={styles.rowError}>{error}</p>}
        {warn && <p className={styles.rowWarn}>⚠ {warn}</p>}
        {ok && <p className={styles.rowOk}>{ok}</p>}

        <div className={styles.actions}>
          {status === "pending" && (
            <>
              <button className={styles.approve} onClick={approve} disabled={isPending}>
                {isPending ? "Processando..." : "Aprovar"}
              </button>
              <button className={styles.reject} onClick={reject} disabled={isPending}>
                Rejeitar
              </button>
            </>
          )}

          {status === "approved" && (
            <>
              <button className={styles.approve} onClick={saveEdit} disabled={isPending}>
                {isPending ? "Salvando..." : "Salvar edição"}
              </button>
              <button className={styles.reject} onClick={reject} disabled={isPending}>
                Rejeitar
              </button>
            </>
          )}

          {status === "archived" && (
            <button className={styles.approve} onClick={approve} disabled={isPending}>
              {isPending ? "Processando..." : "Aprovar"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
