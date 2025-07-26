import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function PUT(request: NextRequest) {
  try {
    // Get user ID from custom header
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { first_name, last_name, phone_number, email } = body

    // Use the secure function to update profile
    const { data, error } = await supabase.rpc("update_user_profile", {
      user_id_param: userId,
      first_name_param: first_name || null,
      last_name_param: last_name || null,
      phone_number_param: phone_number || null,
      email_param: email || null,
    })

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: data[0],
      message: "Profile updated successfully",
    })
  } catch (error) {
    console.error("Profile update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
