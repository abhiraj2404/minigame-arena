import {
  clusterApiUrl,
  type PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";

// Configure the network and RPC endpoint
export const network = WalletAdapterNetwork.Devnet; // Change to Mainnet for production
export const endpoint = clusterApiUrl(network);

// Convert SOL to lamports
export const solToLamports = (sol: number): number => {
  return Math.floor(sol * LAMPORTS_PER_SOL);
};

// Convert lamports to SOL
export const lamportsToSol = (lamports: number): number => {
  return lamports / LAMPORTS_PER_SOL;
};

// Format SOL amount with 2 decimal places
export const formatSol = (sol: number): string => {
  return sol.toFixed(3);
};

// Format public key for display (first 4 + last 4 characters)
export const formatPublicKey = (
  publicKey: PublicKey | string | null
): string => {
  if (!publicKey) return "";
  const key = typeof publicKey === "string" ? publicKey : publicKey.toString();
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

export const formatWalletAddress = (address?: string) => {
  if (!address) return "";
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
};
