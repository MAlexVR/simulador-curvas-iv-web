import type { Metadata, Viewport } from "next";
import { Work_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Simulador Curvas I-V y P-V | SENA CEET",
  description:
    "Simulador web para calcular y visualizar las curvas características I-V y P-V de módulos fotovoltaicos usando el método Barry Analytical Expansion. Desarrollado por el CEET - SENA.",
  keywords: [
    "fotovoltaico",
    "panel solar",
    "curva I-V",
    "curva P-V",
    "simulador",
    "energía solar",
    "SENA",
    "CEET",
    "GICS",
  ],
  authors: [{ name: "Mauricio Alexander Vargas Rodríguez" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Curvas I-V",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${workSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
