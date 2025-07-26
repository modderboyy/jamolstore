import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { productId, orderId, rating, comment } = body

    if (!productId || !orderId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 })
    }

    // Check if user has already reviewed this product for this order
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("order_id", orderId)
      .single()

    if (existingReview) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 400 })
    }

    // Verify that the user actually ordered this product
    const { data: orderItem } = await supabase
      .from("order_items")
      .select("id, orders!inner(user_id)")
      .eq("order_id", orderId)
      .eq("product_id", productId)
      .single()

    if (!orderItem || orderItem.orders.user_id !== userId) {
      return NextResponse.json({ error: "You can only review products you have ordered" }, { status: 403 })
    }

    // Create the review
    const { data: review, error } = await supabase
      .from("reviews")
      .insert([
        {
          user_id: userId,
          product_id: productId,
          order_id: orderId,
          rating,
          comment: comment?.trim() || null,
          is_verified: true, // Since we verified the order
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Review creation error:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error("Review API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get("productId")
    const userId = request.headers.get("x-user-id")

    if (!productId) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 })
    }

    // Get reviews for the product
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        is_verified,
        created_at,
        users!inner(first_name, last_name, avatar_url)
      `)
      .eq("product_id", productId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Reviews fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    // Check if current user has reviewed this product
    let userReview = null
    if (userId) {
      const { data } = await supabase
        .from("reviews")
        .select("id, rating, comment")
        .eq("product_id", productId)
        .eq("user_id", userId)
        .single()

      userReview = data
    }

    return NextResponse.json({
      reviews: reviews || [],
      userReview,
      totalReviews: reviews?.length || 0,
      averageRating: reviews?.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
    })
  } catch (error) {
    console.error("Reviews GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
