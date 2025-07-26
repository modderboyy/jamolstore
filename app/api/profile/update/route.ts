import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const body = await request.json()

    // Get user from session
    const { data: sessionData, error: sessionError } = await supabase
      .from("website_login_sessions")
      .select("user_id")
      .eq("session_token", token)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Update user profile using the secure function
    const { data, error } = await supabase.rpc("update_user_profile", {
      user_id_param: sessionData.user_id,
      first_name_param: body.first_name || null,
      last_name_param: body.last_name || null,
      phone_number_param: body.phone_number || null,
      email_param: body.email || null,
    })

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data[0],
    })
  } catch (error) {
    console.error("Profile update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
