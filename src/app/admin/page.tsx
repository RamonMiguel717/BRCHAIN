import type { Metadata } from "next";
import { LoginForm } from "@/components/admin/LoginForm";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import { getSession, isAuthConfigured } from "@/lib/auth";
import { isDbConfigured, query } from "@/lib/db";
import type { News } from "@/lib/types";
import styles from "./admin.module.css";

export const metadata: Metadata = {
  title: "Painel de Curadoria",
  robots: { index: false, follow: false },
};

// Rota sempre dinâmica — depende da sessão do moderador.
export const dynamic = "force-dynamic";
// Vale também para as server actions da página: a ingestão sob demanda
// (ingestNews) consulta vários temas da GNews e pode passar de 10s.
export const maxDuration = 60;

function isConfigured() {
  return isDbConfigured() && isAuthConfigured();
}

export default async function AdminPage() {
  // Sem banco/auth configurados: mostra o login com aviso.
  if (!isConfigured()) {
    return <LoginForm configured={false} />;
  }

  const session = await getSession();

  // Rota /admin inacessível sem autenticação (doc 3.3).
  if (!session) {
    return <LoginForm configured={true} />;
  }

  // Moderador autenticado: lista todas as notícias e as separa por status
  // para as abas do painel. A autorização é da aplicação (sem RLS no MySQL).
  let all: News[];
  try {
    all = await query<News>("SELECT * FROM news ORDER BY updated_at DESC");
  } catch {
    return (
      <div className={styles.loginWrap}>
        <div className={styles.loginCard}>
          <h1>Painel de Curadoria</h1>
          <div className={styles.notConfigured}>
            Não foi possível conectar ao banco de dados. Verifique se o MySQL
            está no ar e as variáveis de conexão, e recarregue a página.
          </div>
        </div>
      </div>
    );
  }
  const groups = {
    pending: all.filter((n) => n.status === "pending"),
    approved: all.filter((n) => n.status === "approved"),
    archived: all.filter((n) => n.status === "archived"),
  };

  return <ModerationPanel groups={groups} moderatorEmail={session.email} />;
}
