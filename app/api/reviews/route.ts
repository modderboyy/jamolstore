import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    // Get bearer token from Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization token required" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, rating, comment } = body

    // Validate input
    if (!product_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Product ID and valid rating (1-5) are required" }, { status: 400 })
    }

    // Check if user has purchased this product
    const { data: orderCheck, error: orderError } = await supabase
      .from("order_items")
      .select("id")
      .eq("product_id", product_id)
      .in("order_id", supabase.from("orders").select("id").eq("customer_id", user.id).eq("status", "completed"))
      .limit(1)

    if (orderError || !orderCheck || orderCheck.length === 0) {
      return NextResponse.json({ error: "You can only review products you have purchased" }, { status: 403 })
    }

    // Check if user has already reviewed this product
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", product_id)
      .eq("customer_id", user.id)
      .limit(1)

    if (reviewCheckError) {
      return NextResponse.json({ error: "Failed to check existing reviews" }, { status: 500 })
    }

    if (existingReview && existingReview.length > 0) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 })
    }

    // Add the review
    const { data: review, error: insertError } = await supabase
      .from("product_reviews")
      .insert({
        product_id,
        customer_id: user.id,
        rating,
        comment: comment?.trim() || null,
        is_verified: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Review insert error:", insertError)
      return NextResponse.json({ error: "Failed to add review" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      review,
    })
  } catch (error) {
    console.error("Review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
