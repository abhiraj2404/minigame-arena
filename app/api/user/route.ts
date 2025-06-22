import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { User } from "@/lib/types";

// POST /api/user - Register user if not exists
export async function POST(request: Request) {
  try {
    const { playerName, walletAddress } = await request.json();
    if (!playerName || !walletAddress) {
      return NextResponse.json(
        { error: "playerName and walletAddress are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("walletAddress", walletAddress)
      .maybeSingle();

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ success: true, user: existingUser });
    }

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ playerName, walletAddress }])
      .select()
      .maybeSingle();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// GET /api/user?walletAddress=...
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");
    console.log("wallet address:", walletAddress);
    if (!walletAddress) {
      return NextResponse.json(
        { error: "walletAddress is required" },
        { status: 400 }
      );
    }
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("walletAddress", walletAddress)
      .maybeSingle();
    if (error) {
      console.log("some error occured fetching user data: ", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!user) {
      console.log("user not registered");
      return NextResponse.json(
        { error: "User not registered" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
