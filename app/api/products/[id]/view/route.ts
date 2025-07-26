import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id
    const userAgent = request.headers.get("user-agent") || ""

    // Increment view count with bot protection
    const { error } = await supabase.rpc("increment_product_view", {
      product_id_param: productId,
      user_agent: userAgent,
    })

    if (error) {
      console.error("View increment error:", error)
      return NextResponse.json({ error: "Failed to increment view" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product view API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
