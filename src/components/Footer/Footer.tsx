import Image from "next/image";
import Link from "next/link";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.logo}>
          <Image src="/images/brchain-logo.png" alt="BRCHAIN" width={140} height={50} style={{ height: 50, width: "auto" }} />
        </div>
        <nav className={styles.links} aria-label="Rodapé">
          <a href="#governanca">Governança</a>
          <a href="#pesquisa">Pesquisa e DaaS</a>
          <a href="#solucoes">Soluções Corporativas</a>
          <Link href="/news">BRChain News</Link>
        </nav>
        <p className={styles.copy}>
          &copy; 2026 BRCHAIN. Todos os direitos reservados. Health Intelligence Layer.
        </p>
      </div>
    </footer>
  );
}
