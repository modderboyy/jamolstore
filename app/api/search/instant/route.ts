import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ products: [], suggestions: [] })
    }

    const supabase = createSupabaseClient()

    // Get search results
    const { data: products, error: searchError } = await supabase.rpc("search_products_fuzzy", {
      search_term: query.trim(),
      limit_count: limit,
    })

    if (searchError) {
      console.error("Search error:", searchError)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Get search suggestions
    const { data: suggestions, error: suggestionsError } = await supabase.rpc("get_search_suggestions", {
      search_term: query.trim(),
      limit_count: 5,
    })

    if (suggestionsError) {
      console.error("Suggestions error:", suggestionsError)
    }

    return NextResponse.json({
      products: products || [],
      suggestions: suggestions || [],
      query: query.trim(),
    })
  } catch (error) {
    console.error("Instant search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
