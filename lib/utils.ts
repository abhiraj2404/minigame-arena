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
