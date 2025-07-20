import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"

const BOT_TOKEN = "7712295404:AAGiPH07L2kwjWmSSPIIZ5E7nbuZuXn81k4"

export async function POST(request: NextRequest) {
  try {
    const { client_id } = await request.json()

    if (!client_id) {
      return NextResponse.json({ error: "Client ID required" }, { status: 400 })
    }

    // Generate unique login token
    const loginToken = uuidv4()

    // Create login session
    const { data: session, error: sessionError } = await supabase
      .from("website_login_sessions")
      .insert([
        {
          login_token: loginToken,
          client_id: client_id,
          status: "pending",
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        },
      ])
      .select()
      .single()

    if (sessionError) {
      console.error("Session creation error:", sessionError)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    // Create Telegram bot deep link
    const telegramUrl = `https://t.me/jamolstroy_bot?start=login_${loginToken}`

    return NextResponse.json({
      login_token: loginToken,
      telegram_url: telegramUrl,
      expires_at: session.expires_at,
    })
  } catch (error) {
    console.error("Website login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const loginToken = searchParams.get("token")

    if (!loginToken) {
      return NextResponse.json({ error: "Token required" }, { status: 400 })
    }

    // Check login session status
    const { data: session, error: sessionError } = await supabase
      .from("website_login_sessions")
      .select(`
        *,
        user:users(*)
      `)
      .eq("login_token", loginToken)
      .single()

    if (sessionError) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: "Session expired" }, { status: 410 })
    }

    return NextResponse.json({
      status: session.status,
      user: session.user,
      expires_at: session.expires_at,
    })
  } catch (error) {
    console.error("Login status check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
