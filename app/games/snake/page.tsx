"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { useWallet } from "@solana/wallet-adapter-react";
import GamePayment from "@/components/game-payment";
import type { LeaderboardEntry, Tournament } from "@/lib/types";
import { generatePlayerName } from "@/lib/utils";
import { formatSol } from "@/lib/solana-config";

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Position;
  gameStatus: "waiting" | "ready" | "playing" | "paused" | "gameOver";
  score: number;
  playerName: string;
}

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

const formatWalletAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};

export default function SnakePage() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: INITIAL_FOOD,
    direction: INITIAL_DIRECTION,
    gameStatus: "waiting",
    score: 0,
    playerName: generatePlayerName(),
  });

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [highScore, setHighScore] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  const { publicKey } = useWallet();
  const [showPayment, setShowPayment] = useState(true);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leaderboardUpdateRef = useRef<NodeJS.Timeout>();
  const tournamentUpdateRef = useRef<NodeJS.Timeout>();

  // Load tournament data
  const loadTournament = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch("/api/tournaments?game=snake");
      if (response.ok) {
        const data = await response.json();
        setTournament(data.tournament);
        setLastUpdateTime(Date.now());
        console.log("Snake tournament loaded:", data.tournament);
      } else {
        console.error("Failed to load tournament data");
      }
    } catch (error) {
      console.error("Error loading tournament:", error);
      if (showLoading) {
        setError("Failed to load tournament");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Load leaderboard
  const loadLeaderboard = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch("/api/snake/leaderboard");
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);

        // Update high score
        if (data.leaderboard && data.leaderboard.length > 0) {
          setHighScore(data.leaderboard[0].score);
        }

        setLastUpdateTime(Date.now());
        console.log(
          "Leaderboard updated:",
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

  // Submit score to backend and update leaderboard
  const submitScore = async (score: number, playerName: string) => {
    if (score === 0) return; // Don't submit zero scores

    try {
      setLoading(true);
      console.log(`Submitting score: ${playerName} - ${score}`);

      const response = await fetch("/api/snake/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          playerName,
          score,
          walletAddress: publicKey ? publicKey.toString() : undefined,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Score submitted!");

        // Immediately refresh leaderboard to show new score
        setTimeout(() => {
          loadLeaderboard();
        }, 500);

        console.log(`Score submitted successfully. Rank: #${data.rank}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit score");
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      setError(
        `Failed to submit score: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setMessage("Payment successful! You can now start the game.");
    setShowPayment(false);
    setGameState((gamestate) => ({
      ...gamestate,
      gameStatus: "ready",
    }));
  };

  const handleStartGameButton = () => {
    loadTournament(true);
    startGame();
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Auto-refresh leaderboard every 30 seconds
  useEffect(() => {
    loadTournament(true);
    loadLeaderboard(true);

    // Auto-refresh tournament data every 30 seconds
    const startTournamentRefresh = () => {
      tournamentUpdateRef.current = setInterval(() => {
        loadTournament();
      }, 15000); // 15 seconds
    };

    startTournamentRefresh();

    const startAutoRefresh = () => {
      leaderboardUpdateRef.current = setInterval(() => {
        loadLeaderboard();
      }, 15000); // 15 seconds
    };

    startAutoRefresh();

    return () => {
      if (tournamentUpdateRef.current) {
        clearInterval(tournamentUpdateRef.current);
      }
      if (leaderboardUpdateRef.current) {
        clearInterval(leaderboardUpdateRef.current);
      }
    };
  }, []);

  // Generate random food position
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, []);

  // Game logic
  const moveSnake = useCallback(() => {
    setGameState((prevState) => {
      if (prevState.gameStatus !== "playing") return prevState;

      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };

      // Move head
      head.x += prevState.direction.x;
      head.y += prevState.direction.y;

      // Check wall collision
      if (
        head.x < 0 ||
        head.x >= BOARD_SIZE ||
        head.y < 0 ||
        head.y >= BOARD_SIZE
      ) {
        // Game over
        console.log(
          `Game over - wall collision. Final score: ${prevState.score}`
        );
        submitScore(prevState.score, prevState.playerName);
        return {
          ...prevState,
          gameStatus: "gameOver",
        };
      }

      // Check self collision
      if (
        newSnake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        // Game over
        console.log(
          `Game over - self collision. Final score: ${prevState.score}`
        );
        submitScore(prevState.score, prevState.playerName);
        return {
          ...prevState,
          gameStatus: "gameOver",
        };
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        // Eat food - don't remove tail, generate new food
        const newFood = generateFood(newSnake);
        const newScore = prevState.score + 10;

        console.log(`Food eaten! New score: ${newScore}`);

        return {
          ...prevState,
          snake: newSnake,
          food: newFood,
          score: newScore,
        };
      } else {
        // Normal move - remove tail
        newSnake.pop();
        return {
          ...prevState,
          snake: newSnake,
        };
      }
    });
  }, [generateFood]);

  // Start game
  const startGame = () => {
    const newPlayerName = generatePlayerName();
    setGameState({
      snake: INITIAL_SNAKE,
      food: generateFood(INITIAL_SNAKE),
      direction: INITIAL_DIRECTION,
      gameStatus: "playing",
      score: 0,
      playerName: newPlayerName,
    });
    setMessage("");
    setError("");
    console.log(`New game started for player: ${newPlayerName}`);
  };

  // Pause/Resume game
  const togglePause = () => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: prev.gameStatus === "playing" ? "paused" : "playing",
    }));
  };

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.gameStatus !== "playing") return;

      let newDirection = { ...gameState.direction };

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (gameState.direction.y === 0) newDirection = { x: 0, y: -1 };
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (gameState.direction.y === 0) newDirection = { x: 0, y: 1 };
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (gameState.direction.x === 0) newDirection = { x: -1, y: 0 };
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (gameState.direction.x === 0) newDirection = { x: 1, y: 0 };
          break;
        case " ":
          e.preventDefault();
          togglePause();
          return;
      }

      setGameState((prev) => ({ ...prev, direction: newDirection }));
    },
    [gameState.gameStatus, gameState.direction]
  );

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus === "playing") {
      gameLoopRef.current = setInterval(moveSnake, 150);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.gameStatus, moveSnake]);

  // Keyboard event listeners
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = "#1f2937";
    ctx.lineWidth = 1;
    for (let i = 0; i <= BOARD_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 20, 0);
      ctx.lineTo(i * 20, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * 20);
      ctx.lineTo(canvas.width, i * 20);
      ctx.stroke();
    }

    // Draw snake
    gameState.snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#22c55e" : "#16a34a";
      ctx.fillRect(segment.x * 20 + 1, segment.y * 20 + 1, 18, 18);

      // Add eyes to head
      if (index === 0) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(segment.x * 20 + 5, segment.y * 20 + 5, 3, 3);
        ctx.fillRect(segment.x * 20 + 12, segment.y * 20 + 5, 3, 3);
      }
    });

    // Draw food
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(gameState.food.x * 20 + 1, gameState.food.y * 20 + 1, 18, 18);

    // Add shine to food
    ctx.fillStyle = "#fca5a5";
    ctx.fillRect(gameState.food.x * 20 + 3, gameState.food.y * 20 + 3, 6, 6);
  }, [gameState.snake, gameState.food]);

  // Load tournament and leaderboard on mount
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

  useEffect(() => {
    loadTournament(true);
    loadLeaderboard(true);
  }, []);

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case "waiting":
        return "Pay to start playing";
      case "ready":
        return "Start the game";
      case "playing":
        return "Use arrow keys or WASD to move";
      case "paused":
        return "Game paused - Press SPACE to resume";
      case "gameOver":
        return "Game Over! Click 'Start Game' to play again";
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
      case "paused":
        return "text-yellow-400";
      case "gameOver":
        return "text-red-400";
      default:
        return "text-gray-300";
    }
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold text-white">🐍 Snake</h1>
        <p className="text-gray-300 text-lg">
          Grow your snake and climb the leaderboard!
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
                    Score: {gameState.score}
                  </span>
                </div>
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold">
                    Length: {gameState.snake.length}
                  </span>
                </div>
                {highScore > 0 && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 font-semibold">
                      High: {highScore}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {showPayment ? (
                  <div className="w-64">
                    <GamePayment
                      game="snake"
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                    />
                  </div>
                ) : gameState.gameStatus == "gameOver" ? (
                  <ShimmerButton
                    onClick={() => {
                      setShowPayment(true);
                      setGameState({
                        snake: INITIAL_SNAKE,
                        food: INITIAL_FOOD,
                        direction: INITIAL_DIRECTION,
                        gameStatus: "waiting",
                        score: 0,
                        playerName: generatePlayerName(),
                      });
                    }}
                    disabled={loading}
                    className="text-sm"
                  >
                    Play Again
                  </ShimmerButton>
                ) : gameState.gameStatus === "waiting" ||
                  gameState.gameStatus === "ready" ? (
                  <ShimmerButton
                    onClick={handleStartGameButton}
                    disabled={loading}
                    className="text-sm"
                  >
                    {loading ? "Submitting..." : "Start Game"}
                  </ShimmerButton>
                ) : (
                  <ShimmerButton onClick={togglePause} className="text-sm">
                    {gameState.gameStatus === "paused" ? "Resume" : "Pause"}
                  </ShimmerButton>
                )}
              </div>
            </div>

            {/* Status */}
            <div className={`text-center mb-4 ${getStatusColor()}`}>
              <span className="font-semibold">{getStatusMessage()}</span>
            </div>

            {/* Game Canvas */}
            <div className="flex justify-center">
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={BOARD_SIZE * 20}
                  height={BOARD_SIZE * 20}
                  className="border-2 border-green-500/30 rounded-lg bg-black"
                />
                {gameState.gameStatus === "paused" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-2xl font-bold">PAUSED</div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 text-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-300 text-sm">
                <div>
                  <p className="font-semibold text-white mb-1">Movement</p>
                  <p>Arrow Keys or WASD</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Pause</p>
                  <p>Spacebar</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Goal</p>
                  <p>Eat red food</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Avoid</p>
                  <p>Walls & yourself</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tournament & Leaderboard */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tournament Info */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {/* heading  */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">
                🏆 Current Tournament
              </h3>
              {/* sync button  */}
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
            {tournament && (
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
            )}
          </div>

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
                      gameState.gameStatus === "gameOver"
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
                      <p className="text-gray-500 text-xs">points</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <p>No scores yet!</p>
                  <p className="text-sm">Be the first to play!</p>
                </div>
              )}
            </div>

            {gameState.score > 0 && gameState.gameStatus === "gameOver" && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-blue-400 text-sm text-center">
                  Your final score:{" "}
                  <span className="font-bold">{gameState.score}</span>
                  {gameState.score > highScore && (
                    <span className="block text-yellow-400 font-bold">
                      🎉 New High Score!
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
