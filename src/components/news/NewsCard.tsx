import Image from "next/image";
import type { PublicNewsItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import styles from "./NewsCard.module.css";

/**
 * Card de notícia (doc 3.2): título, fonte, data, imagem (quando disponível)
 * e resumo curto. O card inteiro abre a notícia original em nova aba.
 */
export function NewsCard({ item }: { item: PublicNewsItem }) {
  const date = formatDate(item.published_at);

  return (
    <article className={styles.card}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir notícia: ${item.title}`}
        style={{ display: "contents" }}
      >
        <div className={styles.imageWrap}>
          {item.category && <span className={styles.badge}>{item.category}</span>}
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className={styles.image}
            />
          ) : (
            <div className={styles.noImage}>BRChain News</div>
          )}
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{item.title}</h3>
          {item.summary && <p className={styles.summary}>{item.summary}</p>}
          <div className={styles.meta}>
            {item.source && <span className={styles.source}>{item.source}</span>}
            {date && <span>{date}</span>}
          </div>
          <span className={styles.link}>
            Ler notícia original
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </a>
    </article>
  );
}
