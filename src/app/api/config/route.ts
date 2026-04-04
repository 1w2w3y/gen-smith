import { NextResponse } from "next/server";
import { getSanitizedConfig } from "@/lib/config";

export async function GET() {
  try {
    const config = getSanitizedConfig();
    return NextResponse.json(config);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to load config";
    return NextResponse.json(
      { error: { code: "config_error", message } },
      { status: 500 }
    );
  }
}
