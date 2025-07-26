import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase } from "@/lib/auth-supabase"

export async function PUT(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, phone_number, email } = body

    // Create authenticated client
    const authClient = getAuthenticatedSupabase({ id: userId } as any)

    // Update user profile
    const { data: updatedProfile, error } = await authClient
      .from("users")
      .update({
        first_name,
        last_name,
        phone_number,
        email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
