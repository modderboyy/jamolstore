import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
      language_code?: string
    }
    chat: {
      id: number
      first_name: string
      last_name?: string
      username?: string
      type: string
    }
    date: number
    text?: string
    contact?: {
      phone_number: string
      first_name: string
      last_name?: string
      user_id: number
    }
  }
  callback_query?: {
    id: string
    from: {
      id: number
      is_bot: boolean
      first_name: string
      last_name?: string
      username?: string
    }
    message: {
      message_id: number
      chat: {
        id: number
      }
    }
    data: string
  }
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup,
      parse_mode: "HTML",
    }),
  })

  return response.json()
}

async function editTelegramMessage(chatId: number, messageId: number, text: string, replyMarkup?: any) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
      reply_markup: replyMarkup,
      parse_mode: "HTML",
    }),
  })

  return response.json()
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
    }),
  })

  return response.json()
}

export async function POST(request: NextRequest) {
  try {
    const body: TelegramUpdate = await request.json()

    // Handle regular messages
    if (body.message) {
      const { message } = body
      const telegramId = message.from.id
      const chatId = message.chat.id

      // Handle /start command
      if (message.text === "/start") {
        // Check if user exists
        const { data: existingUser } = await supabase.from("users").select("*").eq("telegram_id", telegramId).single()

        if (existingUser) {
          // User exists, send welcome message with web app
          await sendTelegramMessage(
            chatId,
            `Salom, ${existingUser.first_name}! 👋\n\nJamolStroy do'koniga xush kelibsiz!`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🛒 Do'konni ochish",
                    web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` },
                  },
                ],
              ],
            },
          )
        } else {
          // New user, request contact
          await sendTelegramMessage(
            chatId,
            `Salom! 👋\n\nJamolStroy do'koniga xush kelibsiz!\n\nIltimos, telefon raqamingizni ulashing:`,
            {
              keyboard: [
                [
                  {
                    text: "📱 Telefon raqamni ulashish",
                    request_contact: true,
                  },
                ],
              ],
              resize_keyboard: true,
              one_time_keyboard: true,
            },
          )
        }
      }

      // Handle contact sharing
      if (message.contact) {
        const contact = message.contact
        const phoneNumber = contact.phone_number
        const firstName = contact.first_name
        const lastName = contact.last_name || ""

        try {
          // Create new user
          const { data: newUser, error } = await supabase
            .from("users")
            .insert({
              telegram_id: telegramId,
              first_name: firstName,
              last_name: lastName,
              phone_number: phoneNumber,
              username: message.from.username || null,
              is_verified: true,
              role: "customer",
            })
            .select()
            .single()

          if (error) throw error

          // Send success message with web app
          await sendTelegramMessage(
            chatId,
            `Rahmat, ${firstName}! ✅\n\nSizning hisobingiz muvaffaqiyatli yaratildi.\n\nEndi do'kondan xarid qilishingiz mumkin:`,
            {
              inline_keyboard: [
                [
                  {
                    text: "🛒 Do'konni ochish",
                    web_app: { url: `${process.env.NEXT_PUBLIC_APP_URL}` },
                  },
                ],
              ],
              remove_keyboard: true,
            },
          )
        } catch (error) {
          console.error("Error creating user:", error)
          await sendTelegramMessage(chatId, "Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.")
        }
      }
    }

    // Handle callback queries (button presses)
    if (body.callback_query) {
      const { callback_query } = body
      const callbackData = callback_query.data
      const chatId = callback_query.message.chat.id
      const messageId = callback_query.message.message_id

      await answerCallbackQuery(callback_query.id)

      // Handle website login approval/rejection
      if (callbackData?.startsWith("approve_login_") || callbackData?.startsWith("reject_login_")) {
        const [action, , tempToken, clientId] = callbackData.split("_")

        if (action === "approve") {
          // Update session as approved
          const { error } = await supabase
            .from("website_login_sessions")
            .update({
              status: "approved",
              approved_at: new Date().toISOString(),
            })
            .eq("temp_token", tempToken)
            .eq("client_id", clientId)

          if (!error) {
            await editTelegramMessage(
              chatId,
              messageId,
              "✅ Veb-saytga kirish tasdiqlandi!\n\nSiz endi brauzeringizda tizimga kirishingiz mumkin.",
            )
          }
        } else if (action === "reject") {
          // Update session as rejected
          const { error } = await supabase
            .from("website_login_sessions")
            .update({
              status: "rejected",
              approved_at: new Date().toISOString(),
            })
            .eq("temp_token", tempToken)
            .eq("client_id", clientId)

          if (!error) {
            await editTelegramMessage(
              chatId,
              messageId,
              "❌ Veb-saytga kirish rad etildi.\n\nAgar bu siz bo'lmasangiz, hech qanday harakat talab qilinmaydi.",
            )
          }
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Telegram webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ message: "Telegram webhook endpoint" })
}
