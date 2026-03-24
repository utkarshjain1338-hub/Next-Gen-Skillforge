import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "NXT-GEN SKILLFORGE API",
    status: "ok",
    endpoints: ["/api/skills", "/api/jobs", "/api/match", "/api/stats", "/api/demo"]
  });
}