import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Pro subscriptions coming soon" },
    { status: 403 }
  );
}
