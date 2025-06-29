"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider, useWallet } from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { endpoint } from "@/lib/solana-config";
import { Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BackpackWalletAdapter } from "@solana/wallet-adapter-backpack";

// Import wallet adapter CSS
import "@solana/wallet-adapter-react-ui/styles.css";

interface WalletContextState {
  balance: number;
  isLoading: boolean;
  refreshBalance: () => Promise<void>;
}

const WalletBalanceContext = createContext<WalletContextState>({
  balance: 0,
  isLoading: false,
  refreshBalance: async () => {}
});

export const useWalletBalance = () => useContext(WalletBalanceContext);

export function WalletBalanceProvider({ children }: { children: ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const connection = useMemo(() => new Connection(endpoint), []);

  const refreshBalance = async () => {
    if (!publicKey) {
      setBalance(0);
      return;
    }

    try {
      setIsLoading(true);
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance();
    } else {
      setBalance(0);
    }
  }, [connected, publicKey]);

  return <WalletBalanceContext.Provider value={{ balance, isLoading, refreshBalance }}>{children}</WalletBalanceContext.Provider>;
}

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  // Set up supported wallets
  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter(), new BackpackWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletBalanceProvider>{children}</WalletBalanceProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
