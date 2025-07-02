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
import { showConfetti } from "@/components/magicui/confetti";
import { toast } from "sonner";

interface Position {
  x: number;
  y: number;
}

interface Piece {
  shape: number[][];
  color: string;
  position: Position;
}

interface GameState {
  board: number[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
  gameStatus: "waiting" | "ready" | "playing" | "paused" | "gameOver";
  score: number;
  level: number;
  lines: number;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;

// Tetris pieces (tetrominoes)
const PIECES = [
  {
    // I-piece
    shape: [[1, 1, 1, 1]],
    color: "#00f5ff"
  },
  {
    // O-piece
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: "#ffff00"
  },
  {
    // T-piece
    shape: [
      [0, 1, 0],
      [1, 1, 1]
    ],
    color: "#800080"
  },
  {
    // S-piece
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: "#00ff00"
  },
  {
    // Z-piece
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: "#ff0000"
  },
  {
    // J-piece
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: "#0000ff"
  },
  {
    // L-piece
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: "#ffa500"
  }
];

export default function TetrisPage() {
  const playerName = usePlayer().playerName as string;
  const [gameState, setGameState] = useState<GameState>({
    board: Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(0)),
    currentPiece: null,
    nextPiece: null,
    gameStatus: "waiting",
    score: 0,
    level: 1,
    lines: 0
  });

  const [loading, setLoading] = useState(false);
  const [highScore, setHighScore] = useState<number>(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showCelebrateButton, setShowCelebrateButton] = useState(false);

  const { publicKey } = useWallet();
  const [showPayment, setShowPayment] = useState(true);

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextPieceCanvasRef = useRef<HTMLCanvasElement>(null);

  const [loadingOverlay, setLoadingOverlay] = useState({ isLoading: true, text: "" });

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Submit score to backend with wallet address
  const submitScore = async (score: number, playerName: string) => {
    if (score === 0) return; // Don't submit zero scores

    try {
      setLoading(true);
      setLoadingOverlay({ isLoading: true, text: "Submitting" });
      console.log(`Submitting Tetris score: ${playerName} - ${score}`);

      const response = await fetch("/api/tetris/score", {
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
        toast.success(data.message || "Score submitted!");
        if (data.rank > 0 && data.rank <= 10) {
          showConfetti();
          setShowCelebrateButton(true);
        }
        setTimeout(() => {
          triggerRefresh();
        }, 500);
        console.log(`Tetris score submitted successfully. Rank: #${data.rank}`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit score");
      }
    } catch (error) {
      console.error("Failed to submit score:", error);
      toast.error(`Failed to submit score: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
      setLoadingOverlay({ isLoading: false, text: "" });
    }
  };

  // Handle payment success
  const handlePaymentSuccess = () => {
    toast.success("Payment successful! You can now start the game.");
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
    toast.error(errorMessage);
  };

  // Generate random piece
  const generatePiece = useCallback((): Piece => {
    const pieceTemplate = PIECES[Math.floor(Math.random() * PIECES.length)];
    return {
      shape: pieceTemplate.shape,
      color: pieceTemplate.color,
      position: {
        x: Math.floor(BOARD_WIDTH / 2) - Math.floor(pieceTemplate.shape[0].length / 2),
        y: 0
      }
    };
  }, []);

  // Check if piece can be placed at position
  const canPlacePiece = useCallback((piece: Piece, board: number[][], offset = { x: 0, y: 0 }): boolean => {
    const newX = piece.position.x + offset.x;
    const newY = piece.position.y + offset.y;

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = newX + x;
          const boardY = newY + y;

          // Check boundaries
          if (boardX < 0 || boardX >= BOARD_WIDTH || boardY >= BOARD_HEIGHT) {
            return false;
          }

          // Check collision with existing pieces (but allow negative Y for spawning)
          if (boardY >= 0 && board[boardY][boardX]) {
            return false;
          }
        }
      }
    }
    return true;
  }, []);

  // Rotate piece
  const rotatePiece = useCallback((piece: Piece): Piece => {
    const rotated = piece.shape[0].map((_, index) => piece.shape.map((row) => row[index]).reverse());
    return { ...piece, shape: rotated };
  }, []);

  // Place piece on board
  const placePiece = useCallback((piece: Piece, board: number[][]): number[][] => {
    const newBoard = board.map((row) => [...row]);

    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardX = piece.position.x + x;
          const boardY = piece.position.y + y;
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            newBoard[boardY][boardX] = 1;
          }
        }
      }
    }

    return newBoard;
  }, []);

  // Clear completed lines
  const clearLines = useCallback((board: number[][]): { newBoard: number[][]; linesCleared: number } => {
    const newBoard = [...board];
    let linesCleared = 0;

    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every((cell) => cell === 1)) {
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(0));
        linesCleared++;
        y++; // Check the same line again
      }
    }

    return { newBoard, linesCleared };
  }, []);

  // Calculate score
  const calculateScore = useCallback((linesCleared: number, level: number): number => {
    const baseScores = [0, 40, 100, 300, 1200];
    return baseScores[linesCleared] * (level + 1);
  }, []);

  // Start new game
  const startGame = () => {
    const newPlayerName = playerName;
    const firstPiece = generatePiece();
    const secondPiece = generatePiece();

    setGameState({
      board: Array(BOARD_HEIGHT)
        .fill(null)
        .map(() => Array(BOARD_WIDTH).fill(0)),
      currentPiece: firstPiece,
      nextPiece: secondPiece,
      gameStatus: "playing",
      score: 0,
      level: 1,
      lines: 0
    });

    console.log(`New Tetris game started for player: ${newPlayerName}`);
  };

  // Pause/Resume game
  const togglePause = () => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: prev.gameStatus === "playing" ? "paused" : "playing"
    }));
  };

  // Move piece
  const movePiece = useCallback(
    (direction: "left" | "right" | "down" | "rotate") => {
      setGameState((prevState) => {
        if (prevState.gameStatus !== "playing" || !prevState.currentPiece) return prevState;

        let newPiece = { ...prevState.currentPiece };
        const offset = { x: 0, y: 0 };

        switch (direction) {
          case "left":
            offset.x = -1;
            break;
          case "right":
            offset.x = 1;
            break;
          case "down":
            offset.y = 1;
            break;
          case "rotate":
            newPiece = rotatePiece(newPiece);
            break;
        }

        // Check if move is valid
        if (direction === "rotate") {
          if (canPlacePiece(newPiece, prevState.board)) {
            return { ...prevState, currentPiece: newPiece };
          }
          return prevState;
        } else {
          if (canPlacePiece(prevState.currentPiece, prevState.board, offset)) {
            newPiece.position.x += offset.x;
            newPiece.position.y += offset.y;
            return { ...prevState, currentPiece: newPiece };
          } else if (direction === "down") {
            // Piece can't move down, place it and spawn new piece
            const newBoard = placePiece(prevState.currentPiece, prevState.board);
            const { newBoard: clearedBoard, linesCleared } = clearLines(newBoard);

            const newScore = prevState.score + calculateScore(linesCleared, prevState.level);
            const newLines = prevState.lines + linesCleared;
            const newLevel = Math.floor(newLines / 10) + 1;

            const nextCurrentPiece = prevState.nextPiece;
            const nextNextPiece = generatePiece();

            // Check game over
            if (nextCurrentPiece && !canPlacePiece(nextCurrentPiece, clearedBoard)) {
              // Game over
              submitScore(newScore, playerName);
              return {
                ...prevState,
                board: clearedBoard,
                currentPiece: nextCurrentPiece,
                nextPiece: nextNextPiece,
                gameStatus: "gameOver",
                score: newScore,
                level: newLevel,
                lines: newLines
              };
            }

            return {
              ...prevState,
              board: clearedBoard,
              currentPiece: nextCurrentPiece,
              nextPiece: nextNextPiece,
              score: newScore,
              level: newLevel,
              lines: newLines
            };
          }
          return prevState;
        }
      });
    },
    [canPlacePiece, rotatePiece, placePiece, clearLines, calculateScore, generatePiece]
  );

  // Handle keyboard input
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameState.gameStatus !== "playing") return;

      switch (e.key) {
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          movePiece("left");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          movePiece("right");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          movePiece("down");
          break;
        case "ArrowUp":
        case "w":
        case "W":
        case " ":
          e.preventDefault();
          movePiece("rotate");
          break;
        case "p":
        case "P":
          e.preventDefault();
          togglePause();
          break;
      }
    },
    [gameState.gameStatus, movePiece]
  );

  // Game loop
  useEffect(() => {
    if (gameState.gameStatus === "playing") {
      const dropSpeed = Math.max(50, 1000 - (gameState.level - 1) * 100);
      gameLoopRef.current = setInterval(() => {
        movePiece("down");
      }, dropSpeed);
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
  }, [gameState.gameStatus, gameState.level, movePiece]);

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
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = 1;
    for (let x = 0; x <= BOARD_WIDTH; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, BOARD_HEIGHT * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= BOARD_HEIGHT; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(BOARD_WIDTH * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // Draw placed pieces
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        if (gameState.board[y][x]) {
          ctx.fillStyle = "#666666";
          ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }

    // Draw current piece
    if (gameState.currentPiece) {
      ctx.fillStyle = gameState.currentPiece.color;
      for (let y = 0; y < gameState.currentPiece.shape.length; y++) {
        for (let x = 0; x < gameState.currentPiece.shape[y].length; x++) {
          if (gameState.currentPiece.shape[y][x]) {
            const drawX = (gameState.currentPiece.position.x + x) * CELL_SIZE + 1;
            const drawY = (gameState.currentPiece.position.y + y) * CELL_SIZE + 1;
            if (drawY >= 0) {
              ctx.fillRect(drawX, drawY, CELL_SIZE - 2, CELL_SIZE - 2);
            }
          }
        }
      }
    }
  }, [gameState.board, gameState.currentPiece]);

  // Next piece canvas rendering
  useEffect(() => {
    const canvas = nextPieceCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!gameState.nextPiece) {
      return;
    }

    // Draw next piece
    ctx.fillStyle = gameState.nextPiece.color;
    const offsetX = (canvas.width - gameState.nextPiece.shape[0].length * CELL_SIZE) / 2;
    const offsetY = (canvas.height - gameState.nextPiece.shape.length * CELL_SIZE) / 2;

    for (let y = 0; y < gameState.nextPiece.shape.length; y++) {
      for (let x = 0; x < gameState.nextPiece.shape[y].length; x++) {
        if (gameState.nextPiece.shape[y][x]) {
          ctx.fillRect(offsetX + x * CELL_SIZE + 1, offsetY + y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
        }
      }
    }
  }, [gameState.nextPiece]);

  const getStatusMessage = () => {
    switch (gameState.gameStatus) {
      case "waiting":
        return "Click 'Start Game' to begin";
      case "ready":
        return "Start the game";
      case "playing":
        return "Use arrow keys or WASD to move and rotate";
      case "paused":
        return "Game paused - Press P to resume";
      case "gameOver":
        return "Game Over! Click 'Play Again' to start another game";
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
    <div className="max-w-7xl mx-auto space-y-8">
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
      <div className="relative w-fit mx-auto text-center space-y-4">
        <h1 className="text-5xl font-bold text-white">🧩 Tetris</h1>
        <p className="text-gray-300 text-lg">Stack blocks and clear lines to climb the leaderboard!</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Game Board */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            {/* Game Stats */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                  <span className="text-purple-400 font-semibold text-sm">Level: {gameState.level}</span>
                </div>
                <div className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <span className="text-orange-400 font-semibold text-sm">Lines: {gameState.lines}</span>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <span className="text-blue-400 font-semibold text-sm">Score: {gameState.score.toLocaleString()}</span>
                </div>
                {highScore > 0 && (
                  <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <span className="text-yellow-400 font-semibold">High: {highScore}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-center">
                {showCelebrateButton && <ShimmerButton onClick={showConfetti}>Celebrate 🎉</ShimmerButton>}
                {showPayment ? (
                  <div className="w-full max-w-sm">
                    <GamePayment game="tetris" onPaymentSuccess={handlePaymentSuccess} onPaymentError={handlePaymentError} />
                  </div>
                ) : gameState.gameStatus == "gameOver" ? (
                  <ShimmerButton
                    onClick={() => {
                      setShowPayment(true);
                      setGameState({
                        board: Array(BOARD_HEIGHT)
                          .fill(null)
                          .map(() => Array(BOARD_WIDTH).fill(0)),
                        currentPiece: null,
                        nextPiece: null,
                        gameStatus: "waiting",
                        score: 0,
                        level: 1,
                        lines: 0
                      });
                      setShowCelebrateButton(false);
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
            <div className="grid grid-cols-3">
              <div></div>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={BOARD_WIDTH * CELL_SIZE}
                  height={BOARD_HEIGHT * CELL_SIZE}
                  className="border-2 border-green-500/30 rounded-lg bg-black"
                />
                {gameState.gameStatus === "paused" && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                    <div className="text-white text-2xl font-bold">PAUSED</div>
                  </div>
                )}
              </div>
              <div className="mx-5">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6 mb-8">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">Next Piece</h3>
                  <div className="flex justify-center">
                    <canvas ref={nextPieceCanvasRef} width={100} height={100} className="border border-green-500/30 rounded-lg bg-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-6 text-center">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-gray-300 text-sm">
                <div>
                  <p className="font-semibold text-white mb-1">Move</p>
                  <p>← → or A D</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Drop</p>
                  <p>↓ or S</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Rotate</p>
                  <p>↑ W or Space</p>
                </div>
                <div>
                  <p className="font-semibold text-white mb-1">Pause</p>
                  <p>P</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Piece */}

        {/* Tournament & Leaderboard */}
        <div className="lg:col-span-1 space-y-6">
          {/* Tournament Info */}
          <Tournament game="tetris" refreshTrigger={refreshTrigger} setLoadingOverlay={handleChildLoading} />

          {/* Leaderboard */}
          <Leaderboard
            game="tetris"
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
