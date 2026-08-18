import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://brchain.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "BRCHAIN | O Sistema Nervoso Digital da Saúde",
    template: "%s | BRCHAIN",
  },
  description:
    "BRCHAIN — O Sistema Nervoso Digital da Saúde. A camada de inteligência acima do ERP para gestão hospitalar, governança e curadoria de notícias de saúde.",
  icons: { icon: "/images/app_launcher_icon.png" },
  openGraph: {
    title: "BRCHAIN | O Sistema Nervoso Digital da Saúde",
    description:
      "A camada de inteligência que conecta governança, operação e a jornada do paciente.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
