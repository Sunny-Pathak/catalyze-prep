import type { Metadata } from "next";
import { Syne, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

import { SmoothScroll } from "@/components/SmoothScroll";

export const metadata: Metadata = {
  title: "CATalyze — CAT Exam Tracker | DISCIPLINE is Real.",
  description:
    "Observation defines outcome. Structured daily quotas and continuous percentile mastery for CAT aspirants. Free, private, and built for people who study in silence.",
  keywords: ["CAT Tracker", "IIM Preparation", "Quant", "DILR", "VARC", "Study Discipline", "Percentile Predictor"],
  authors: [{ name: "Sunny Pathak" }],
  creator: "Sunny Pathak",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://cat-tracker-1538d.web.app/",
    title: "CATalyze — CAT Exam Tracker | DISCIPLINE is Real.",
    description:
      "Observation defines outcome. Structured daily quotas and continuous percentile mastery for CAT aspirants.",
    siteName: "CATalyze",
  },
  twitter: {
    card: "summary_large_image",
    title: "CATalyze — CAT Exam Tracker",
    description: "Structured daily quotas and continuous percentile mastery for CAT aspirants.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${geistMono.variable} ${inter.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#08070d] text-slate-100 selection:bg-purple-500 selection:text-black font-sans">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
