import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Button.module.css";

type Variant = "primary" | "outline" | "white" | "dark";
type Size = "md" | "sm";

function classes(variant: Variant, size: Size, block?: boolean, extra?: string) {
  return [
    styles.btn,
    styles[variant],
    size === "sm" ? styles.sm : "",
    block ? styles.block : "",
    extra ?? "",
  ]
    .filter(Boolean)
    .join(" ");
}

interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
  /** Links externos (notícia original) abrem em nova aba. */
  external?: boolean;
}

/** Botão em forma de link (navegação interna via next/link ou externo). */
export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  block,
  external,
  className,
  children,
  ...rest
}: LinkButtonProps) {
  const cls = classes(variant, size, block, className);
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {children}
    </Link>
  );
}

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  children: ReactNode;
}

/** Botão de ação (onClick / submit). */
export function ActionButton({
  variant = "primary",
  size = "md",
  block,
  className,
  children,
  ...rest
}: ActionButtonProps) {
  return (
    <button className={classes(variant, size, block, className)} {...rest}>
      {children}
    </button>
  );
}
