// ============================================================
// Cria (ou atualiza a senha de) um moderador do Painel de Curadoria.
// Substitui o "Authentication → Add user" do Supabase.
//
// Uso:
//   node scripts/create-moderator.mjs email@dominio.com "SenhaForte" ["Nome"]
//
// Lê a conexão do .env.local (DATABASE_URL ou MYSQL_*). Requer que as
// dependências estejam instaladas (npm install) e o schema já criado
// (db/schema.sql).
// ============================================================

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Carregador simples de .env.local (evita dependência extra).
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(join(__dirname, "..", file), "utf8");
      for (const line of content.split("\n")) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) {
          process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
        }
      }
    } catch {
      // arquivo ausente — ok
    }
  }
}

async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email || !password) {
    console.error(
      'Uso: node scripts/create-moderator.mjs email@dominio.com "SenhaForte" ["Nome"]'
    );
    process.exit(1);
  }

  loadEnv();

  const pool = process.env.DATABASE_URL
    ? mysql.createPool({ uri: process.env.DATABASE_URL })
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
      });

  const hash = await bcrypt.hash(password, 10);
  const normalizedEmail = email.trim().toLowerCase();

  // Upsert: cria; se o e-mail já existir, atualiza a senha (e o nome).
  await pool.query(
    `INSERT INTO moderators (id, email, password_hash, name)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), name = VALUES(name)`,
    [randomUUID(), normalizedEmail, hash, name ?? null]
  );

  console.log(`✔ Moderador pronto: ${normalizedEmail}`);
  await pool.end();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
