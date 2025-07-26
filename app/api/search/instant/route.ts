import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ products: [], suggestions: [] })
    }

    const searchTerm = query.trim()

    // Get products using fuzzy search
    const { data: products, error: productsError } = await supabase.rpc("search_products_fuzzy", {
      search_term: searchTerm,
    })

    if (productsError) {
      console.error("Products search error:", productsError)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Get search suggestions
    const { data: suggestions, error: suggestionsError } = await supabase.rpc("get_product_suggestions", {
      search_term: searchTerm,
    })

    if (suggestionsError) {
      console.error("Suggestions error:", suggestionsError)
    }

    return NextResponse.json({
      products: products || [],
      suggestions: suggestions || [],
      query: searchTerm,
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
