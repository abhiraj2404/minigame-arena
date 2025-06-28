"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";
import { useWallet } from "@solana/wallet-adapter-react";
import GamePayment from "@/components/game-payment";
import { usePlayer } from "@/components/player-context";
import Leaderboard from "@/components/leaderboard";
import Tournament from "@/components/tournament";
import { BlurFade } from "@/components/magicui/blur-fade";
import { Spinner } from "@/components/ui/spinner";

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
}

const BOARD_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_FOOD = { x: 15, y: 15 };
const INITIAL_DIRECTION = { x: 0, y: -1 };

export default function SnakePage() {
  const playerName = usePlayer().playerName as string;
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: INITIAL_FOOD,
    direction: INITIAL_DIRECTION,
    gameStatus: "waiting",
    score: 0
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [highScore, setHighScore] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { publicKey } = useWallet();
  const [showPayment, setShowPayment] = useState(true);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [loadingOverlay, setLoadingOverlay] = useState({ isLoading: true, text: "" });

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Submit score to backend and update leaderboard
  const submitScore = async (score: number, playerName: string) => {
    if (score === 0) return; // Don't submit zero scores

    try {
      setLoading(true);
      setLoadingOverlay({ isLoading: true, text: "Submitting" });
      console.log(`Submitting score: ${playerName} - ${score}`);

      const response = await fetch("/api/snake/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          playerName,
          score,
          walletAddress: publicKey ? publicKey.toString() : undefined
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(data.message || "Score submitted!");

        // Immediately refresh leaderboard to show new score
        setTimeout(() => {
          triggerRefresh();
        }, 500);

        console.log(`Score submitted successfully. Rank: #${data.rank}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit score");
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      setError(`Failed to submit score: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setLoadingOverlay({ isLoading: false, text: "" });
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    setMessage("Payment successful! You can now start the game.");
    setShowPayment(false);
    triggerRefresh();
    setGameState((gamestate) => ({
      ...gamestate,
      gameStatus: "ready"
    }));
  };

  const handleStartGameButton = () => {
    startGame();
  };

  // Handle payment error
  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  // Generate random food position
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * BOARD_SIZE),
        y: Math.floor(Math.random() * BOARD_SIZE)
      };
    } while (snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
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
      if (head.x < 0 || head.x >= BOARD_SIZE || head.y < 0 || head.y >= BOARD_SIZE) {
        // Game over
        console.log(`Game over - wall collision. Final score: ${prevState.score}`);
        submitScore(prevState.score, playerName);
        return {
          ...prevState,
          gameStatus: "gameOver"
        };
      }

      // Check self collision
      if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        // Game over
        console.log(`Game over - self collision. Final score: ${prevState.score}`);
        submitScore(prevState.score, playerName);
        return {
          ...prevState,
          gameStatus: "gameOver"
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
          score: newScore
        };
      } else {
        // Normal move - remove tail
        newSnake.pop();
        return {
          ...prevState,
          snake: newSnake
        };
      }
    });
  }, [generateFood]);

  // Start game
  const startGame = () => {
    setGameState({
      snake: INITIAL_SNAKE,
      food: generateFood(INITIAL_SNAKE),
      direction: INITIAL_DIRECTION,
      gameStatus: "playing",
      score: 0
    });
    setMessage("");
    setError("");
    console.log(`New game started for player: ${playerName}`);
  };

  // Pause/Resume game
  const togglePause = () => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: prev.gameStatus === "playing" ? "paused" : "playing"
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
        <h1 className="text-5xl font-bold text-white">🐍 Snake</h1>
        <p className="text-gray-300 text-lg">Grow your snake and climb the leaderboard!</p>
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
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold">Length: {gameState.snake.length}</span>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-400 font-semibold">Score: {gameState.score}</span>
                </div>
                {highScore > 0 && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 font-semibold">High: {highScore}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {showPayment ? (
                  <div className="w-64">
                    <GamePayment game="snake" onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError} />
                  </div>
                ) : gameState.gameStatus == "gameOver" ? (
                  <ShimmerButton
                    onClick={() => {
                      setShowPayment(true);
                      setMessage("");
                      setError("");
                      setGameState({
                        snake: INITIAL_SNAKE,
                        food: INITIAL_FOOD,
                        direction: INITIAL_DIRECTION,
                        gameStatus: "waiting",
                        score: 0
                      });
                    }}
                    disabled={loading}
                    className="text-sm"
                  >
                    Play Again
                  </ShimmerButton>
                ) : gameState.gameStatus === "waiting" || gameState.gameStatus === "ready" ? (
                  <ShimmerButton onClick={handleStartGameButton} disabled={loading} className="text-sm">
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
          <Tournament game="snake" setError={setError} refreshTrigger={refreshTrigger} setLoadingOverlay={handleChildLoading} />

          {/* Leaderboard */}
          <Leaderboard
            game="snake"
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
