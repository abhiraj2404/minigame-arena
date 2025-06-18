import { NextResponse } from "next/server"
import { getLeaderboard } from "@/app/api/lib/leaderboard-storage"

export async function GET() {
  try {
    // Get top 10 tetris scores
    const leaderboard = getLeaderboard("tetris", 10)

    return NextResponse.json({
      success: true,
      leaderboard,
      total: leaderboard.length,
    })
  } catch (error) {
    console.error("Error fetching tetris leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
