import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ results: [] })
    }

    // Search using the fixed database function
    const { data, error } = await supabase.rpc("search_all_content", {
      search_term: query.trim(),
      limit_count: 20,
    })

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ results: [] })
    }

    // Update search suggestions
    try {
      await supabase
        .from("search_suggestions")
        .upsert(
          { query: query.trim().toLowerCase() },
          {
            onConflict: "query",
            ignoreDuplicates: false,
          },
        )
        .then(() => {
          // Increment search count
          supabase.rpc("increment_search_count", { search_query: query.trim().toLowerCase() })
        })
    } catch (suggestionError) {
      console.error("Search suggestion error:", suggestionError)
    }

    return NextResponse.json({ results: data || [] })
  } catch (error) {
    console.error("Instant search API error:", error)
    return NextResponse.json({ results: [] })
  }
}
