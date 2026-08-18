import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase com a SERVICE ROLE KEY.
 * Usado SOMENTE no servidor, no cron de ingestão da GNews, para inserir
 * notícias com status = pending. Bypassa a RLS — nunca exponha esta chave
 * no bundle do cliente.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}
