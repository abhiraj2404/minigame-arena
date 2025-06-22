import { NextResponse } from "next/server"
import { getLeaderboard } from "@/lib/leaderboard-storage"

export async function GET() {
  try {
    // Get top 10 snake scores
    const leaderboard = await getLeaderboard("snake", 10)

    return NextResponse.json({
      success: true,
      leaderboard,
      total:  leaderboard ? leaderboard.length : 0,
    })
  } catch (error) {
    console.error("Error fetching snake leaderboard:", error)
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
  }
}
