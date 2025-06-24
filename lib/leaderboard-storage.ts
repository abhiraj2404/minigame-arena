import type { LeaderboardEntry } from "@/lib/types";
import { supabase } from "./supabase";

export async function getLeaderboard(
  game: string,
  limit = 10
): Promise<LeaderboardEntry[] | null> {
  let { data: leaderboard, error } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("game", game)
    .order("score", { ascending: false })
    .limit(limit);

  if (leaderboard) console.log(`leaderboard for game ${game}: `, leaderboard);
  if (error) console.log(`error in fetching leaderboard for ${game}: `, error);

  return leaderboard;
}

export async function addScore(
  playerName: string,
  score: number,
  game: string,
  walletAddress: string
): Promise<{
  entry: LeaderboardEntry;
  rank: number;
  message: string;
}> {
  // Validate input
  if (!playerName || typeof score !== "number" || score < 0) {
    throw new Error("Invalid player name or score");
  }

  console.log(
    `Adding score: ${playerName}, ${score}, ${game}, ${walletAddress}`
  );

  const { data: existingEntry, error } = await supabase
    .from("leaderboard")
    .select("*")
    .eq("game", game)
    .eq("playerName", playerName)
    .maybeSingle();

  if (error) {
    console.error("Error fetching existing entry:", error);
    throw new Error("Could not add score.");
  }

  let newEntry: LeaderboardEntry;

  if (existingEntry) {
    // Update existing player's score if new score is higher
    const shouldUpdate = score >= existingEntry.score;

    if (shouldUpdate) {
      const { data: updatedEntry, error: updateError } = await supabase
        .from("leaderboard")
        .update({
          score: Math.max(score, existingEntry.score),
          timestamp: new Date().toISOString(),
        })
        .eq("id", existingEntry.id)
        .select()
        .single();

      newEntry = updatedEntry;

      if (updatedEntry) console.log("updated entry: ", updatedEntry);
      if (updateError) {
        console.error("Error updating score:", updateError);
        throw new Error("Could not update score");
      }
    } else {
      newEntry = existingEntry;
    }
  } else {
    // create new entry
    const { data, error: insertError } = await supabase
      .from("leaderboard")
      .insert({
        playerName,
        walletAddress,
        score,
        timestamp: new Date().toISOString(),
        game,
      })
      .select()
      .single();

    newEntry = data;

    if (insertError) {
      console.log("error inserting new score: ", insertError);
      throw new Error("could not insert new score");
    }
  }

  // Calculate rank for this game
  const gameLeaderboard = (await getLeaderboard(game, 100)) || [];
  const rank =
    gameLeaderboard.findIndex(
      (entry) => entry.playerName === newEntry.playerName
    ) + 1;

  // Generate message based on rank and game
  let message = `Score submitted! You ranked #${rank} in ${game}`;

  if (game === "minesweeper") {
    if (rank === 1) {
      message = `🎉 New minesweeper champion! You're #1 with ${score} points!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the minesweeper leaderboard with ${score} points!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) with ${score} points`;
    } else {
      message = `Win recorded! You have ${score} points (Rank #${rank})`;
    }
  } else if (game === "tetris") {
    if (rank === 1) {
      message = `🎉 New Tetris champion! You're #1 with ${score} points!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the Tetris leaderboard with ${score} points!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) with ${score} points`;
    } else {
      message = `Score recorded! ${score} points (Rank #${rank})`;
    }
  } else if (game === "snake") {
    if (rank === 1) {
      message = `🎉 New ${game} high score! You're #1 on the leaderboard!`;
    } else if (rank <= 3) {
      message = `🏆 Great job! You're #${rank} on the ${game} leaderboard!`;
    } else if (rank <= 10) {
      message = `🎯 Nice! You made it to the top 10 (#${rank}) in ${game}`;
    } else {
      message = `Score recorded! ${score} points (Rank #${rank})`;
    }
  }

  if (existingEntry && newEntry.score == existingEntry.score) {
    message = "You couldn't beat your previous score, better luck next time!";
  }

  console.log(
    `New ${game} score: ${playerName} - ${score} points (Rank #${rank})`
  );

  return {
    entry: newEntry,
    rank,
    message,
  };
}

export async function getTopScore(game: string): Promise<number> {
  const gameLeaderboard = await getLeaderboard(game, 1);
  if (!gameLeaderboard || gameLeaderboard.length === 0) return 0;
  return gameLeaderboard[0].score;
}

export async function getPlayerRank(
  playerName: string,
  game: string
): Promise<number> {
  const gameLeaderboard = await getLeaderboard(game, 100);
  if (!gameLeaderboard) return -1;
  const rank =
    gameLeaderboard.findIndex((entry) => entry.playerName === playerName) + 1;
  return rank > 0 ? rank : -1;
}

export async function getPlayerScore(
  playerName: string,
  game: string
): Promise<number> {
  const { data: entry, error } = await supabase
    .from("leaderboard")
    .select("score")
    .eq("playerName", playerName)
    .eq("game", game)
    .single();

  if (error || !entry) {
    console.error("Error fetching player score: ", error);
    return 0;
  }
  return entry.score;
}
