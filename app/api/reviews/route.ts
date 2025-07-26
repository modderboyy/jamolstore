import { type NextRequest, NextResponse } from "next/server"
import { getAuthenticatedSupabase } from "@/lib/auth-supabase"

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    // Create authenticated client
    const authClient = getAuthenticatedSupabase({ id: userId } as any)

    // Get user reviews using the fixed function
    const { data: reviews, error } = await authClient.rpc("get_user_reviews", { user_id_param: userId })

    if (error) {
      console.error("Reviews fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
    }

    return NextResponse.json({ reviews: reviews || [] })
  } catch (error) {
    console.error("Reviews API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 401 })
    }

    const body = await request.json()
    const { product_id, rating, comment } = body

    if (!product_id || !rating) {
      return NextResponse.json({ error: "Product ID and rating are required" }, { status: 400 })
    }

    // Create authenticated client
    const authClient = getAuthenticatedSupabase({ id: userId } as any)

    // Create new review
    const { data: newReview, error } = await authClient
      .from("product_reviews")
      .insert([
        {
          user_id: userId,
          product_id,
          rating,
          comment: comment || "",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Review creation error:", error)
      return NextResponse.json({ error: "Failed to create review" }, { status: 500 })
    }

    return NextResponse.json({ review: newReview })
  } catch (error) {
    console.error("Review creation API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
