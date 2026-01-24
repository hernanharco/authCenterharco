import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css"; // Única importación global de CSS
import { AuthRefreshProvider } from "@/components/AuthRefreshProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AuthCenterSaaS - Multi-tenant Platform",
  description: "Arquitectura escalable en Linux con Spring Boot + Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        {/* Aquí es donde Next.js inyectará tus páginas y layouts anidados */}
        <AuthRefreshProvider>
          {children}
        </AuthRefreshProvider>
      </body>
    </html>
  );
}