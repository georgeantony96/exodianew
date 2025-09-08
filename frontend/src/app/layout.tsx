import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { RootErrorBoundary } from "@/components/ErrorBoundary/RootErrorBoundary";
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
  title: "EXODIA FINAL - Monte Carlo Sports Betting Simulation",
  description: "Advanced Monte Carlo simulation platform for sports betting analysis with true odds calculation and value bet detection",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-theme="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <RootErrorBoundary>
          {children}
        </RootErrorBoundary>
      </body>
    </html>
  );
}
