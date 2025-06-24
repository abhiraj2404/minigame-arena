import { NextResponse } from "next/server";
import {
  getAllTournaments,
  getKeypairs,
  sendPrizeToWinner,
  initializeTournaments,
  createNewTournament,
  resetTournament,
} from "@/lib/tournament-system";
import { getLeaderboard, resetLeaderboard } from "@/lib/leaderboard-storage";
import { GAME_FEES } from "@/lib/constants";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch (jsonError) {
    return NextResponse.json(
      { error: "Invalid or empty JSON body" },
      { status: 400 }
    );
  }
  try {
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }
    if (password !== process.env.PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Fetch all tournaments
    const tournaments = await getAllTournaments();
    const results = [];

    for (const tournament of tournaments) {
      // 2. Get leaderboard for the game
      const leaderboard = await getLeaderboard(tournament.game, 1);
      const winner = leaderboard && leaderboard[0];
      if (!winner || !winner.walletAddress) {
        results.push({ game: tournament.game, status: "No winner found" });
        continue;
      }
      // 3. Get keypair for the game
      const keypair = await getKeypairs(tournament.game);
      if (!keypair || !keypair.privateKey) {
        results.push({ game: tournament.game, status: "No keypair found" });
        continue;
      }
      // 4. Send prize pool to winner
      const amountSol = tournament.prizePool * 0.9;
      if (amountSol > 0) {
        const signature = await sendPrizeToWinner({
          fromSecretKey: keypair.privateKey,
          toPublicKey: winner.walletAddress,
          amountSol,
        });
        if (signature) {
          // Reset leaderboard for this game
          await resetLeaderboard(tournament.game);

          // reset tournament for this game
          await resetTournament(tournament.game);
        }
        results.push({
          game: tournament.game,
          status: signature
            ? "Prize sent and tournament reset"
            : "Failed to send prize",
          signature,
          winner: winner.walletAddress,
        });
      } else {
        results.push({
          game: tournament.game,
          status: "No prize pool to send",
        });
      }
      console.log("results: ", results);
    }

    // 5. Optionally, you can still call initializeTournaments() if you want to ensure all games have a tournament
    // await initializeTournaments();

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Error resetting tournaments:", error);
    return NextResponse.json(
      { error: "Failed to reset tournaments" },
      { status: 500 }
    );
  }
}
