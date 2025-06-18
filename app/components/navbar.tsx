"use client"

import Link from "next/link"
import { useWallet } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import { useWalletBalance } from "@/lib/wallet-provider"
import { formatSol } from "@/lib/solana-config"

export default function Navbar() {
  const { connected } = useWallet()
  const { balance, isLoading } = useWalletBalance()

  return (
    <nav className="relative border-b border-white/10 bg-black/50 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-green-400 transition-colors">
            🎮 Minigame Arena
          </Link>
          <div className="flex items-center space-x-6">
            <span className="text-gray-400 text-sm hidden md:inline">Pay SOL • Play Games • Win Big</span>

            {connected && (
              <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <span className="text-green-400 font-semibold">
                  {isLoading ? "Loading..." : `${formatSol(balance)} SOL`}
                </span>
              </div>
            )}

            <div className="wallet-adapter-button-trigger">
              <WalletMultiButton className="!bg-green-600 hover:!bg-green-500 !text-black !px-6 !py-3 !rounded-lg !transition-all !font-semibold" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
