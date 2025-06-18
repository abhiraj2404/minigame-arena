"use client"

import React from "react"
import { cn } from "@/lib/utils"

export interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string
  shimmerSize?: string
  borderRadius?: string
  shimmerDuration?: string
  background?: string
  className?: string
  children?: React.ReactNode
}

const ShimmerButton = React.forwardRef<HTMLButtonElement, ShimmerButtonProps>(
  (
    {
      shimmerColor = "#22c55e",
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background = "rgba(0, 0, 0, 1)",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": shimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": background,
          } as React.CSSProperties
        }
        className={cn(
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 px-6 py-3 text-white [background:var(--bg)] [border-radius:var(--radius)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(34,197,94,0.3)]",
          "before:absolute before:inset-0 before:overflow-hidden before:rounded-[inherit] before:border before:border-white/20 before:bg-[linear-gradient(var(--spread),transparent_74%,var(--shimmer-color)_86%,transparent_100%)] before:bg-[length:250%_250%,100%_100%] before:bg-[position:200%_0,0_0] before:bg-no-repeat before:opacity-0 before:transition-[background-position_0s_ease_0s,opacity_2s_ease_0s] before:content-['']",
          "hover:before:animate-[shimmer_var(--speed)_ease-in-out_infinite] hover:before:bg-[position:-100%_0,0_0] hover:before:opacity-100",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
        <style jsx>{`
          @keyframes shimmer {
            0% {
              background-position: 200% 0, 0 0;
            }
            100% {
              background-position: -200% 0, 0 0;
            }
          }
        `}</style>
      </button>
    )
  },
)
ShimmerButton.displayName = "ShimmerButton"

export { ShimmerButton }
