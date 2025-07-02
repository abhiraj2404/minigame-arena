import { Keypair } from "@solana/web3.js";
import type { Tournament } from "@/lib/types";
import { GAME_FEES } from "./constants";
import { supabase } from "./supabase";
import {
  Connection,
  Keypair as SolanaKeypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { solToLamports, endpoint } from "./solana-config";
import bs58 from "bs58";

// Tournament duration in milliseconds (3 days)
const TOURNAMENT_DURATION = 3 * 24 * 60 * 60 * 1000;

export async function getKeypairs(game: string) {
  let { data: keypair, error } = await supabase
    .from("keypairs")
    .select("*")
    .eq("game", game)
    .single();

  if (error) console.log("error fetching keypair: ", error);

  return keypair;
}

// Initialize tournaments for each game
export async function initializeTournaments() {
  Object.entries(GAME_FEES).forEach(async ([game, fees]) => {
    const tournament = await getCurrentTournament(game);
    if (!tournament) {
      await createNewTournament(game, fees);
    }
  });
}

// Create a new tournament for a game
export async function createNewTournament(
  game: string,
  entryFee: number
): Promise<any> {
  const keypair = await getKeypairs(game);
  const now = new Date();

  const { data, error } = await supabase
    .from("tournament")
    .insert([
      {
        game: game,
        startDate: now.toISOString(),
        endDate: new Date(now.getTime() + TOURNAMENT_DURATION).toISOString(),
        publicKey: keypair.publicKey,
        prizePool: 0,
        entryFee,
        participants: 0,
      },
    ])
    .select()
    .single();

  if (data) console.log("creating new tournament for: ", game);
  if (error) console.log("error in creating new tournament", error);

  return data;
}

// Get current tournament for a game
export async function getCurrentTournament(
  game: string
): Promise<Tournament | null> {
  try {
    let { data: tournament, error } = await supabase
      .from("tournament")
      .select("*")
      .eq("game", game)
      .maybeSingle();

   
    if (error) console.log("error fetching current tournament: ", error);

    // If tournament exists but has ended, create a new one
    if (tournament && Date.now() > new Date(tournament.endDate).getTime()) {
      console.log(`Tournament for ${game} has ended, creating new one`);
      // In a real app, we would distribute the prize here
      return await createNewTournament(game, tournament.entryFee);
    }

    return tournament || null;
  } catch (error) {
    console.error(`Error getting tournament for ${game}:`, error);
    return null;
  }
}

// Add entry fee to prize pool
export async function addEntryFee(game: string, amount: number): Promise<void> {
  const tournament = await getCurrentTournament(game);
  if (tournament) {
    tournament.prizePool += amount;
    tournament.participants += 1;

    const { data, error } = await supabase
      .from("tournament")
      .update({
        prizePool: tournament.prizePool,
        participants: tournament.participants,
      })
      .eq("id", tournament.id)
      .select();

  
    if (error) console.error("Error adding entry fee:", error);
  }
}

// Get tournament status message
export function getTournamentStatus(tournament: Tournament): string {
  const now = Date.now();
  const timeLeft = new Date(tournament.endDate).getTime() - now;

  if (timeLeft <= 0) {
    return "Tournament ended";
  }

  // Format time left
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m left`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  } else {
    return `${minutes}m left`;
  }
}

// Fetch all tournaments
export async function getAllTournaments(): Promise<Tournament[]> {
  const { data, error } = await supabase.from("tournament").select("*");
  if (error) {
    console.error("Error fetching all tournaments:", error);
    return [];
  }
  return data || [];
}

// Send SOL from a tournament keypair to a winner
export async function sendPrizeToWinner({
  fromSecretKey,
  toPublicKey,
  amountSol,
}: {
  fromSecretKey: Uint8Array | number[] | string;
  toPublicKey: string;
  amountSol: number;
}): Promise<string | null> {
  try {
    const connection = new Connection(endpoint, "confirmed");
    let secretKeyUint8: Uint8Array;
    if (typeof fromSecretKey === "string") {
      // Assume base58 encoded
      secretKeyUint8 = bs58.decode(fromSecretKey);
    } else if (Array.isArray(fromSecretKey)) {
      secretKeyUint8 = Uint8Array.from(fromSecretKey);
    } else {
      secretKeyUint8 = fromSecretKey;
    }
    const from = SolanaKeypair.fromSecretKey(secretKeyUint8);
    const to = new PublicKey(toPublicKey);
    const lamports = solToLamports(amountSol);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports,
      })
    );

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);
    return signature;
  } catch (error) {
    console.error("Error sending prize to winner:", error);
    return null;
  }
}

export async function resetTournament(game: string) {

  console.log(`deleting tournament for ${game}`)
  // Delete the old tournament before creating a new one
  const { data, error } = await supabase
    .from("tournament")
    .delete()
    .eq("game", game);

  if (data) console.log(data);
  if (error) console.log(error);

  // Immediately create a new tournament for this game
  const entryFee = GAME_FEES[game as keyof typeof GAME_FEES];
  await createNewTournament(game, entryFee);
}

// Initialize tournaments on module load
// initializeTournaments();
