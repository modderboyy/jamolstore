import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Increment view count using the database function
    const { error } = await supabase.rpc("increment_product_view", {
      product_id_param: productId,
    })

    if (error) {
      console.error("Error incrementing view count:", error)
      return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View increment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
