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

    const { playerName, time, walletAddress } = requestData;

    if (!playerName || typeof time !== "number") {
      return NextResponse.json(
        { error: "Invalid player name or time" },
        { status: 400 }
      );
    }

    if (time < 1) {
      return NextResponse.json(
        { error: "Time must be at least 1 second" },
        { status: 400 }
      );
    }

    console.log(
      `Submitting Minesweeper win: ${playerName} - ${time} seconds - ${walletAddress}`
    );

    // Add win to shared leaderboard (score = time taken)
    const result = await addScore(
      playerName,
      time,
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
