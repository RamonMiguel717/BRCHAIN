"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicNewsItem } from "@/lib/types";
import { ActionButton } from "@/components/Button/Button";
import { NewsCard } from "./NewsCard";
import styles from "./NewsExplorer.module.css";
import listStyles from "@/app/news/page.module.css";

type State = "idle" | "loading" | "error";

interface Props {
  initialItems: PublicNewsItem[];
  initialError: boolean;
}

const ALL = "Todas";

/**
 * Explorador de notícias da BRChain News.
 * - Busca por palavra-chave (P-03) + filtro por categoria (P-07) via /api/news
 * - Trata os estados de carregamento, erro e ausência de dados (doc 3.2)
 */
export function NewsExplorer({ initialItems, initialError }: Props) {
  const [items, setItems] = useState<PublicNewsItem[]>(initialItems);
  const [state, setState] = useState<State>(initialError ? "error" : "idle");
  const [query, setQuery] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [category, setCategory] = useState<string>(ALL);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Categorias disponíveis, calculadas uma vez a partir do conjunto inicial.
  const categories = useMemo(() => {
    const set = new Set<string>();
    initialItems.forEach((i) => i.category && set.add(i.category));
    return [ALL, ...Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function search(q: string, cat: string) {
    setState("loading");
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (cat && cat !== ALL) params.set("category", cat);
      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || data.error) {
        setState("error");
        return;
      }
      setItems(data.items as PublicNewsItem[]);
      setActiveQuery(q);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  // Busca com debounce enquanto digita.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.trim() !== activeQuery) search(query.trim(), category);
    }, 450);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function selectCategory(cat: string) {
    setCategory(cat);
    search(query.trim(), cat);
  }

  return (
    <>
      <form
        className={styles.searchBar}
        onSubmit={(e) => {
          e.preventDefault();
          search(query.trim(), category);
        }}
        role="search"
      >
        <div className={styles.inputWrap}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className={styles.input}
            type="search"
            placeholder="Busque por palavra-chave ou título"
            aria-label="Buscar notícias por palavra-chave"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ActionButton type="submit" variant="primary">
          Buscar
        </ActionButton>
      </form>

      {categories.length > 1 && (
        <div className={styles.chips} role="group" aria-label="Filtrar por categoria">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.chip} ${category === cat ? styles.chipActive : ""}`}
              aria-pressed={category === cat}
              onClick={() => selectCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <section className={listStyles.listSection}>
        <div className="container">
          <div className={listStyles.listHeader}>
            <h2>{activeQuery ? `Resultados para "${activeQuery}"` : "Notícias curadas"}</h2>
            {state === "idle" && (
              <span className={listStyles.count}>
                {items.length} {items.length === 1 ? "notícia" : "notícias"}
                {category !== ALL ? ` · ${category}` : ""}
              </span>
            )}
          </div>

          {state === "loading" && <LoadingGrid />}

          {state === "error" && (
            <div className={styles.state}>
              <h3>Não foi possível carregar as notícias</h3>
              <p>Houve uma falha ao consultar a fonte de dados. Tente novamente.</p>
              <div className={styles.retry}>
                <ActionButton variant="outline" onClick={() => search(activeQuery, category)}>
                  Tentar novamente
                </ActionButton>
              </div>
            </div>
          )}

          {state === "idle" && items.length === 0 && (
            <div className={styles.state}>
              <h3>Nenhuma notícia encontrada</h3>
              <p>
                {activeQuery || category !== ALL
                  ? "Tente outra palavra-chave ou categoria."
                  : "As notícias aparecerão aqui assim que forem aprovadas no Painel de Curadoria."}
              </p>
            </div>
          )}

          {state === "idle" && items.length > 0 && (
            <div className={listStyles.grid}>
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function LoadingGrid() {
  return (
    <div className={styles.skeletonGrid} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={styles.skeleton}>
          <div className={styles.skeletonImg} />
          <div className={styles.skeletonLine} />
          <div className={`${styles.skeletonLine} ${styles.short}`} />
        </div>
      ))}
    </div>
  );
}
