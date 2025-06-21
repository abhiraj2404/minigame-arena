"use client";
import Link from "next/link";
import type { ReactNode } from "react";
import { ShimmerButton } from "@/components/magicui/shimmer-button";

interface GameCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: "available" | "coming-soon";
  cost: string;
  preview: ReactNode;
  tags: string[];
}

export default function GameCard({
  id,
  title,
  description,
  icon,
  status,
  cost,
  preview,
  tags,
}: GameCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-gray-900/50 backdrop-blur-sm border border-white/10 hover:border-green-500/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/10">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Static corner accents */}
      <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-green-500/20 to-transparent rounded-br-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-green-500/15 to-transparent rounded-tl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100" />

      {/* Preview Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 p-4">
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="relative z-10 flex items-center justify-center h-full">
          {preview}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            <p className="text-green-400 font-semibold text-sm">{cost}</p>
          </div>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">{description}</p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 text-xs font-medium bg-green-500/10 text-green-400 rounded-full border border-green-500/20"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Link href={`/games/${id}`} className="flex-1">
            {status === "available" ? (
              <ShimmerButton className="w-full text-sm font-semibold">
                Play Now
              </ShimmerButton>
            ) : (
              <button className="w-full px-4 py-3 text-sm font-semibold text-gray-400 bg-gray-800 border border-gray-700 rounded-lg cursor-not-allowed">
                Coming Soon
              </button>
            )}
          </Link>
          <button className="px-4 py-3 text-sm font-semibold text-gray-300 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
