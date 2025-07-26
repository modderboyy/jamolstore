import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [], suggestions: [] })
    }

    // Search all content
    const { data: results, error: searchError } = await supabase.rpc("search_all_content", {
      search_query: query.trim(),
    })

    if (searchError) {
      console.error("Search error:", searchError)
      return NextResponse.json({ results: [], suggestions: [] })
    }

    // Get search suggestions
    const { data: suggestions, error: suggestionsError } = await supabase.rpc("get_search_suggestions", {
      search_query: query.trim(),
    })

    if (suggestionsError) {
      console.error("Suggestions error:", suggestionsError)
    }

    return NextResponse.json({
      results: results || [],
      suggestions: suggestions || [],
    })
  } catch (error) {
    console.error("Instant search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
