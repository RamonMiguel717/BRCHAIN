"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import styles from "@/app/admin/admin.module.css";

/**
 * Login do Painel de Moderação via Supabase Auth (doc 3.3).
 * O moderador é criado por convite direto no painel do Supabase —
 * não há tela de cadastro no produto.
 */
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError("E-mail ou senha inválidos.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Falha ao autenticar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginWrap}>
      <div className={styles.loginCard}>
        <h1>Painel de Curadoria</h1>
        <p className={styles.hint}>Acesso restrito a moderadores autenticados.</p>

        {!configured ? (
          <div className={styles.notConfigured}>
            Supabase ainda não configurado. Preencha <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
            <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> em <code>.env.local</code> e reinicie o
            servidor.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className={styles.loginError}>{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
