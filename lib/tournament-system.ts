import { Keypair } from "@solana/web3.js";
import type { Tournament } from "@/lib/types";
import { GAME_FEES } from "./constants";
import { supabase } from "./supabase";

// Tournament duration in milliseconds (3 days)
const TOURNAMENT_DURATION = 3 * 24 * 60 * 60 * 1000;

export async function getKeypairs(game: string) {
  let { data: keypair, error } = await supabase
    .from("keypairs")
    .select("*")
    .eq("game", game)
    .single();
  if (keypair) console.log("keypair: ", keypair);
  if (error) console.log("error fetching keypair: ", error);

  return keypair;
}

// Initialize tournaments for each game
export function initializeTournaments() {
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

  if (data) console.log("creating new tournament", data);
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

    if (tournament) console.log("current tournament : ", tournament);
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

    if (data) console.log("added entry fee: ", data);
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

// Initialize tournaments on module load
// initializeTournaments();
