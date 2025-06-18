"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { useWallet } from "@solana/wallet-adapter-react";
import GamePayment from "@/components/game-payment";
import { formatSol } from "@/lib/solana-config";

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  row: number;
  col: number;
}

interface LeaderboardEntry {
  id: string;
  playerName: string;
  walletAddress?: string;
  score: number;
  timestamp: number;
  game: string;
}

interface Tournament {
  id: string;
  game: string;
  publicKey: string;
  prizePool: number;
  entryFee: number;
  participants: number;
  status: string;
  endDate: number; // Change from endsAt to endDate
}

interface GameState {
  board: Cell[][];
  gameStatus: "waiting" | "playing" | "won" | "lost";
  minesRemaining: number;
  playerName: string;
  totalWins: number;
  currentGameTime: number;
}

const BOARD_SIZE = 9;
const TOTAL_MINES = 10;

// Generate random player names
const ADJECTIVES = [
  "Swift",
  "Clever",
  "Sharp",
  "Quick",
  "Smart",
  "Bold",
  "Wise",
  "Safe",
  "Lucky",
  "Expert",
];
const NOUNS = [
  "Defuser",
  "Hunter",
  "Clicker",
  "Sweeper",
  "Detective",
  "Master",
  "Solver",
  "Finder",
  "Clearer",
  "Hero",
];

const generatePlayerName = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjective}${noun}${number}`;
};

const formatWalletAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export default function MinesweeperPage() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    gameStatus: "waiting",
    minesRemaining: TOTAL_MINES,
    playerName: generatePlayerName(),
    totalWins: 0,
    currentGameTime: 0,
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout>();
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const tournamentUpdateRef = useRef<NodeJS.Timeout>();

  const { publicKey } = useWallet();
  const [showPayment, setShowPayment] = useState(false);

  // Load tournament data
  const loadTournament = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch("/api/tournaments?game=minesweeper");
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
        setLastUpdateTime(Date.now());
        console.log("Minesweeper tournament loaded:", data.tournament);
      } else {
        console.error("Failed to load tournament data");
      }
    } catch (error) {
      console.error("Error loading tournament:", error);
      if (showLoading) {
        setError("Failed to load leaderboard");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch("/api/minesweeper/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
        setLastUpdateTime(Date.now());
        console.log(
          "Minesweeper leaderboard updated:",
          data.leaderboard?.length || 0,
          "entries"
        );
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
      if (showLoading) {
        setError("Failed to load leaderboard");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Submit win to backend
  const submitWin = async (playerName: string, totalWins: number) => {
    try {
      setLoading(true);
      console.log(`Submitting win: ${playerName} - ${totalWins} total wins`);

      const response = await fetch("/api/minesweeper/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          wins: totalWins,
          walletAddress: publicKey ? publicKey.toString() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Win recorded!");

        // Immediately refresh leaderboard
        setTimeout(() => {
          loadLeaderboard();
        }, 500);

        console.log(`Win submitted successfully. Rank: #${data.rank}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit win");
      }
    } catch (error) {
      console.error("Failed to submit win:", error);
      setError(
        `Failed to submit win: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setShowPayment(false);
    startNewGame();
    setMessage("Payment successful! Game started.");
    loadTournament();
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Start new game (now requires payment)
  const initiateGame = () => {
    if (!publicKey) {
      setError("Please connect your wallet to play");
      return;
    }
    setShowPayment(true);
  };

  // Generate empty board
  const generateEmptyBoard = (): Cell[][] => {
    return Array(BOARD_SIZE)
      .fill(null)
      .map((_, row) =>
        Array(BOARD_SIZE)
          .fill(null)
          .map((_, col) => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
            row,
            col,
          }))
      );
  };

  // Generate board with mines (after first click)
  const generateBoardWithMines = (
    firstClickRow: number,
    firstClickCol: number
  ): Cell[][] => {
    const board = generateEmptyBoard();

    // Place mines randomly, avoiding first click position
    const mines = new Set<string>();
    while (mines.size < TOTAL_MINES) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const pos = `${row}-${col}`;

      // Don't place mine on first click or adjacent cells
      if (
        Math.abs(row - firstClickRow) <= 1 &&
        Math.abs(col - firstClickCol) <= 1
      ) {
        continue;
      }

      mines.add(pos);
    }

    // Set mines
    mines.forEach((pos) => {
      const [row, col] = pos.split("-").map(Number);
      board[row][col].isMine = true;
    });

    // Calculate adjacent mine counts
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!board[row][col].isMine) {
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              const newRow = row + dr;
              const newCol = col + dc;
              if (
                newRow >= 0 &&
                newRow < BOARD_SIZE &&
                newCol >= 0 &&
                newCol < BOARD_SIZE &&
                board[newRow][newCol].isMine
              ) {
                count++;
              }
            }
          }
          board[row][col].adjacentMines = count;
        }
      }
    }

    console.log(
      "Generated board with mines at:",
      board
        .flatMap((row, r) =>
          row.map((cell, c) => (cell.isMine ? `${r},${c}` : null))
        )
        .filter(Boolean)
    );

    return board;
  };

  // Reveal cell and adjacent empty cells
  const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
    if (
      row < 0 ||
      row >= BOARD_SIZE ||
      col < 0 ||
      col >= BOARD_SIZE ||
      board[row][col].isRevealed ||
      board[row][col].isFlagged
    ) {
      return board;
    }

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    newBoard[row][col].isRevealed = true;

    // If cell has no adjacent mines, reveal all adjacent cells
    if (newBoard[row][col].adjacentMines === 0 && !newBoard[row][col].isMine) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const newBoard2 = revealCell(newBoard, row + dr, col + dc);
          // Copy revealed states back
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (newBoard2[r][c].isRevealed && !newBoard[r][c].isRevealed) {
                newBoard[r][c].isRevealed = true;
              }
            }
          }
        }
      }
    }

    return newBoard;
  };

  // Check win condition
  const checkWinCondition = (board: Cell[][]): boolean => {
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!board[row][col].isMine && !board[row][col].isRevealed) {
          return false;
        }
      }
    }
    return true;
  };

  // Start new game
  const startNewGame = () => {
    const newPlayerName = generatePlayerName();
    setGameState({
      board: generateEmptyBoard(),
      gameStatus: "playing",
      minesRemaining: TOTAL_MINES,
      playerName: newPlayerName,
      totalWins: 0,
      currentGameTime: 0,
    });
    setMessage("");
    setError("");

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        currentGameTime: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);
    setGameTimer(timer);

    console.log(`New minesweeper game started for player: ${newPlayerName}`);
  };

  // Handle cell click
  const handleCellClick = (row: number, col: number) => {
    if (gameState.gameStatus !== "playing" || loading) return;

    const cell = gameState.board[row]?.[col];
    if (!cell || cell.isRevealed || cell.isFlagged) return;

    setGameState((prevState) => {
      let newBoard = [...prevState.board];

      // First click - generate board with mines
      if (newBoard.every((row) => row.every((cell) => !cell.isMine))) {
        newBoard = generateBoardWithMines(row, col);
      }

      // Check if clicked on mine
      if (newBoard[row][col].isMine) {
        // Game over - reveal all mines
        const gameOverBoard = newBoard.map((boardRow) =>
          boardRow.map((boardCell) => ({
            ...boardCell,
            isRevealed: boardCell.isMine ? true : boardCell.isRevealed,
          }))
        );

        // Stop timer
        if (gameTimer) {
          clearInterval(gameTimer);
        }

        return {
          ...prevState,
          board: gameOverBoard,
          gameStatus: "lost",
        };
      }

      // Reveal cell(s)
      newBoard = revealCell(newBoard, row, col);

      // Check win condition
      if (checkWinCondition(newBoard)) {
        const newTotalWins = prevState.totalWins + 1;

        // Stop timer
        if (gameTimer) {
          clearInterval(gameTimer);
        }

        // Submit win to backend
        submitWin(prevState.playerName, newTotalWins);

        return {
          ...prevState,
          board: newBoard,
          gameStatus: "won",
          totalWins: newTotalWins,
        };
      }

      // Update mines remaining
      const flaggedMines = newBoard
        .flat()
        .filter((cell) => cell.isFlagged).length;
      const minesRemaining = TOTAL_MINES - flaggedMines;

      return {
        ...prevState,
        board: newBoard,
        minesRemaining,
      };
    });
  };

  // Handle right click (flag)
  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();

    if (gameState.gameStatus !== "playing" || loading) return;

    const cell = gameState.board[row]?.[col];
    if (!cell || cell.isRevealed) return;

    setGameState((prevState) => {
      const newBoard = prevState.board.map((boardRow) =>
        boardRow.map((boardCell) => ({ ...boardCell }))
      );

      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;

      const flaggedMines = newBoard
        .flat()
        .filter((cell) => cell.isFlagged).length;
      const minesRemaining = TOTAL_MINES - flaggedMines;

      return {
        ...prevState,
        board: newBoard,
        minesRemaining,
      };
    });
  };

  // Load tournament and leaderboard on mount
  useEffect(() => {
    loadTournament();
    loadLeaderboard(true);

    return () => {
      if (tournamentUpdateRef.current) {
        clearInterval(tournamentUpdateRef.current);
      }
    };
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (gameTimer) {
        clearInterval(gameTimer);
      }
    };
  }, [gameTimer]);

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return "🚩";
    if (!cell.isRevealed) return "";
    if (cell.isMine) return "💣";
    if (cell.adjacentMines > 0) return cell.adjacentMines.toString();
    return "";
  };

  const getCellStyle = (cell: Cell) => {
    let baseStyle =
      "w-10 h-10 border border-white/20 flex items-center justify-center text-sm font-bold transition-all duration-200 select-none ";

    if (cell.isRevealed) {
      baseStyle += "cursor-default ";
      if (cell.isMine) {
        baseStyle +=
          "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/50 ";
      } else {
        baseStyle += "bg-gray-800 border-green-500/30 ";
        // Color code numbers
        if (cell.adjacentMines === 1) baseStyle += "text-blue-400 ";
        else if (cell.adjacentMines === 2) baseStyle += "text-green-400 ";
        else if (cell.adjacentMines === 3) baseStyle += "text-red-400 ";
        else if (cell.adjacentMines === 4) baseStyle += "text-purple-400 ";
        else if (cell.adjacentMines === 5) baseStyle += "text-yellow-400 ";
        else if (cell.adjacentMines === 6) baseStyle += "text-pink-400 ";
        else if (cell.adjacentMines === 7) baseStyle += "text-white ";
        else if (cell.adjacentMines === 8) baseStyle += "text-gray-400 ";
      }
    } else {
      baseStyle +=
        "cursor-pointer bg-gray-700 hover:bg-gray-600 hover:border-green-400/50 hover:scale-105 active:scale-95 ";
      if (cell.isFlagged) {
        baseStyle += "bg-yellow-600 border-yellow-500 ";
      }
    }

    return baseStyle;
  };

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case "waiting":
        return "Click 'New Game' to start";
      case "playing":
        return "Left click to reveal, right click to flag";
      case "won":
        return "🎉 Victory! You cleared the minefield!";
      case "lost":
        return "💥 Game Over! You hit a mine!";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (gameState.gameStatus) {
      case "waiting":
        return "text-gray-400";
      case "playing":
        return "text-green-400";
      case "won":
        return "text-green-400";
      case "lost":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatTimeRemaining = (endDate: number) => {
    const now = Date.now();
    const diff = endDate - now;

    if (diff <= 0) return "Tournament ended";

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h ${minutes}m left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const shouldShowNewGameButton = () => {
    return (
      gameState.gameStatus === "waiting" ||
      gameState.gameStatus === "won" ||
      gameState.gameStatus === "lost"
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white">💣 Minesweeper</h1>
        <p className="text-gray-300 text-lg">
          Clear the minefield and climb the leaderboard!
        </p>
        {message && (
          <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3 text-green-200">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-red-200">
            {error}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {/* Game Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <span className="text-green-400 font-semibold">
                    Player: {gameState.playerName}
                  </span>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-400 font-semibold">
                    Wins: {gameState.totalWins}
                  </span>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold">
                    Mines: {gameState.minesRemaining}
                  </span>
                </div>
                {gameState.gameStatus === "playing" && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 font-semibold">
                      Time: {formatTime(gameState.currentGameTime)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {showPayment ? (
                  <div className="w-64">
                    <GamePayment
                      game="minesweeper"
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                ) : shouldShowNewGameButton() ? (
                  <ShimmerButton
                    onClick={initiateGame}
                    disabled={loading}
                    className="text-sm"
                  >
                    {loading ? "Submitting..." : "New Game"}
                  </ShimmerButton>
                ) : null}
              </div>
            </div>

            {/* Status */}
            <div className={`text-center mb-4 ${getStatusColor()}`}>
              <span className="font-semibold">{getStatusMessage()}</span>
            </div>

            {/* Game Board */}
            <div className="flex justify-center">
              {gameState.board.length > 0 ? (
                <div className="grid grid-cols-9 gap-1 p-6 bg-black/50 rounded-xl border border-white/10">
                  {gameState.board.map((row, rowIndex) =>
                    row.map((cell, colIndex) => (
                      <button
                        key={`${rowIndex}-${colIndex}`}
                        className={getCellStyle(cell)}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        onContextMenu={(e) =>
                          handleRightClick(e, rowIndex, colIndex)
                        }
                        disabled={
                          gameState.gameStatus !== "playing" || cell.isRevealed
                        }
                      >
                        {getCellContent(cell)}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">
                  Click 'New Game' to start playing
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="mt-6 text-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-300 text-sm">
                <div>
                  <p className="font-semibold text-white mb-1">Reveal</p>
                  <p>Left Click</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Flag</p>
                  <p>Right Click</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Goal</p>
                  <p>Clear all non-mines</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Avoid</p>
                  <p>Mines (💣)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament & Leaderboard */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tournament Info */}
          {tournament && (
            <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white">
                  🏆 Current Tournament
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {lastUpdateTime > 0 && formatTimeAgo(lastUpdateTime)}
                  </span>
                  <button
                    onClick={() => {
                      loadTournament(true);
                      loadLeaderboard(true);
                    }}
                    disabled={loading}
                    className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                    title="Refresh leaderboard"
                  >
                    <svg
                      className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Entry Fee:</span>
                  <span className="text-green-400 font-bold">
                    {formatSol(tournament.entryFee)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Prize Pool:</span>
                  <span className="text-blue-400 font-bold">
                    {formatSol(tournament.prizePool)} SOL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Participants:</span>
                  <span className="text-purple-400 font-bold">
                    {tournament.participants}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Time Left:</span>
                  <span className="text-yellow-400 font-bold">
                    {formatTimeRemaining(tournament.endDate)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">🏆 Leaderboard</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {lastUpdateTime > 0 && formatTimeAgo(lastUpdateTime)}
                </span>
                <button
                  onClick={() => {
                    loadTournament(true);
                    loadLeaderboard(true);
                  }}
                  disabled={loading}
                  className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                  title="Refresh leaderboard"
                >
                  <svg
                    className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-300 ${
                      entry.playerName === gameState.playerName &&
                      gameState.gameStatus === "won"
                        ? "bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30"
                        : index === 0
                        ? "bg-yellow-500/10 border-yellow-500/30"
                        : index === 1
                        ? "bg-gray-400/10 border-gray-400/30"
                        : index === 2
                        ? "bg-orange-500/10 border-orange-500/30"
                        : "bg-gray-800/50 border-gray-700/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? "bg-yellow-500 text-black"
                            : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                            ? "bg-orange-500 text-black"
                            : "bg-gray-700 text-white"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {entry.playerName}
                        </p>
                        {entry.walletAddress && (
                          <p className="text-gray-500 text-xs">
                            {formatWalletAddress(entry.walletAddress)}
                          </p>
                        )}
                        <p className="text-gray-400 text-xs">
                          {formatTimeAgo(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-green-400 font-bold">{entry.score}</p>
                      <p className="text-gray-500 text-xs">
                        {entry.score === 1 ? "win" : "wins"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No wins yet!</p>
                  <p className="text-sm">Be the first to clear a minefield!</p>
                </div>
              )}
            </div>

            {gameState.totalWins > 0 && gameState.gameStatus === "won" && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm text-center">
                  Total wins:{" "}
                  <span className="font-bold">{gameState.totalWins}</span>
                  {gameState.totalWins === 1 && (
                    <span className="block text-yellow-400 font-bold">
                      🎉 First Win!
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
