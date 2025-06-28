"use client";

import type React from "react";

import { useState, useEffect, useRef, useContext, useCallback } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { useWallet } from "@solana/wallet-adapter-react";
import GamePayment from "@/components/game-payment";
import { usePlayer } from "@/components/player-context";
import Leaderboard from "@/components/leaderboard";
import Tournament from "@/components/tournament";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Spinner } from "@/components/ui/spinner";

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
  row: number;
  col: number;
}

interface GameState {
  board: Cell[][];
  gameStatus: "waiting" | "ready" | "playing" | "won" | "lost";
  minesRemaining: number;
  totalWins: number;
  currentGameTime: number;
}

const BOARD_SIZE = 9;
const TOTAL_MINES = 10;

export default function MinesweeperPage() {
  const playerName = usePlayer().playerName as string;
  console.log("playername from minesweeper page:", playerName);
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    gameStatus: "waiting",
    minesRemaining: TOTAL_MINES,
    totalWins: 0,
    currentGameTime: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [gameTimer, setGameTimer] = useState<NodeJS.Timeout>();
  const [highScore, setHighScore] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { publicKey } = useWallet();
  const [showPayment, setShowPayment] = useState(true);
  const [showStartGameButton, setShowStartGameButton] = useState(false);

  const [loadingOverlay, setLoadingOverlay] = useState({ isLoading: false, text: "" });

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Submit win to backend
  const submitWin = async (playerName: string, timeTaken: number) => {
    try {
      setLoading(true);
      setLoadingOverlay({ isLoading: true, text: "Submitting" });
      const response = await fetch("/api/minesweeper/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerName,
          time: timeTaken,
          walletAddress: publicKey ? publicKey.toString() : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Win recorded!");

        // Immediately refresh leaderboard
        setTimeout(() => {
          triggerRefresh();
        }, 500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit win");
      }
    } catch (error) {
      console.error("Failed to submit win:", error);
      setError(`Failed to submit win: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setLoadingOverlay({ isLoading: false, text: "" });
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setMessage("Payment successful! You can now start the game.");
    setShowStartGameButton(true);
    setShowPayment(false);
    triggerRefresh();
    setGameState((gamestate) => ({
      ...gamestate,
      gameStatus: "ready"
    }));
  };

  const handleStartGameButton = () => {
    startGame();
    setShowStartGameButton(false);
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
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
            col
          }))
      );
  };

  // Generate board with mines (after first click)
  const generateBoardWithMines = (firstClickRow: number, firstClickCol: number): Cell[][] => {
    const board = generateEmptyBoard();

    // Place mines randomly, avoiding first click position
    const mines = new Set<string>();
    while (mines.size < TOTAL_MINES) {
      const row = Math.floor(Math.random() * BOARD_SIZE);
      const col = Math.floor(Math.random() * BOARD_SIZE);
      const pos = `${row}-${col}`;

      // Don't place mine on first click or adjacent cells
      if (Math.abs(row - firstClickRow) <= 1 && Math.abs(col - firstClickCol) <= 1) {
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
              if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol].isMine) {
                count++;
              }
            }
          }
          board[row][col].adjacentMines = count;
        }
      }
    }

    return board;
  };

  // Reveal cell and adjacent empty cells
  const revealCell = (board: Cell[][], row: number, col: number): Cell[][] => {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || board[row][col].isRevealed || board[row][col].isFlagged) {
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
  const startGame = () => {
    const newPlayerName = playerName;
    setGameState({
      board: generateEmptyBoard(),
      gameStatus: "playing",
      minesRemaining: TOTAL_MINES,
      totalWins: 0,
      currentGameTime: 0
    });
    setMessage("");
    setError("");

    // Start timer
    const startTime = Date.now();
    const timer = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        currentGameTime: Math.floor((Date.now() - startTime) / 1000)
      }));
    }, 1000);
    setGameTimer(timer);
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
            isRevealed: boardCell.isMine ? true : boardCell.isRevealed
          }))
        );

        // Stop timer
        if (gameTimer) {
          clearInterval(gameTimer);
        }

        return {
          ...prevState,
          board: gameOverBoard,
          gameStatus: "lost"
        };
      }

      // Reveal cell(s)
      newBoard = revealCell(newBoard, row, col);

      // Check win condition
      if (checkWinCondition(newBoard)) {
        // Stop timer
        if (gameTimer) {
          clearInterval(gameTimer);
        }

        // Submit win to backend (score = time taken)
        submitWin(playerName, prevState.currentGameTime + 1); // +1 to include the last second

        return {
          ...prevState,
          board: newBoard,
          gameStatus: "won"
        };
      }

      // Update mines remaining
      const flaggedMines = newBoard.flat().filter((cell) => cell.isFlagged).length;
      const minesRemaining = TOTAL_MINES - flaggedMines;

      return {
        ...prevState,
        board: newBoard,
        minesRemaining
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
      const newBoard = prevState.board.map((boardRow) => boardRow.map((boardCell) => ({ ...boardCell })));

      newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;

      const flaggedMines = newBoard.flat().filter((cell) => cell.isFlagged).length;
      const minesRemaining = TOTAL_MINES - flaggedMines;

      return {
        ...prevState,
        board: newBoard,
        minesRemaining
      };
    });
  };

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
        baseStyle += "bg-red-600 text-white border-red-500 shadow-lg shadow-red-500/50 ";
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
      baseStyle += "cursor-pointer bg-gray-700 hover:bg-gray-600 hover:border-green-400/50 hover:scale-105 active:scale-95 ";
      if (cell.isFlagged) {
        baseStyle += "bg-yellow-600 border-yellow-500 ";
      }
    }

    return baseStyle;
  };

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case "waiting":
        return "Pay to start playing";
      case "ready":
        return "Start the game";
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
      case "ready":
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

  // Handler to track loading state from children
  const handleChildLoading = useCallback((isLoading: boolean, text: string) => {
    setLoadingOverlay({ isLoading, text });
  }, []);

  return (
    <div className="relative max-w-7xl mx-auto space-y-8">
      {/* Loading Overlay */}
      {loadingOverlay.isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <BlurFade inView className="p-8 rounded-xl shadow-2xl">
            <span className="text-2xl font-bold text-green-400 animate-pulse flex flex-col items-center justify-center">
              <Spinner className="w-12 h-12 m-2" />
              {loadingOverlay.text}
            </span>
          </BlurFade>
        </div>
      )}
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white">💣 Minesweeper</h1>
        <p className="text-gray-300 text-lg">Clear the minefield and climb the leaderboard!</p>
        {message && <div className="bg-green-900/50 border border-green-500/50 rounded-lg p-3 text-green-200">{message}</div>}
        {error && <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-3 text-red-200">{error}</div>}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {/* Game Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-400 font-semibold">Best Time: {highScore > 0 ? formatTime(highScore) : "--:--"}</span>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold">Mines: {gameState.minesRemaining}</span>
                </div>
                {gameState.gameStatus === "playing" && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 font-semibold">Time: {formatTime(gameState.currentGameTime)}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {showPayment ? (
                  <div className="w-64">
                    <GamePayment game="minesweeper" onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError} />
                  </div>
                ) : showStartGameButton ? (
                  <ShimmerButton onClick={handleStartGameButton} disabled={loading} className="text-sm">
                    {loading ? "Submitting..." : "Start Game"}
                  </ShimmerButton>
                ) : gameState.gameStatus === "won" || gameState.gameStatus == "lost" ? (
                  <ShimmerButton
                    onClick={() => {
                      setShowPayment(true);
                      setMessage("");
                      setError("");
                      setGameState({
                        board: [],
                        gameStatus: "waiting",
                        minesRemaining: TOTAL_MINES,
                        totalWins: 0,
                        currentGameTime: 0
                      });
                    }}
                    disabled={loading}
                    className="text-sm"
                  >
                    Play Again
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
                        onContextMenu={(e) => handleRightClick(e, rowIndex, colIndex)}
                        disabled={gameState.gameStatus !== "playing" || cell.isRevealed}
                      >
                        {getCellContent(cell)}
                      </button>
                    ))
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400">Click 'Start Game'</div>
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

          <Tournament game="minesweeper" setError={setError} refreshTrigger={refreshTrigger} setLoadingOverlay={handleChildLoading} />

          {/* Leaderboard */}
          <Leaderboard
            game="minesweeper"
            setError={setError}
            gameState={gameState}
            highScore={highScore}
            setHighScore={setHighScore}
            refreshTrigger={refreshTrigger}
            setLoadingOverlay={handleChildLoading}
          />
        </div>
      </div>
    </div>
  );
}
