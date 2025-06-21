import { NextResponse } from "next/server"
import { getCurrentTournament, getTournamentStatus } from "@/lib/tournament-system"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const game = searchParams.get("game")

    console.log(`Fetching tournament for game: ${game}`)

    if (!game) {
      return NextResponse.json({ error: "Game parameter is required" }, { status: 400 })
    }

    const tournament = getCurrentTournament(game)

    if (!tournament) {
      console.log(`No tournament found for game: ${game}`)
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 })
    }

    // Don't expose the private key in the response
    const { keypair, ...publicTournamentData } = tournament

    const response = {
      success: true,
      tournament: {
        ...publicTournamentData,
        status: getTournamentStatus(tournament),
        endsAt: tournament.endDate, // Add endsAt field for countdown
      },
    }

    console.log(`Tournament data for ${game}:`, response)
    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching tournament:", error)
    return NextResponse.json({ error: "Failed to fetch tournament" }, { status: 500 })
  }
}
