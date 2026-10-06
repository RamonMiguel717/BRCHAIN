import mysql from "mysql2/promise";

/**
 * Pool de conexões MySQL (singleton).
 *
 * Substitui o cliente Supabase como camada de persistência. Aceita duas
 * formas de configuração (nesta ordem de precedência):
 *   1. DATABASE_URL  → mysql://user:senha@host:3306/banco
 *   2. Variáveis discretas MYSQL_HOST / MYSQL_PORT / MYSQL_USER /
 *      MYSQL_PASSWORD / MYSQL_DATABASE (+ MYSQL_SSL="true" opcional)
 *
 * `dateStrings: true` mantém DATETIME como string ("YYYY-MM-DD HH:MM:SS"),
 * compatível com o pipeline existente (tipos `string | null` e formatDate).
 */

// O pool é guardado no escopo global para sobreviver ao hot-reload do Next
// em desenvolvimento (evita esgotar conexões a cada recompilação).
const globalForDb = globalThis as unknown as { __brchainPool?: mysql.Pool };

export function isDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL || process.env.MYSQL_HOST);
}

export function getPool(): mysql.Pool {
  if (globalForDb.__brchainPool) return globalForDb.__brchainPool;

  const common = {
    waitForConnections: true,
    connectionLimit: 10,
    dateStrings: true as const,
    timezone: "Z", // interpreta Date de entrada como UTC
    charset: "utf8mb4",
  };

  const pool = process.env.DATABASE_URL
    ? mysql.createPool({ uri: process.env.DATABASE_URL, ...common })
    : mysql.createPool({
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl:
          process.env.MYSQL_SSL === "true"
            ? { rejectUnauthorized: true }
            : undefined,
        ...common,
      });

  globalForDb.__brchainPool = pool;
  return pool;
}

/** SELECT/consulta com prepared statement. Retorna as linhas tipadas. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const [rows] = await getPool().execute(sql, params as never);
  return rows as T[];
}

/**
 * Executa uma escrita (INSERT/UPDATE/DELETE) e retorna o resultado bruto
 * (affectedRows, insertId, etc.). Usa `query` (protocolo de texto) para
 * suportar bulk insert com `VALUES ?`.
 */
export async function execute(
  sql: string,
  params: unknown[] = []
): Promise<mysql.ResultSetHeader> {
  const [result] = await getPool().query(sql, params as never);
  return result as mysql.ResultSetHeader;
}
