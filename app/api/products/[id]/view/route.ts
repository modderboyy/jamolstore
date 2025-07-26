import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Skip database operations during build time
    if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ success: true })
    }

    // Only import and use Supabase if environment variables are available
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const { createSupabaseClient } = await import("@/lib/supabase")
      const supabase = createSupabaseClient()

      const { error } = await supabase.rpc("increment_product_view", {
        product_id_param: productId,
      })

      if (error) {
        console.error("Error incrementing view count:", error)
        return NextResponse.json({ error: "Failed to increment view count" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
