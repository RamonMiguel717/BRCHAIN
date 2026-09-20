"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { LinkButton } from "@/components/Button/Button";
import { ContactButton } from "@/components/contact/ContactButton";

import styles from "./Header.module.css";

/** Cabeçalho da Landing Page — nav por âncoras + CTAs (doc 3.1). */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.wrapper}`}>
        <Link
          href="/"
          className={styles.logo}
          aria-label="BRCHAIN — início"
        >
          <Image
            src="/images/brchain-logo-hz.png"
            alt="BRCHAIN"
            width={140}
            height={35}
            style={{ height: 35, width: "auto" }}
            priority
          />
        </Link>

        {/* NAV DESKTOP */}
        <nav
          className={styles.nav}
          aria-label="Seções da página"
        >
          <ul>
            <li>
              <a href="#governanca">Governança</a>
            </li>

            <li>
              <a href="#pesquisa">Pesquisa e DaaS</a>
            </li>

            <li>
              <a href="#solucoes">Soluções Corporativas</a>
            </li>

            <li>
              <a href="#news">BRchain News</a>
            </li>
          </ul>
        </nav>

        {/* AÇÕES DESKTOP */}
        <div className={styles.actions}>
          {/* <LinkButton
            href="/news"
            variant="outline"
            size="sm"
            target="_blank"
            className={styles.newsBtn}
          >
            Ver BRChain News
          </LinkButton> */}

          <ContactButton
            variant="primary"
            size="sm"
          >
            Fale com um Especialista
          </ContactButton>
        </div>

        {/* BOTÃO HAMBÚRGUER - APENAS MOBILE */}
        <button
          className={styles.menuButton}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={menuOpen}
          type="button"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* MENU MOBILE */}
      <nav
        className={`${styles.mobileMenu} ${
          menuOpen ? styles.mobileMenuOpen : ""
        }`}
        aria-label="Menu mobile"
      >
        <ul>
          <li>
            <a
              href="#governanca"
              onClick={() => setMenuOpen(false)}
            >
              Governança
            </a>
          </li>

          <li>
            <a
              href="#pesquisa"
              onClick={() => setMenuOpen(false)}
            >
              Pesquisa e DaaS
            </a>
          </li>

          <li>
            <a
              href="#solucoes"
              onClick={() => setMenuOpen(false)}
            >
              Soluções Corporativas
            </a>
          </li>

          <li>
            <a
              href="#news"
              onClick={() => setMenuOpen(false)}
            >
              BRchain News
            </a>
          </li>
        </ul>

        {/* BOTÕES NO MENU MOBILE */}
        <div className={styles.mobileActions}>
          {/* <LinkButton
            href="/news"
            variant="outline"
            size="sm"
            target="_blank"
            className={styles.newsBtn}
          >
            Ver BRChain News
          </LinkButton> */}

          <ContactButton
            variant="primary"
            size="sm"
          >
            Fale com um Especialista
          </ContactButton>
        </div>
      </nav>
    </header>
  );
}
