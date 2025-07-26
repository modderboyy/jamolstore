import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Get user ID from headers (if authenticated)
    const userId = request.headers.get("x-user-id")

    // Record product view
    const { error: viewError } = await supabase.from("product_views").insert([
      {
        product_id: productId,
        user_id: userId || null,
        viewed_at: new Date().toISOString(),
      },
    ])

    if (viewError) {
      console.error("View recording error:", viewError)
    }

    // Update product view count
    const { error: updateError } = await supabase.rpc("increment_product_views", { product_id: productId })

    if (updateError) {
      console.error("View count update error:", updateError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product view API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
