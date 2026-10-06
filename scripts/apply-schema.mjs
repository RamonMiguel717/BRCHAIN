// ============================================================
// Aplica o db/schema.sql no banco configurado (DATABASE_URL ou MYSQL_*).
// Evita precisar do cliente `mysql` instalado — usa o driver do projeto.
//
// Uso:
//   node scripts/apply-schema.mjs
//
// Lê a conexão do .env.local. Requer `npm install` já executado.
// ============================================================

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Carregador simples de .env.local (evita dependência extra).
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(join(root, file), "utf8");
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
  loadEnv();

  const sql = readFileSync(join(root, "db", "schema.sql"), "utf8");

  const base = process.env.DATABASE_URL
    ? { uri: process.env.DATABASE_URL }
    : {
        host: process.env.MYSQL_HOST,
        port: Number(process.env.MYSQL_PORT ?? 3306),
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl:
          process.env.MYSQL_SSL === "true"
            ? { rejectUnauthorized: true }
            : undefined,
      };

  // multipleStatements: roda o arquivo inteiro (vários CREATE TABLE) de uma vez.
  const conn = await mysql.createConnection({ ...base, multipleStatements: true });
  await conn.query(sql);

  const [tables] = await conn.query("SHOW TABLES");
  console.log("✔ Schema aplicado. Tabelas no banco:");
  for (const row of tables) console.log("  -", Object.values(row)[0]);

  await conn.end();
}

main().catch((e) => {
  console.error("Erro ao aplicar o schema:", e.message);
  process.exit(1);
});
