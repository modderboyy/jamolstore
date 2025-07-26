import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "10")

    if (!query.trim()) {
      return NextResponse.json({ results: [], suggestions: [] })
    }

    // Get instant search results
    const { data: results, error: resultsError } = await supabase.rpc("get_instant_search_results", {
      search_term: query,
      limit_count: limit,
    })

    if (resultsError) {
      console.error("Search results error:", resultsError)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    // Get search suggestions
    const { data: suggestions, error: suggestionsError } = await supabase.rpc("get_search_suggestions", {
      search_term: query,
    })

    if (suggestionsError) {
      console.error("Suggestions error:", suggestionsError)
    }

    return NextResponse.json({
      results: results || [],
      suggestions: suggestions?.map((s: any) => s.suggestion) || [],
    })
  } catch (error) {
    console.error("Instant search API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
