import { Keypair } from "@solana/web3.js";
import type { Tournament } from "@/lib/types";
import { GAME_FEES } from "./constants";

// In a real app, this would be stored in a database
const tournaments: Record<string, Tournament> = {};

// Tournament duration in milliseconds (3 days)
const TOURNAMENT_DURATION = 3 * 24 * 60 * 60 * 1000;

// Initialize tournaments for each game
export function initializeTournaments() {
  Object.entries(GAME_FEES).forEach(([game, fees]) => {
    if (!tournaments[game]) {
      createNewTournament(game, fees);
    }
  });

  return tournaments;
}

// Create a new tournament for a game
export function createNewTournament(
  game: string,
  entryFee: number
): Tournament {
  const keypair = Keypair.generate();
  const now = Date.now();

  const tournament: Tournament = {
    id: `${game}-${now}`,
    game,
    startDate: now,
    endDate: now + TOURNAMENT_DURATION,
    keypair: JSON.stringify(Array.from(keypair.secretKey)),
    publicKey: keypair.publicKey.toString(),
    prizePool: 0,
    entryFee,
    participants: 0,
  };

  tournaments[game] = tournament;
  return tournament;
}

// Get current tournament for a game
export function getCurrentTournament(game: string): Tournament | null {
  try {
    const tournament = tournaments[game];

    // If tournament exists but has ended, create a new one
    if (tournament && Date.now() > tournament.endDate) {
      console.log(`Tournament for ${game} has ended, creating new one`);
      // In a real app, we would distribute the prize here
      return createNewTournament(game, tournament.entryFee);
    }

    return tournament || null;
  } catch (error) {
    console.error(`Error getting tournament for ${game}:`, error);
    return null;
  }
}

// Add entry fee to prize pool
export function addEntryFee(game: string, amount: number): void {
  const tournament = getCurrentTournament(game);
  if (tournament) {
    tournament.prizePool += amount;
    tournament.participants += 1;
    tournaments[game] = tournament;
  }
}

// Get tournament status message
export function getTournamentStatus(tournament: Tournament): string {
  const now = Date.now();
  const timeLeft = tournament.endDate - now;

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
initializeTournaments();
