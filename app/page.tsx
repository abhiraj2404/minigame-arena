"use client";

import AnimatedGradientText from "@/components/magicui/animated-gradient-text";
import GameCard from "../components/game-card";
import { GAME_FEES } from "@/lib/constants";

const games = [
  {
    id: "minesweeper",
    title: "Minesweeper",
    description:
      "Classic mine detection game with modern multiplayer features and SOL rewards. Test your logic and luck!",
    icon: "💣",
    status: "available" as const,
    cost: `${GAME_FEES.minesweeper} SOL`,
    tags: ["Logic", "Strategy", "Classic"],
    preview: (
      <div className="grid grid-cols-6 gap-1 p-4">
        {Array.from({ length: 36 }).map((_, i) => (
          <div
            key={i}
            className="w-4 h-4 bg-gray-700 border border-gray-600 rounded-sm flex items-center justify-center text-xs"
          >
            {Math.random() > 0.8
              ? "💣"
              : Math.random() > 0.6
              ? Math.floor(Math.random() * 4) + 1
              : ""}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "tetris",
    title: "Tetris",
    description:
      "Stack blocks and clear lines in this timeless puzzle game with competitive tournaments.",
    icon: "🧩",
    status: "available" as const, // Change from "coming-soon" to "available"
    cost: `${GAME_FEES.tetris} SOL`,
    tags: ["Puzzle", "Speed", "Multiplayer"],
    preview: (
      <div className="grid grid-cols-10 gap-px p-4">
        {Array.from({ length: 100 }).map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${
              Math.random() > 0.7
                ? [
                    "bg-blue-500",
                    "bg-green-500",
                    "bg-red-500",
                    "bg-yellow-500",
                    "bg-purple-500",
                  ][Math.floor(Math.random() * 5)]
                : "bg-gray-800"
            }`}
          />
        ))}
      </div>
    ),
  },
  {
    id: "snake",
    title: "Snake",
    description:
      "Grow your snake and avoid the walls in this classic arcade game with modern twists and crypto rewards.",
    icon: "🐍",
    status: "available" as const,
    cost: `${GAME_FEES.snake} SOL`,
    tags: ["Arcade", "Survival", "Classic"],
    preview: (
      <div className="relative w-full h-full bg-gray-800 rounded-lg p-4">
        <div className="absolute inset-4 border border-gray-600 rounded">
          <div className="absolute top-8 left-8 w-2 h-2 bg-green-500 rounded-full" />
          <div className="absolute top-8 left-6 w-2 h-2 bg-green-400 rounded-full" />
          <div className="absolute top-8 left-4 w-2 h-2 bg-green-300 rounded-full" />
          <div className="absolute top-16 right-12 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        </div>
      </div>
    ),
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <AnimatedGradientText>
          <span className="text-green-400">🎮 Welcome to the Arena</span>
        </AnimatedGradientText>

        <h1 className="text-6xl font-bold text-white mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-green-400 to-green-600">
            Minigame Arena
          </span>
        </h1>

        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
          Challenge yourself with classic games, compete with players worldwide,
          and win SOL rewards in our decentralized gaming platform.
        </p>
      </div>

      {/* Games Grid */}
      <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        {games.map((game) => (
          <GameCard key={game.id} {...game} />
        ))}
      </div>

      {/* Features Section */}
      <div className="text-center py-12">
        <div className="bg-gray-900/30 backdrop-blur-sm border border-white/10 rounded-2xl p-8 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-8">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Pay to Play</h3>
              <p className="text-gray-400">
                Use SOL to enter games and tournaments
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Compete</h3>
              <p className="text-gray-400">
                Challenge players from around the world
              </p>
            </div>
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto">
                <span className="text-2xl">🏆</span>
              </div>
              <h3 className="text-xl font-semibold text-white">Win Rewards</h3>
              <p className="text-gray-400">
                Earn SOL for victories and achievements
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
