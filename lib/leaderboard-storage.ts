interface LeaderboardEntry {
  id: string;
  playerName: string;
  walletAddress?: string; // Add wallet address field
  score: number;
  timestamp: number;
  game: string;
}

// Shared leaderboard storage (in production, use a database)
let globalLeaderboard: LeaderboardEntry[] = [
  // Snake scores
  {
    id: "1",
    playerName: "SwiftViper42",
    walletAddress: "8ZeT7LhQXDUK1og3EGXDpSAJh7QLgvNSL4JaPPEZ9Wof",
    score: 180,
    timestamp: Date.now() - 86400000, // 1 day ago
    game: "snake",
  },
  {
    id: "2",
    playerName: "MightyPython99",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 150,
    timestamp: Date.now() - 172800000, // 2 days ago
    game: "snake",
  },
  {
    id: "3",
    playerName: "CleverCobra7",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 120,
    timestamp: Date.now() - 259200000, // 3 days ago
    game: "snake",
  },
  {
    id: "4",
    playerName: "BoldSerpent23",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 90,
    timestamp: Date.now() - 345600000, // 4 days ago
    game: "snake",
  },
  {
    id: "5",
    playerName: "QuickMamba88",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 60,
    timestamp: Date.now() - 432000000, // 5 days ago
    game: "snake",
  },
  {
    id: "6",
    playerName: "FastAdder77",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 45,
    timestamp: Date.now() - 518400000, // 6 days ago
    game: "snake",
  },
  {
    id: "7",
    playerName: "WildAnaconda12",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 30,
    timestamp: Date.now() - 604800000, // 7 days ago
    game: "snake",
  },
  // Minesweeper wins
  {
    id: "8",
    playerName: "BombDefuser99",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 15,
    timestamp: Date.now() - 86400000, // 1 day ago
    game: "minesweeper",
  },
  {
    id: "9",
    playerName: "MineHunter42",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 12,
    timestamp: Date.now() - 172800000, // 2 days ago
    game: "minesweeper",
  },
  {
    id: "10",
    playerName: "SafeClicker7",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 8,
    timestamp: Date.now() - 259200000, // 3 days ago
    game: "minesweeper",
  },
  {
    id: "11",
    playerName: "LogicMaster23",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 6,
    timestamp: Date.now() - 345600000, // 4 days ago
    game: "minesweeper",
  },
  {
    id: "12",
    playerName: "ClearField88",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 4,
    timestamp: Date.now() - 432000000, // 5 days ago
    game: "minesweeper",
  },
  // Tetris scores
  {
    id: "13",
    playerName: "BlockMaster99",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 25000,
    timestamp: Date.now() - 86400000, // 1 day ago
    game: "tetris",
  },
  {
    id: "14",
    playerName: "LineClearer42",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 18500,
    timestamp: Date.now() - 172800000, // 2 days ago
    game: "tetris",
  },
  {
    id: "15",
    playerName: "TetrisKing7",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 15200,
    timestamp: Date.now() - 259200000, // 3 days ago
    game: "tetris",
  },
  {
    id: "16",
    playerName: "StackWizard23",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 12800,
    timestamp: Date.now() - 345600000, // 4 days ago
    game: "tetris",
  },
  {
    id: "17",
    playerName: "PuzzlePro88",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 9600,
    timestamp: Date.now() - 432000000, // 5 days ago
    game: "tetris",
  },
  {
    id: "18",
    playerName: "ShapeShifter55",
    walletAddress: "6Hs5rvQTLYbJDvHJPUzugVgEHVNEVaRRL9KoYiP4RKZX",
    score: 7400,
    timestamp: Date.now() - 518400000, // 6 days ago
    game: "tetris",
  },
];

export function getLeaderboard(game?: string, limit = 10): LeaderboardEntry[] {
  let filteredLeaderboard = globalLeaderboard;

  // Filter by game if specified
  if (game) {
    filteredLeaderboard = globalLeaderboard.filter(
      (entry) => entry.game === game
    );
  }

  // Sort by score (highest first) and limit results
  return filteredLeaderboard.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function addScore(
  playerName: string,
  score: number,
  game: string,
  walletAddress?: string // Add optional wallet address parameter
): {
  entry: LeaderboardEntry;
  rank: number;
  message: string;
} {
  // Validate input
  if (!playerName || typeof score !== "number" || score < 0) {
    throw new Error("Invalid player name or score");
  }

  console.log(
    `Adding score: ${playerName}, ${score}, ${game}, ${
      walletAddress || "no wallet"
    }`
  );

  // Check if player already exists for this game
  const existingEntryIndex = globalLeaderboard.findIndex(
    (entry) => entry.playerName === playerName && entry.game === game
  );

  let newEntry: LeaderboardEntry;

  if (existingEntryIndex !== -1) {
    // Update existing player's score if new score is higher (for snake/tetris) or always update (for minesweeper)
    const existingEntry = globalLeaderboard[existingEntryIndex];
    const shouldUpdate = game === "minesweeper" || score > existingEntry.score;

    if (shouldUpdate) {
      newEntry = {
        ...existingEntry,
        score:
          game === "minesweeper" ? score : Math.max(score, existingEntry.score),
        timestamp: Date.now(), // Update timestamp
        walletAddress: walletAddress || existingEntry.walletAddress, // Update wallet if provided
      };
      globalLeaderboard[existingEntryIndex] = newEntry;
    } else {
      // Keep existing higher score but update wallet if provided
      newEntry = {
        ...existingEntry,
        walletAddress: walletAddress || existingEntry.walletAddress,
      };
      globalLeaderboard[existingEntryIndex] = newEntry;
    }
  } else {
    // Create new entry
    newEntry = {
      id: Math.random().toString(36).substring(7),
      playerName,
      walletAddress: walletAddress || undefined,
      score,
      timestamp: Date.now(),
      game,
    };
    globalLeaderboard.push(newEntry);
  }

  // Sort and keep top 100 entries
  globalLeaderboard = globalLeaderboard
    .sort((a, b) => b.score - a.score)
    .slice(0, 100);

  // Calculate rank for this game
  const gameLeaderboard = getLeaderboard(game, 50);
  const rank =
    gameLeaderboard.findIndex((entry) => entry.id === newEntry.id) + 1;

  // Generate message based on rank and game
  let message = `Score submitted! You ranked #${rank} in ${game}`;

  if (game === "minesweeper") {
    const winsText = score === 1 ? "win" : "wins";
    if (rank === 1) {
      message = `🎉 New minesweeper champion! You're #1 with ${score} ${winsText}!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the minesweeper leaderboard with ${score} ${winsText}!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) with ${score} ${winsText}`;
    } else {
      message = `Win recorded! You have ${score} ${winsText} (Rank #${rank})`;
    }
  } else if (game === "tetris") {
    if (rank === 1) {
      message = `🎉 New Tetris champion! You're #1 with ${score.toLocaleString()} points!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the Tetris leaderboard with ${score.toLocaleString()} points!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) with ${score.toLocaleString()} points`;
    } else {
      message = `Score recorded! ${score.toLocaleString()} points (Rank #${rank})`;
    }
  } else if (game === "snake") {
    if (rank === 1) {
      message = `🎉 New ${game} high score! You're #1 on the leaderboard!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the ${game} leaderboard!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) in ${game}`;
    }
  }

  console.log(
    `New ${game} score: ${playerName} - ${score} ${
      game === "minesweeper" ? "wins" : "points"
    } (Rank #${rank})`
  );

  return {
    entry: newEntry,
    rank,
    message,
  };
}

export function getTopScore(game: string): number {
  const gameLeaderboard = getLeaderboard(game, 1);
  return gameLeaderboard.length > 0 ? gameLeaderboard[0].score : 0;
}

export function getPlayerRank(playerName: string, game: string): number {
  const gameLeaderboard = getLeaderboard(game, 50);
  const rank =
    gameLeaderboard.findIndex((entry) => entry.playerName === playerName) + 1;
  return rank || -1; // Return -1 if not found
}

export function getPlayerScore(playerName: string, game: string): number {
  const entry = globalLeaderboard.find(
    (entry) => entry.playerName === playerName && entry.game === game
  );
  return entry ? entry.score : 0;
}

export type { LeaderboardEntry };
