import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = params.id

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required" }, { status: 400 })
    }

    // Increment view count
    const { error } = await supabase
      .from("products")
      .update({
        view_count: supabase.raw("view_count + 1"),
        last_viewed_at: new Date().toISOString(),
      })
      .eq("id", productId)

    if (error) {
      console.error("Error updating view count:", error)
      return NextResponse.json({ error: "Failed to update view count" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("View tracking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
