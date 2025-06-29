import { NextResponse } from "next/server";
import { getCurrentTournament, addEntryFee, getTournamentStatus } from "@/lib/tournament-system";

export async function POST(request: Request) {
  try {
    const { game, playerWallet } = await request.json();

    if (!game || !playerWallet) {
      return NextResponse.json({ error: "Game and playerWallet are required" }, { status: 400 });
    }

    const tournament = await getCurrentTournament(game);

    if (!tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // In a real implementation, we would verify the transaction here
    // For now, we'll just add the entry fee to the prize pool
    addEntryFee(game, tournament.entryFee);

    return NextResponse.json({
      success: true,
      message: `Entry fee of ${tournament.entryFee} GOR added to prize pool`,
      tournament: {
        publicKey: tournament.publicKey,
        entryFee: tournament.entryFee,
        prizePool: tournament.prizePool,
        endDate: tournament.endDate,
        status: getTournamentStatus(tournament)
      }
    });
  } catch (error) {
    console.error("Error processing tournament entry:", error);
    return NextResponse.json({ error: "Failed to process tournament entry" }, { status: 500 });
  }
}
