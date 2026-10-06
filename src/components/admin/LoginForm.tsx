"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "@/app/admin/actions";
import styles from "@/app/admin/admin.module.css";

/**
 * Login do Painel de Moderação (auth própria sobre MySQL).
 * O moderador é criado fora do produto — sem tela de cadastro:
 *   node scripts/create-moderator.mjs email@dominio.com "SenhaForte"
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
      const res = await signIn(email, password);
      if (!res.ok) {
        setError(res.error ?? "E-mail ou senha inválidos.");
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
            Banco de dados ainda não configurado. Preencha as variáveis do MySQL
            (<code>DATABASE_URL</code> ou <code>MYSQL_HOST</code> etc.) e{" "}
            <code>AUTH_SECRET</code> em <code>.env.local</code> e reinicie o
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
