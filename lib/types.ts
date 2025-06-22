export interface LeaderboardEntry {
  id: string;
  playerName: string;
  walletAddress: string;
  score: number;
  timestamp: number;
  game: string;
}

export interface Tournament {
  id: string;
  game: string;
  startDate: string;
  endDate: string;
  publicKey: string;
  prizePool: number;
  entryFee: number;
  participants: number;
  status?: string;
}

export interface User {
  id: string;
  playerName: string;
  walletAddress: string;
}
