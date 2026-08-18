import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "@/components/admin/LoginForm";
import { ModerationPanel } from "@/components/admin/ModerationPanel";
import type { News } from "@/lib/types";

export const metadata: Metadata = {
  title: "Painel de Curadoria",
  robots: { index: false, follow: false },
};

// Rota sempre dinâmica — depende da sessão do moderador.
export const dynamic = "force-dynamic";

function isConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export default async function AdminPage() {
  // Sem Supabase configurado: mostra o login com aviso.
  if (!isConfigured()) {
    return <LoginForm configured={false} />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rota /admin inacessível sem autenticação (doc 3.3).
  if (!user) {
    return <LoginForm configured={true} />;
  }

  // Moderador autenticado: lista todas as notícias (RLS permite ler tudo)
  // e as separa por status para as abas do painel.
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("updated_at", { ascending: false });

  const all = (data as News[]) ?? [];
  const groups = {
    pending: all.filter((n) => n.status === "pending"),
    approved: all.filter((n) => n.status === "approved"),
    archived: all.filter((n) => n.status === "archived"),
  };

  return <ModerationPanel groups={groups} moderatorEmail={user.email ?? "moderador"} />;
}
