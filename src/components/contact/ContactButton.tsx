"use client";

import type { ReactNode } from "react";
import { ActionButton } from "@/components/Button/Button";
import { useContact } from "./ContactProvider";

type Variant = "primary" | "outline" | "white" | "dark";
type Size = "md" | "sm";

/** Botão que abre o modal de contato. Usado em várias seções da Landing. */
export function ContactButton({
  children,
  variant = "primary",
  size = "md",
  block,
  className,
}: {
  children: ReactNode;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  className?: string;
}) {
  const { openContact } = useContact();
  return (
    <ActionButton variant={variant} size={size} block={block} className={className} onClick={openContact}>
      {children}
    </ActionButton>
  );
}
