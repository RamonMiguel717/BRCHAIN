import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Roda em todas as rotas, exceto estáticos e imagens.
    "/((?!_next/static|_next/image|favicon.ico|images/).*)",
  ],
};
