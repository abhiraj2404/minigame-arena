"use client";

import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useWalletBalance } from "./wallet-provider";
import { formatSol } from "@/lib/solana-config";
import { usePlayer } from "./player-context";
import { MagicCard } from "@/components/magicui/magic-card";
import { Spinner } from "@/components/ui/spinner";
import "@solana/wallet-adapter-react-ui/styles.css";
import { GithubIcon, TwitterIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default function Navbar() {
  const { connected } = useWallet();
  const { balance, isLoading } = useWalletBalance();
  const { playerName, loading: playerNameLoading } = usePlayer();

  return (
    <nav className="relative z-100 border-b mx-6 border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-green-400 transition-colors">
            🎮 Minigame Arena
          </Link>
          <div className="flex items-center space-x-6">
            {connected && (
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
                  {playerNameLoading ? (
                    <>
                      <Spinner className="w-4 h-4 mr-2 inline-block" />
                      Loading...
                    </>
                  ) : (
                    playerName
                  )}
                </div>
              </MagicCard>
            )}

            {connected && (
              <MagicCard className="rounded-full px-3 py-2 min-w-[90px] flex items-center justify-center text-green-400 text-sm font-semibold bg-black/60 border border-green-500/30 shadow-md">
                {isLoading ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2 inline-block" />
                    Loading...
                  </>
                ) : (
                  `${formatSol(balance)} SOL`
                )}
              </MagicCard>
            )}

            <div className="relative group flex items-center">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full px-3 py-1 text-sm font-semibold border border-green-500/30 bg-black/60 text-green-400 shadow-md hover:bg-green-950/60 flex items-center"
                style={{ minWidth: 0 }}
              >
                <Globe className="h-4 w-4 text-gray-400 mr-1" />
                Solana Devnet
              </Button>
              <div className="absolute left-1/2 top-full z-50 mt-[0.5] min-w-[220px] -translate-x-1/2 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-200 scale-95 group-hover:scale-100 bg-popover text-popover-foreground border rounded-md shadow-md">
                <div className="flex flex-col p-2">
                  <div className="flex flex-col items-start cursor-pointer select-text px-2 py-1.5 rounded hover:bg-accent">
                    <span className="text-xs text-muted-foreground mb-1">RPC URL</span>
                    <span className="font-mono text-green-400 text-xs break-all">api.devnet.solana.com</span>
                  </div>
                  <div className="my-1 border-t border-muted" />
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-2 py-1.5 rounded text-green-400 font-semibold text-sm hover:bg-accent"
                  >
                    Faucet
                  </a>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-5">
              <WalletMultiButton className="bg-black text-4xl" />
            </div>
            <Link
              href="https://github.com/abhiraj2404/minigame-arena"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <GithubIcon size={24} />
            </Link>
            <Link
              href="https://x.com/abhiraj_2404"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
              className="text-gray-400 hover:text-gray-200 transition-colors"
            >
              <TwitterIcon size={24} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
