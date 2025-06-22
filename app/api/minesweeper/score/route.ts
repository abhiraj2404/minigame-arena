import { NextResponse } from "next/server";
import { addScore } from "@/lib/leaderboard-storage";

export async function POST(request: Request) {
  try {
    let requestData;
    try {
      requestData = await request.json();
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { playerName, wins, walletAddress } = requestData;

    if (!playerName || typeof wins !== "number") {
      return NextResponse.json(
        { error: "Invalid player name or wins count" },
        { status: 400 }
      );
    }

    if (wins < 1) {
      return NextResponse.json(
        { error: "Wins must be at least 1" },
        { status: 400 }
      );
    }

    console.log(
      `Submitting Minesweeper win: ${playerName} - ${wins} - ${walletAddress}`
    );

    // Add win to shared leaderboard (score = number of wins)
    const result = await addScore(
      playerName,
      wins,
      "minesweeper",
      walletAddress
    );

    const response = {
      success: true,
      message: result.message,
      rank: result.rank,
      entry: result.entry,
    };

    console.log(`Minesweeper score submission result:`, response);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error submitting minesweeper win:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to submit win",
      },
      { status: 500 }
    );
  }
}
