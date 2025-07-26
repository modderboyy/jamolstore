import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const limit = Number.parseInt(searchParams.get("limit") || "8")

    if (query.trim().length < 1) {
      return NextResponse.json({ results: [] })
    }

    const { data, error } = await supabase.rpc("get_instant_search_results", {
      search_term: query.trim(),
      limit_count: limit,
    })

    if (error) {
      console.error("Instant search error:", error)
      return NextResponse.json({ error: "Search failed" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      results: data || [],
    })
  } catch (error) {
    console.error("Instant search error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
