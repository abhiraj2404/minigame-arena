import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "../components/navbar";
import { SolanaWalletProvider } from "@/components/wallet-provider";
import { PlayerProvider } from "@/components/player-context";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Minigame Arena",
  description: "Play mini games and win GOR",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-black min-h-screen text-white`}>
        <Analytics />
        <SolanaWalletProvider>
          <PlayerProvider>
            <div className="relative min-h-screen bg-black">
              {/* Background grid pattern */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
              <Navbar />
              <main className="container mx-auto px-4 py-8">{children}</main>
            </div>
          </PlayerProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
