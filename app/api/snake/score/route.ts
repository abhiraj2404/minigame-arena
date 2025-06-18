import { NextResponse } from "next/server"
import { addScore } from "@/app/api/lib/leaderboard-storage"

export async function POST(request: Request) {
  try {
    let requestData
    try {
      requestData = await request.json()
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { playerName, score, walletAddress } = requestData

    if (!playerName || typeof score !== "number") {
      return NextResponse.json({ error: "Invalid player name or score" }, { status: 400 })
    }

    if (score < 0) {
      return NextResponse.json({ error: "Score cannot be negative" }, { status: 400 })
    }

    console.log(`Submitting Snake score: ${playerName} - ${score} - ${walletAddress}`)

    // Add score to shared leaderboard
    const result = addScore(playerName, score, "snake", walletAddress)

    const response = {
      success: true,
      message: result.message,
      rank: result.rank,
      entry: result.entry,
    }

    console.log(`Snake score submission result:`, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error submitting snake score:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to submit score" },
      { status: 500 },
    )
  }
}
