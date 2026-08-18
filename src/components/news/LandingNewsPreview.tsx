import { LinkButton } from "@/components/Button/Button";
import { NewsCard } from "./NewsCard";
import { getApprovedNews } from "@/lib/news-queries";
import styles from "./LandingNewsPreview.module.css";

/**
 * Integração da BRChain News à Landing Page (doc 3.1: "seção com as notícias").
 * Mostra uma prévia das notícias aprovadas + CTA para a página completa.
 * Server Component: busca no servidor (RLS garante só `approved`).
 */
export async function LandingNewsPreview() {
  const { items } = await getApprovedNews({ limit: 2 });

  return (
    <section id="news" className={styles.section}>
      <div className="container">
        <div className={styles.head}>
          <h2>
            BRChain <span>News</span>
          </h2>
          <p>
            Acompanhe as principais notícias sobre saúde, bem-estar e inovação médica em um só
            lugar. Nossa central reúne conteúdos atualizados e curados para manter você informado
            sobre os temas que impactam sua qualidade de vida e o futuro da saúde.
          </p>
        </div>

        <div className={styles.panel}>
          {items.length > 0 ? (
            <div className={styles.grid}>
              {items.map((item) => (
                <NewsCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              As notícias curadas aparecerão aqui assim que forem aprovadas no Painel de Curadoria.
            </div>
          )}

          <div className={styles.cta}>
            <LinkButton href="/news" variant="dark">
              Acesse a BRChain News →
            </LinkButton>
          </div>
        </div>
      </div>
    </section>
  );
}
