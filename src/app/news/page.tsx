import type { Metadata } from "next";
import Link from "next/link";
import { LinkButton } from "@/components/Button/Button";
import { NewsExplorer } from "@/components/news/NewsExplorer";
import { getApprovedNews } from "@/lib/news-queries";
import styles from "./page.module.css";
import NoticiasCarousel from "./NoticiasCarousel/NoticiasCarousel";

export const metadata: Metadata = {
  title: "BRChain News — Notícias de Saúde",
  description:
    "Central de notícias de saúde, bem-estar e inovação médica do BRChain — conteúdo curado e atualizado.",
};

// Revalida a listagem inicial periodicamente (dados vêm da curadoria).
export const revalidate = 300;

export default async function NewsPage() {
  const { items, error } = await getApprovedNews({ limit: 60 });

  return (
    <>
      {/* Header com botão "Voltar para BRChain" sempre visível (doc 3.2) */}
      <header className={styles.header}>
        <div className={`container ${styles.headerWrap}`}>
          <Link href="/" className={styles.brand} aria-label="BRChain News — início">
            BR<span>chain</span> News
          </Link>
          <LinkButton href="/" variant="dark">
            ← Voltar para BRChain
          </LinkButton>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className="container">
            <h1>Informação que cuida de você.</h1>
            <p>Acompanhe notícias sobre saúde e bem-estar, curadas pela equipe BRChain.</p>
          </div>
        </section>

        {/* <NoticiasCarousel items={items} /> */}

        <NewsExplorer initialItems={items} initialError={error} />
      </main>
    </>
  );
}
