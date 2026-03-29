import Script from "next/script";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NXT-GEN SKILLFORGE",
  description: "Skill-intelligence platform for job matching, gap analysis, and guided upskilling.",
  keywords: ["Skillforge", "job matching", "skills", "upskilling", "career intelligence", "Next.js"],
  authors: [{ name: "Next Gen Builders" }],
  openGraph: {
    title: "NXT-GEN SKILLFORGE",
    description: "Skill-intelligence platform for job matching and upskilling.",
    siteName: "NXT-GEN SKILLFORGE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NXT-GEN SKILLFORGE",
    description: "Skill-intelligence platform for job matching and upskilling.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* Hooked up your custom Geist fonts to the body! */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {/* FIX 1: Next.js Optimized Theme Script */}
        <Script id="theme-switcher" strategy="beforeInteractive">
          {`
            if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              document.documentElement.classList.add('dark')
            } else {
              document.documentElement.classList.remove('dark')
            }
          `}
        </Script>

        {/* FIX 2: Wrapped the app in your Providers */}
        <Providers>
          {children}
          {/* Hooked up your Toaster so notifications work! */}
          <Toaster /> 
        </Providers>
        
      </body>
    </html>
  )
}