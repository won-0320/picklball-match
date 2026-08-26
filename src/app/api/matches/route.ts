import { NextResponse } from "next/server";
import { getMatchListData } from "@/lib/matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getMatchListData();
  return NextResponse.json(data);
}
