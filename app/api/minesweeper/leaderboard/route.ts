import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/leaderboard-storage"

export async function GET() {
  try {
    // Get top 10 minesweeper scores (wins)
    const leaderboard = getLeaderboard("minesweeper", 10)

    return NextResponse.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
    })
  } catch (error) {
    console.error("Error fetching minesweeper leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
