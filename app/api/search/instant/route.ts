import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "8")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ success: true, results: [] })
    }

    // Search products only for instant results
    const { data, error } = await supabase
      .from("products")
      .select(`
        id,
        name_uz,
        price,
        images,
        category:categories(name_uz)
      `)
      .eq("is_available", true)
      .gt("stock_quantity", 0)
      .or(`name_uz.ilike.%${query}%,description_uz.ilike.%${query}%`)
      .limit(limit)

    if (error) {
      console.error("Instant search error:", error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const results = (data || []).map((product) => ({
      id: product.id,
      title: product.name_uz,
      type: "product",
      image_url: product.images?.[0] || "",
      price: product.price,
      category: product.category?.name_uz || "Kategoriya yo'q",
    }))

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Instant search API error:", error)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
