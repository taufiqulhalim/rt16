import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sistem Keuangan RT - Laporan Kas & Pembukuan",
  description: "Sistem pembukuan keuangan RT 16 RW 06 Desa Bungah, Kecamatan Bungah, Kabupaten Gresik. Laporan kas tahunan, bulanan, dan harian.",
  keywords: ["keuangan RT", "laporan kas", "pembukuan", "RT RW", "desa bungah"],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-950`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
