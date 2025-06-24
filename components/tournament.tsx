import { formatSol } from "@/lib/solana-config";
import type { Tournament } from "@/lib/types";
import { formatTimeAgo } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface TournamentProps {
  game: string;
  setError: (error: string) => void;
  refreshTrigger: number;
}

export default function Tournament({
  game,
  setError,
  refreshTrigger,
}: TournamentProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const tournamentUpdateRef = useRef<NodeJS.Timeout>();

  // Load tournament data
  const loadTournament = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);

      const response = await fetch(`/api/tournaments?game=${game}`);
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

  useEffect(() => {
    loadTournament(true);
  }, [refreshTrigger]);

  useEffect(() => {
    loadTournament(true);

    // Auto-refresh tournament data every 30 seconds
    const startTournamentRefresh = () => {
      tournamentUpdateRef.current = setInterval(() => {
        loadTournament();
      }, 15000); // 15 seconds
    };

    startTournamentRefresh();

    return () => {
      if (tournamentUpdateRef.current) {
        clearInterval(tournamentUpdateRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
      {/* heading  */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">🏆 Current Tournament</h3>
        {/* sync button  */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {lastUpdateTime > 0 && formatTimeAgo(lastUpdateTime)}
          </span>
          <button
            onClick={() => {
              loadTournament(true);
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
              {tournament.status}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
