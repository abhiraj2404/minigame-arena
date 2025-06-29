"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from "@gorbagana/web3.js";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { endpoint, formatSol } from "@/lib/solana-config";
import { GAME_FEES } from "@/lib/constants";
import { useWalletBalance } from "./wallet-provider";

interface GamePaymentProps {
  game: string;
  onPaymentSuccess: () => void;
  onPaymentError: (error: string) => void;
}

const DEVELOPMENT_MODE = process.env.NEXT_PUBLIC_ENVIRONMENT === "development";

export default function GamePayment({ game, onPaymentSuccess, onPaymentError }: GamePaymentProps) {
  const { publicKey, sendTransaction } = useWallet();
  const { balance, refreshBalance } = useWalletBalance();
  const [loading, setLoading] = useState(false);

  // Get entry fee for the game
  const entryFee = GAME_FEES[game as keyof typeof GAME_FEES] || 0.1;

  // Handle payment
  const handlePayment = async () => {
    if (!publicKey) {
      onPaymentError("Wallet not connected");
      return;
    }

    // Skip payment in development mode
    if (DEVELOPMENT_MODE) {
      console.log("Development mode: Skipping payment");
      onPaymentSuccess();
      return;
    }

    try {
      setLoading(true);

      // Check if user has enough balance
      if (balance < entryFee) {
        throw new Error(`Insufficient balance. You need at least ${formatSol(entryFee)} GOR`);
      }

      // Fetch tournament data to get the public key
      const tournamentResponse = await fetch(`/api/tournaments?game=${game}`);
      if (!tournamentResponse.ok) {
        throw new Error("Failed to fetch tournament data");
      }

      const tournamentData = await tournamentResponse.json();
      const tournament = tournamentData.tournament;

      if (!tournament) {
        throw new Error("No active tournament found");
      }

      const connection = new Connection(endpoint, "confirmed");
      const tournamentPublicKey = new PublicKey(tournament.publicKey);

      // Create transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: tournamentPublicKey,
          lamports: entryFee * LAMPORTS_PER_SOL
        })
      );

      // Set recent blockhash and fee payer
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      console.log("transaction sent: ", signature);

      // Wait for confirmation
      const confirmationStrategy = {
        signature,
        blockhash,
        lastValidBlockHeight
      };

      const txDetails = await connection.getConfirmedTransaction(signature, "confirmed");
      console.log("txn details fetched: ", txDetails);
      console.log(txDetails?.meta?.err ? "Failed" : "Success");

      // Register entry with backend
      const entryResponse = await fetch("/api/tournaments/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          game,
          playerWallet: publicKey.toString()
        })
      });

      if (!entryResponse.ok) {
        throw new Error("Failed to register tournament entry");
      }

      // Refresh balance
      await refreshBalance();

      // Notify success
      onPaymentSuccess();
    } catch (error) {
      console.error("Payment error:", error);
      onPaymentError(error instanceof Error ? error.message : "Payment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <ShimmerButton onClick={handlePayment} disabled={loading || !publicKey} className="w-full">
        {loading
          ? "Processing..."
          : !publicKey
          ? "Connect Wallet to Play"
          : DEVELOPMENT_MODE
          ? "Start Game (Dev Mode)"
          : `Pay ${entryFee} GOR to Play`}
      </ShimmerButton>
    </div>
  );
}
