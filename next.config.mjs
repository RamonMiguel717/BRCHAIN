import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um build "standalone" (servidor Node mínimo em .next/standalone),
  // usado pela imagem Docker para um container enxuto.
  output: "standalone",
  // Fixa a raiz do rastreamento de arquivos neste projeto. Sem isso, um
  // package-lock.json em uma pasta acima faz o Next tratar essa pasta como
  // raiz e aninhar o server.js dentro de .next/standalone/<caminho>.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  // Mantém estes pacotes fora do bundle: o standalone passa a copiá-los para
  // node_modules, o que permite rodar os scripts (scripts/*.mjs) no container.
  serverExternalPackages: ["mysql2", "bcryptjs"],
  images: {
    // GNews retorna imagens de domínios variados de terceiros.
    // Permitimos qualquer host https para exibição via next/image.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
