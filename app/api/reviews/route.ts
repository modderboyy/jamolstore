import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { productId, orderId, rating, comment, userId } = body

    // Validate required fields
    if (!productId || !orderId || !rating || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user exists
    const { data: user, error: userError } = await supabase.from("users").select("id").eq("id", userId).single()

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if order belongs to user and contains this product
    const { data: orderItem, error: orderError } = await supabase
      .from("order_items")
      .select(`
        id,
        orders!inner(
          id,
          customer_id,
          status
        )
      `)
      .eq("product_id", productId)
      .eq("order_id", orderId)
      .eq("orders.customer_id", userId)
      .in("orders.status", ["delivered", "completed"])
      .single()

    if (orderError || !orderItem) {
      return NextResponse.json({ error: "Order not found or not eligible for review" }, { status: 403 })
    }

    // Check if review already exists
    const { data: existingReview, error: reviewCheckError } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("customer_id", userId)
      .eq("order_id", orderId)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "Review already exists for this product" }, { status: 409 })
    }

    // Create review
    const { data: review, error: createError } = await supabase
      .from("product_reviews")
      .insert({
        product_id: productId,
        customer_id: userId,
        order_id: orderId,
        rating: Number.parseInt(rating),
        comment: comment?.trim() || null,
        is_verified: true, // Since we verified the purchase
      })
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return NextResponse.json({
      success: true,
      review,
      message: "Review submitted successfully",
    })
  } catch (error) {
    console.error("Review submission error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
