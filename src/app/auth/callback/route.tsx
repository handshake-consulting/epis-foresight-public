import { NextResponse } from "next/server"

export async function GET(request: Request) {
  // Firebase handles the OAuth flow with popups, so this route is just for error handling
  const { origin } = new URL(request.url)
  return NextResponse.redirect(`${origin}/auth/error`)
}
