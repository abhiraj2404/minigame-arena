"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletBalance } from "./wallet-provider";
import { formatSol } from "@/lib/solana-config";
import { usePlayer } from "./player-context";
import { MagicCard } from "@/components/magicui/magic-card";
import '@solana/wallet-adapter-react-ui/styles.css';

export default function Navbar() {
  const { connected } = useWallet();
  const { balance, isLoading } = useWalletBalance();
  const { playerName } = usePlayer();

  return (
    <nav className="relative z-100 border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-green-400 transition-colors">
            🎮 Minigame Arena
          </Link>
          <div className="flex items-center space-x-6">
            {playerName && (
              <MagicCard className="rounded-full px-3 py-2 min-w-[90px] flex items-center justify-center text-green-400 text-sm font-semibold bg-black/60 border border-green-500/30 shadow-md">
                <div className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4 mr-1 opacity-80"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z"
                    />
                  </svg>
                  {playerName}
                </div>
              </MagicCard>
            )}

            {connected && (
              <MagicCard className="rounded-full px-3 py-2 min-w-[90px] flex items-center justify-center text-green-400 text-sm font-semibold bg-black/60 border border-green-500/30 shadow-md">
                {isLoading ? "Loading..." : `${formatSol(balance)} SOL`}
              </MagicCard>
            )}

            <div>
              <WalletMultiButton className="bg-black text-4xl" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
