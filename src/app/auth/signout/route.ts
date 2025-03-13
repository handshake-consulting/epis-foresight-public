import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const cookieStore = await cookies()

  // Clear the auth token cookie
  cookieStore.delete('auth-token')

  return NextResponse.redirect(new URL("/login", request.url))
}
