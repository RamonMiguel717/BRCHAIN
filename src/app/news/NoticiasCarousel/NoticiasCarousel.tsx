import useEmblaCarousel from "embla-carousel-react";
import styles from "./NoticiasCarousel.module.css";

interface NoticiasCarouselProps {
  items: {
    id: string | number;
    title?: string;
    description?: string;
    image_url?: string;
  }[];
}

export default function NoticiasCarousel({
  items,
}: NoticiasCarouselProps) {
  const [emblaRef] = useEmblaCarousel({
    align: "start",
    loop: true,
  });

  return (
    <section className={styles.embla}>
      <div className={styles.viewport} ref={emblaRef}>
        <div className={styles.container}>
          {items.map((item) => (
            <div className={styles.slide} key={item.id}>
              <h2>{item.title}</h2>

              {item.description && (
                <p>{item.description}</p>
              )}

              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title || "Notícia"}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}