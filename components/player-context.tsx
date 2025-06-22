"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { generatePlayerName } from "@/lib/utils";

interface PlayerContextType {
  playerName: string | null;
  setPlayerName: (name: string) => void;
  walletAddress: string | null;
  user: any;
  loading: boolean;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
  const { publicKey, connected } = useWallet();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Register or fetch user on wallet connect
  useEffect(() => {
    const fetchOrRegisterUser = async () => {
      if (!connected || !publicKey) return;
      setLoading(true);
      const address = publicKey.toString();
      setWalletAddress(address);
      try {
        // Try to fetch user
        let res = await fetch(`/api/user?walletAddress=${address}`);
        let data = await res.json();
        if (res.ok && data.user) {
          setUser(data.user);
          setPlayerName(data.user.playerName);
        } else {
          // Generate random player name
          let name = generatePlayerName();

          let regRes = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName: name, walletAddress: address }),
          });
          let regData = await regRes.json();
          setUser(regData.user);
          setPlayerName(name);
        }
      } catch (e) {
        console.error("Failed to fetch/register user", e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrRegisterUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  return (
    <PlayerContext.Provider
      value={{ playerName, setPlayerName, walletAddress, user, loading }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
