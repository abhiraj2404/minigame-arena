import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/leaderboard-storage"

export async function GET() {
  try {
    // Get top 10 tetris scores
    const leaderboard = await getLeaderboard("tetris", 10)

    return NextResponse.json({
      success: true,
      leaderboard,
      total:  leaderboard ? leaderboard.length : 0,
    })
  } catch (error) {
    console.error("Error fetching tetris leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
