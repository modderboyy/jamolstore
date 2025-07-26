import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase } from "@/lib/auth-supabase"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    // Create authenticated client
    const authClient = getAuthenticatedSupabase({ id: userId } as any)

    // Get user profile
    const { data: profile, error } = await authClient.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Profile fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error("Profile API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
