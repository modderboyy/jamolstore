import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Get user from session
    const { data: sessionData, error: sessionError } = await supabase
      .from("website_login_sessions")
      .select(`
        user_id,
        users!inner(*)
      `)
      .eq("session_token", token)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    return NextResponse.json({
      success: true,
      user: sessionData.users,
    })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
