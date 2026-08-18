/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // GNews retorna imagens de domínios variados de terceiros.
    // Permitimos qualquer host https para exibição via next/image.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
