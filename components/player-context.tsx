"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { generatePlayerName } from "@/lib/utils";

interface PlayerContextType {
  playerName: string | null;
  setPlayerName: (name: string) => void;
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("useEffect in player-context ran");
    const fetchOrRegisterPlayerName = async () => {
      console.log("inside fetchOrRegisterPlayerName");
      if (!connected || !publicKey) {
        setPlayerName(null);
        return;
      }
      setLoading(true);
      const address = publicKey.toString();
      try {
        // Try to fetch playerName
        let res = await fetch(`/api/user?walletAddress=${address}`);
        let data = await res.json();
        console.log("data", data);
        if (res.ok && data.user.playerName) {
          setPlayerName(data.user.playerName);
        } else {
          // Generate random player name
          console.log("generating random player name");
          let name = generatePlayerName();
          let regRes = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerName: name, walletAddress: address })
          });
          let regData = await regRes.json();
          setPlayerName(regData.user.playerName);
        }
      } catch (e) {
        console.error("Failed to fetch/register playerName", e);
        setPlayerName(null);
      } finally {
        setLoading(false);
      }
    };
    fetchOrRegisterPlayerName();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, publicKey]);

  return <PlayerContext.Provider value={{ playerName, setPlayerName, loading }}>{children}</PlayerContext.Provider>;
};
