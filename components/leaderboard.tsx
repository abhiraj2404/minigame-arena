import { formatSol, formatWalletAddress } from "@/lib/solana-config";
import { LeaderboardEntry } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface LeaderboardProps {
  game: string;
  setError: (error: string) => void;
  gameState: any;
  highScore: number;
  setHighScore: (score: number) => void;
  refreshTrigger: number;
}

// Helper to format seconds as mm:ss
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function Leaderboard({
  game,
  gameState,
  setError,
  highScore,
  setHighScore,
  refreshTrigger,
}: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const leaderboardUpdateRef = useRef<NodeJS.Timeout>();

  // Load leaderboard
  const loadLeaderboard = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`/api/${game}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);

        if (data.leaderboard && data.leaderboard.length > 0) {
          setHighScore(data.leaderboard[0].score);
        } else {
          setHighScore(0);
        }

        setLastUpdateTime(Date.now());

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

  useEffect(() => {
    loadLeaderboard(true);
  }, [refreshTrigger]);

  // Auto-refresh leaderboard
  useEffect(() => {
    loadLeaderboard(true);

    const startAutoRefresh = () => {
      leaderboardUpdateRef.current = setInterval(() => {
        loadLeaderboard();
      }, 15000); // 15 seconds
    };

    startAutoRefresh();

    return () => {
      if (leaderboardUpdateRef.current) {
        clearInterval(leaderboardUpdateRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">🏆 Leaderboard</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {lastUpdateTime > 0 && formatTimeAgo(lastUpdateTime)}
          </span>
          <button
            onClick={() => {
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
                {game === "minesweeper" ? (
                  <>
                    <p className="text-green-400 font-bold">
                      {formatTime(entry.score)}
                    </p>
                    <p className="text-gray-500 text-xs">min</p>
                  </>
                ) : (
                  <>
                    <p className="text-green-400 font-bold">{entry.score}</p>
                    <p className="text-gray-500 text-xs">points</p>
                  </>
                )}
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
  );
}
