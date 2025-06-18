"use client"

import type React from "react"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  borderWidth?: number
  colorFrom?: string
  colorTo?: string
  delay?: number
}

export default function BorderBeam({
  className,
  size = 200,
  duration = 15,
  borderWidth = 1.5,
  colorFrom = "#22c55e",
  colorTo = "#10b981",
  delay = 0,
}: BorderBeamProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent]",
        className,
      )}
      style={
        {
          "--border-width": borderWidth,
          "--border-radius": `inherit`,
        } as React.CSSProperties
      }
    >
      <div
        className="absolute inset-0 rounded-[inherit] [border:calc(var(--border-width)*1px)_solid_transparent] [mask-composite:xor] [mask:linear-gradient(transparent,transparent),linear-gradient(white,white)]"
        style={
          {
            background: `conic-gradient(from 0deg, transparent, ${colorFrom}, ${colorTo}, transparent)`,
            animation: `border-beam ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
          } as React.CSSProperties
        }
      />
      <style jsx>{`
        @keyframes border-beam {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
