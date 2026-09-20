"use client";

import { ReactNode, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";

import styles from "./agentsCarousel.module.css";

interface AgentsCarouselProps {
  children: ReactNode;
}

export function AgentsCarousel({ children }: AgentsCarouselProps) {
  const [isMobile, setIsMobile] = useState(false);

  const [emblaRef] = useEmblaCarousel({
    loop: false,
    align: "start",
    active: isMobile,
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 960px)"
    );

    const handleChange = () => {
      setIsMobile(mediaQuery.matches);
    };

    handleChange();

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <div className={styles.embla}>
      <div className={styles.emblaViewport} ref={emblaRef}>
        <div className={styles.emblaContainer}>
          {children}
        </div>
      </div>
    </div>
  );
}