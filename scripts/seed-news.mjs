// ============================================================
// Insere notícias de TESTE (status=pending) para validar o fluxo de
// aprovação no /admin sem depender da ingestão da GNews.
// Ao final, imprime a contagem de notícias por status.
//
// Uso:
//   node scripts/seed-news.mjs
//
// Lê a conexão do .env.local (DATABASE_URL ou MYSQL_*). Idempotente:
// usa INSERT IGNORE por external_id, então rodar de novo não duplica.
// ============================================================

import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import mysql from "mysql2/promise";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const SAMPLES = [
  {
    title: "Estudo liga sono regular a menor risco cardiovascular",
    source: "Portal Saúde",
    category: "Saúde",
    summary:
      "Pesquisa acompanhou 10 mil adultos e associou horários de sono consistentes a menor incidência de problemas no coração.",
  },
  {
    title: "Nova diretriz reforça atividade física leve ao longo do dia",
    source: "Vida & Bem-estar",
    category: "Bem-estar",
    summary:
      "Especialistas recomendam pausas ativas a cada hora como alternativa eficaz ao exercício concentrado.",
  },
  {
    title: "Alimentação rica em fibras melhora saúde intestinal, aponta revisão",
    source: "Nutrição Hoje",
    category: "Alimentação",
    summary:
      "Revisão de 40 estudos reforça o papel das fibras na microbiota e na digestão.",
  },
];

async function main() {
  loadEnv();

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

  const conn = await mysql.createConnection(base);

  for (const s of SAMPLES) {
    await conn.query(
      `INSERT IGNORE INTO news
         (id, external_id, title, source, url, image_url, published_at, summary, category, status)
       VALUES (?, ?, ?, ?, ?, NULL, NOW(), ?, ?, 'pending')`,
      [
        randomUUID(),
        `seed:${s.title}`,
        s.title,
        s.source,
        `https://example.com/${encodeURIComponent(s.title.slice(0, 30))}`,
        s.summary,
        s.category,
      ]
    );
  }

  const [rows] = await conn.query(
    "SELECT status, COUNT(*) AS total FROM news GROUP BY status"
  );
  console.log("✔ Notícias de teste inseridas. Contagem por status:");
  if (rows.length === 0) console.log("  (nenhuma notícia no banco)");
  for (const r of rows) console.log(`  - ${r.status}: ${r.total}`);

  await conn.end();
}

main().catch((e) => {
  console.error("Erro:", e.message);
  process.exit(1);
});
