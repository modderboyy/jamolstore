import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ results: [] })
    }

    // Record search in history
    if (query.trim().length >= 2) {
      await supabase.from("search_history").insert({ query: query.trim() }).select()
    }

    // Get search results
    const { data, error } = await supabase.rpc("search_all_content", {
      search_term: query.trim(),
      limit_count: 10,
    })

    if (error) {
      console.error("Search error:", error)
      return NextResponse.json({ results: [] })
    }

    return NextResponse.json({ results: data || [] })
  } catch (error) {
    console.error("Instant search error:", error)
    return NextResponse.json({ results: [] })
  }
}
