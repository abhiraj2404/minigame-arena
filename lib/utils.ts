import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate random player names
const ADJECTIVES = [
  "Swift",
  "Master",
  "Pro",
  "Epic",
  "Super",
  "Mega",
  "Ultra",
  "Turbo",
  "Lightning",
  "Quantum",
  "Clever",
  "Sharp",
  "Quick",
];
const NOUNS = [
  "Stacker",
  "Builder",
  "Clearer",
  "Wizard",
  "King",
  "Champion",
  "Legend",
  "Genius",
  "Hero",
  "Ace",
  "Defuser",
  "Hunter",
  "Clicker",
  "Sweeper",
];

export const generatePlayerName = () => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 999) + 1;
  return `${adjective}${noun}${number}`;
};

export const formatTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return "Just now";
};
