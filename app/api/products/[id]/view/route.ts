import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ success: false, error: "Product ID required" }, { status: 400 })
    }

    // Call the increment function
    const { error } = await supabase.rpc("increment_product_view", {
      product_id_param: productId,
    })

    if (error) {
      console.error("View increment error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Product view API error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
