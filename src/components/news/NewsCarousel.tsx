"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./NewsCarousel.module.css";

/**
 * Carrossel horizontal das notícias na Landing (bloco BRChain News).
 * Segue o padrão embla dos demais carrosséis do projeto, mas fica ativo em
 * todos os tamanhos (setas no desktop, arraste/swipe no mobile).
 * Recebe os NewsCard como children (mantém o cartão renderizado no servidor).
 */
export function NewsCarousel({ children }: { children: ReactNode }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    containScroll: "trimSnaps",
  });
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setCanPrev(emblaApi.canScrollPrev());
    setCanNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className={styles.embla}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => emblaApi?.scrollPrev()}
          disabled={!canPrev}
          aria-label="Notícias anteriores"
        >
          ‹
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => emblaApi?.scrollNext()}
          disabled={!canNext}
          aria-label="Próximas notícias"
        >
          ›
        </button>
      </div>

      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>{children}</div>
      </div>
    </div>
  );
}
