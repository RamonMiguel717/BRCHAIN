"use client";

import { useState } from "react";
import styles from "./careLoop.module.css";

const careLoopItems = [
  {
    letter: "C",
    title: "Connect",
    description:
      "Conectamos dados dispersos de laboratórios, clínicas, hospitais e do próprio paciente de forma segura.",
  },
  {
    letter: "A",
    title: "Annalyze",
    description:
      "Transformamos dados brutos em inteligência estruturada e insights acionáveis em tempo real.",
  },
  {
    letter: "R",
    title: "Recommend",
    description:
      "Nossa IA sugere ações para o corpo clínico e caminhos claros de prevenção para o paciente.",
  },
  {
    letter: "E",
    title: "Engage",
    description:
      "Mantemos o paciente engajado, acompanhando sua jornada e facilitando a adesão aos tratamentos recomendados.",
  },
];

export function CareLoop() {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeItem = careLoopItems[activeIndex];

  return (
    <section id="brchainCareLoop" className={styles.careLoop}>
      <div className="container">
        <div className={styles.header}>
          <h2>O BRchain CARE LOOP</h2>
          <p>
            O paciente no centro da operação, com retroalimentação contínua de
            dados e inteligência.
          </p>
        </div>
        <div className={styles.letters}>
          {careLoopItems.map((item, index) => (
            <button
              key={item.letter}
              type="button"
              className={`${styles.letterButton} ${
                activeIndex === index ? styles.active : ""
              }`}
              onClick={() => setActiveIndex(index)}
            >
              {item.letter}
            </button>
          ))}
        </div>
        <div className={styles.textContent}>
          <h3>{activeItem.title}</h3>
          <p>{activeItem.description}</p>
        </div>
      </div>
    </section>
  );
}