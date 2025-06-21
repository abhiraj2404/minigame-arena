export interface LeaderboardEntry {
  id: string;
  playerName: string;
  walletAddress?: string;
  score: number;
  timestamp: number;
  game: string;
}

export interface Tournament {
  id: string;
  game: string;
  startDate: number;
  endDate: number;
  keypair: string; // Serialized keypair
  publicKey: string;
  prizePool: number;
  entryFee: number;
  participants: number;
}
