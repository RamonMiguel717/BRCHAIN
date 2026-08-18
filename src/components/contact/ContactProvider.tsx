"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { ContactModal } from "./ContactModal";

interface ContactContextValue {
  openContact: () => void;
}

const ContactContext = createContext<ContactContextValue | null>(null);

/**
 * Provê o modal "Fale com um Especialista" para toda a árvore.
 * Qualquer botão pode abri-lo via useContact() — um único modal na página.
 */
export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openContact = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  return (
    <ContactContext.Provider value={{ openContact }}>
      {children}
      <ContactModal open={open} onClose={close} />
    </ContactContext.Provider>
  );
}

export function useContact() {
  const ctx = useContext(ContactContext);
  if (!ctx) throw new Error("useContact deve ser usado dentro de <ContactProvider>");
  return ctx;
}
