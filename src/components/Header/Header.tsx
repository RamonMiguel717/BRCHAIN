import Image from "next/image";
import Link from "next/link";
import { LinkButton } from "@/components/Button/Button";
import { ContactButton } from "@/components/contact/ContactButton";
import styles from "./Header.module.css";

/** Cabeçalho da Landing Page — nav por âncoras + CTAs (doc 3.1). */
export function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.wrapper}`}>
        <Link href="/" className={styles.logo} aria-label="BRCHAIN — início">
          <Image
            src="/images/brchain-logo-hz.png"
            alt="BRCHAIN"
            width={140}
            height={35}
            style={{ height: 35, width: "auto" }}
            priority
          />
        </Link>

        <nav className={styles.nav} aria-label="Seções da página">
          <ul>
            <li><a href="#governanca">Governança</a></li>
            <li><a href="#pesquisa">Pesquisa e DaaS</a></li>
            <li><a href="#solucoes">Soluções Corporativas</a></li>
            <li><a href="#news">Notícias</a></li>
          </ul>
        </nav>

        <div className={styles.actions}>
          <LinkButton href="/news" variant="outline" size="sm" className={styles.newsBtn}>
            Ver BRChain News
          </LinkButton>
          <ContactButton variant="primary" size="sm">
            Fale com um Especialista
          </ContactButton>
        </div>
      </div>
    </header>
  );
}
