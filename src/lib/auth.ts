import { cookies } from "next/headers";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

/**
 * Autenticação do Painel de Curadoria (substitui o Supabase Auth).
 *
 * - Senha: hash bcrypt na tabela `moderators`.
 * - Sessão: cookie httpOnly com token assinado (HMAC-SHA256 + AUTH_SECRET),
 *   sem estado no servidor. Formato: base64url(payload).base64url(assinatura).
 */

const COOKIE = "brchain_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias (segundos)

export interface SessionPayload {
  /** id do moderador (moderators.id) */
  sub: string;
  email: string;
  /** expiração (epoch em segundos) */
  exp: number;
}

export function isAuthConfigured(): boolean {
  return Boolean(process.env.AUTH_SECRET);
}

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET não configurada.");
  return s;
}

function sign(data: string): string {
  return crypto.createHmac("sha256", secret()).update(data).digest("base64url");
}

export function createSessionToken(sub: string, email: string): string {
  const payload: SessionPayload = {
    sub,
    email,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

export function verifySessionToken(
  token: string | undefined
): SessionPayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  // Comparação em tempo constante para evitar timing attacks.
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload;
    if (!payload.exp || payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Lê e valida a sessão do moderador a partir do cookie. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySessionToken(store.get(COOKIE)?.value);
}

/**
 * Flag Secure do cookie. Padrão: ligada em produção. COOKIE_SECURE permite
 * desligá-la em ambientes de produção servidos por HTTP (ex.: stack Docker local).
 */
function cookieSecure(): boolean {
  const override = process.env.COOKIE_SECURE;
  if (override) return override === "true";
  return process.env.NODE_ENV === "production";
}

export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/**
 * Hash bcrypt de uma senha aleatória descartada. Usado no login quando o
 * e-mail não existe, para que a resposta leve o mesmo tempo de um e-mail
 * válido (evita enumeração de moderadores por timing).
 */
export const DUMMY_PASSWORD_HASH =
  "$2a$10$LutOWvNsIw1g/ZcbSOr1eOvTmRNEqIbRw60ykrzeWv2/fkGklaxQG";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
