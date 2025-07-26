import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    // Get user agent and IP for bot detection
    const userAgent = request.headers.get("user-agent") || ""
    const forwarded = request.headers.get("x-forwarded-for")
    const ip = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || ""

    // Call the increment function
    const { data, error } = await supabase.rpc("increment_product_view", {
      product_id_param: productId,
      user_agent_param: userAgent,
      ip_address_param: ip,
    })

    if (error) {
      console.error("View increment error:", error)
      return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 })
    }

    const result = data[0]
    return NextResponse.json({
      success: result.success,
      message: result.message,
      view_count: result.new_view_count,
    })
  } catch (error) {
    console.error("Product view API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
