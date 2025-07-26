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
      .select("user_id")
      .eq("session_token", token)
      .eq("is_active", true)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (sessionError || !sessionData) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // Get user reviews using the secure function
    const { data, error } = await supabase.rpc("get_user_reviews", {
      user_id_param: sessionData.user_id,
    })

    if (error) {
      console.error("Reviews fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      reviews: data || [],
    })
  } catch (error) {
    console.error("Reviews fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    // Create new review
    const { data, error } = await supabase
      .from("reviews")
      .insert({
        user_id: sessionData.user_id,
        product_id: body.product_id,
        rating: body.rating,
        comment: body.comment,
      })
      .select()
      .single()

    if (error) {
      console.error("Review creation error:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      review: data,
    })
  } catch (error) {
    console.error("Review creation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
