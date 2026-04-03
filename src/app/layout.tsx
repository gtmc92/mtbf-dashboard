import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mtbf-dashboard.vercel.app"),
  title: "설비 신뢰성 관리 & 분석 플랫폼",
  description: "MTBF/MTTR 기반 설비 상태 및 유지보수 분석 시스템",
  openGraph: {
    title: "설비 신뢰성 관리 & 분석 플랫폼",
    description: "MTBF/MTTR 기반 설비 상태 및 유지보수 분석 시스템",
    url: "https://mtbf-dashboard.vercel.app",
    siteName: "DEERFOS",
    locale: "ko_KR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "설비 신뢰성 관리 & 분석 플랫폼",
    description: "MTBF/MTTR 기반 설비 상태 및 유지보수 분석 시스템",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
