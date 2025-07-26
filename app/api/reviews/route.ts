import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Get user reviews using the function
    const { data, error } = await supabase.rpc("get_user_reviews", {
      user_id_param: user.id,
    })

    if (error) {
      console.error("Reviews fetch error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, reviews: data || [] })
  } catch (error) {
    console.error("Reviews API error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const body = await request.json()

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 })
    }

    // Create review
    const { data, error } = await supabase
      .from("product_reviews")
      .insert({
        customer_id: user.id,
        product_id: body.product_id,
        rating: body.rating,
        comment: body.comment,
      })
      .select()
      .single()

    if (error) {
      console.error("Review create error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, review: data })
  } catch (error) {
    console.error("Review create API error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
