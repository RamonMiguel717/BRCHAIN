"use client";

import { useEffect, useState } from "react";
import { ActionButton } from "@/components/Button/Button";
import styles from "./ContactModal.module.css";

interface Props {
  open: boolean;
  onClose: () => void;
}

type Status = "idle" | "sending" | "success" | "error";

export function ContactModal({ open, onClose }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  // Fecha com ESC e trava o scroll do fundo enquanto aberto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body.error || "Erro ao enviar. Tente novamente mais tarde.");
        setStatus("error");
      }
    } catch {
      setErrorMsg("Erro de conexão. Verifique sua internet e tente novamente.");
      setStatus("error");
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-title"
    >
      <div className={styles.content} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Fechar">
          &times;
        </button>

        {status === "success" ? (
          <div className={styles.feedback}>
            <svg viewBox="0 0 24 24" width="60" height="60" stroke="var(--green-brand)" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <h3>Mensagem enviada!</h3>
            <p>Nossa equipe entrará em contato em breve.</p>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h2 id="contact-title">Fale com um Especialista</h2>
              <p>Preencha os dados abaixo e nossa equipe entrará em contato.</p>
            </div>
            <form onSubmit={handleSubmit}>
              {status === "error" && <p className={styles.error}>{errorMsg}</p>}
              <div className={styles.group}>
                <label htmlFor="name">Nome completo</label>
                <input id="name" name="name" type="text" required placeholder="Seu nome" />
              </div>
              <div className={styles.group}>
                <label htmlFor="email">E-mail corporativo</label>
                <input id="email" name="email" type="email" required placeholder="seu@email.com.br" />
              </div>
              <div className={styles.group}>
                <label htmlFor="phone">Número de celular</label>
                <input id="phone" name="phone" type="tel" required placeholder="(11) 90000-0000" />
              </div>
              <div className={styles.group}>
                <label htmlFor="institution">Instituição / Hospital / Clínica</label>
                <input id="institution" name="institution" type="text" required placeholder="Nome da instituição" />
              </div>
              <div className={styles.group}>
                <label htmlFor="message">Como podemos ajudar?</label>
                <textarea id="message" name="message" rows={4} required placeholder="Descreva brevemente seu desafio..." />
              </div>
              <ActionButton type="submit" variant="primary" block disabled={status === "sending"}>
                {status === "sending" ? "Enviando..." : "Enviar mensagem"}
              </ActionButton>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
