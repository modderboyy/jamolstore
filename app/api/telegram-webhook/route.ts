import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const BOT_TOKEN = "7712295404:AAGiPH07L2kwjWmSSPIIZ5E7nbuZuXn81k4"
const BOT_USERNAME = "jamolstroy_bot"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Telegram webhook received:", JSON.stringify(body, null, 2))

    // Message handling
    if (body.message) {
      const message = body.message
      const chatId = message.chat.id
      const userId = message.from.id
      const text = message.text

      // Save user info to database
      try {
        const userData = {
          telegram_id: userId.toString(),
          first_name: message.from.first_name || "",
          last_name: message.from.last_name || "",
          username: message.from.username || "",
          is_bot: message.from.is_bot || false,
        }

        await supabase.from("telegram_users").upsert(userData, {
          onConflict: "telegram_id",
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
      }

      // Handle commands
      if (text === "/start") {
        const welcomeMessage = `🏗️ JamolStroy ilovasiga xush kelibsiz!

Bizning katalogimizda qurilish materiallari va jihozlarining keng assortimenti mavjud.

📱 Web ilovani ochish uchun quyidagi tugmani bosing:`

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🛒 Ilovani ochish",
                web_app: {
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://jamolstroy.vercel.app",
                },
              },
            ],
            [
              {
                text: "📞 Aloqa",
                callback_data: "contact",
              },
              {
                text: "ℹ️ Ma'lumot",
                callback_data: "info",
              },
            ],
          ],
        }

        await sendTelegramMessage(chatId, welcomeMessage, keyboard)
      } else if (text === "/help") {
        const helpMessage = `📋 Yordam:

/start - Botni qayta ishga tushirish
/help - Yordam ma'lumotlari
/catalog - Mahsulotlar katalogi
/contact - Aloqa ma'lumotlari

🛒 Xarid qilish uchun web ilovani ishlating.`

        await sendTelegramMessage(chatId, helpMessage)
      } else if (text === "/catalog") {
        const catalogMessage = `📦 Mahsulotlar katalogi:

• Qurilish materiallari
• Elektr jihozlari
• Santexnika
• Bo'yoq va laklar
• Asboblar

🛒 To'liq katalogni ko'rish uchun web ilovani oching:`

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🛒 Katalogni ochish",
                web_app: {
                  url: `${process.env.NEXT_PUBLIC_APP_URL}/catalog` || "https://jamolstroy.vercel.app/catalog",
                },
              },
            ],
          ],
        }

        await sendTelegramMessage(chatId, catalogMessage, keyboard)
      } else if (text === "/contact") {
        const contactMessage = `📞 Aloqa ma'lumotlari:

📱 Telefon: +998 90 123 45 67
📧 Email: info@jamolstroy.uz
🌐 Website: jamolstroy.uz
📍 Manzil: Toshkent sh., Chilonzor t.

🕒 Ish vaqti:
Dushanba - Shanba: 9:00 - 18:00
Yakshanba: Dam olish kuni`

        await sendTelegramMessage(chatId, contactMessage)
      } else {
        // Default response
        const defaultMessage = `Salom! 👋

Men JamolStroy botiman. Quyidagi buyruqlardan foydalaning:

/start - Botni ishga tushirish
/catalog - Mahsulotlar katalogi
/contact - Aloqa ma'lumotlari
/help - Yordam

Yoki web ilovani ochish uchun quyidagi tugmani bosing:`

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🛒 Ilovani ochish",
                web_app: {
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://jamolstroy.vercel.app",
                },
              },
            ],
          ],
        }

        await sendTelegramMessage(chatId, defaultMessage, keyboard)
      }
    }

    // Callback query handling
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const chatId = callbackQuery.message.chat.id
      const data = callbackQuery.data

      if (data === "contact") {
        const contactMessage = `📞 Aloqa ma'lumotlari:

📱 Telefon: +998 90 123 45 67
📧 Email: info@jamolstroy.uz
🌐 Website: jamolstroy.uz
📍 Manzil: Toshkent sh., Chilonzor t.

🕒 Ish vaqti:
Dushanba - Shanba: 9:00 - 18:00
Yakshanba: Dam olish kuni`

        await sendTelegramMessage(chatId, contactMessage)
      } else if (data === "info") {
        const infoMessage = `ℹ️ JamolStroy haqida:

🏗️ Biz qurilish materiallari va jihozlari bo'yicha yetakchi kompaniyamiz.

✅ Bizning afzalliklarimiz:
• Yuqori sifatli mahsulotlar
• Raqobatbardosh narxlar
• Tez yetkazib berish
• Professional maslahat
• Kafolat xizmati

📱 Web ilovamizda 1000+ mahsulot mavjud!`

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🛒 Ilovani ochish",
                web_app: {
                  url: process.env.NEXT_PUBLIC_APP_URL || "https://jamolstroy.vercel.app",
                },
              },
            ],
          ],
        }

        await sendTelegramMessage(chatId, infoMessage, keyboard)
      }

      // Answer callback query
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          callback_query_id: callbackQuery.id,
        }),
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function sendTelegramMessage(chatId: number, text: string, replyMarkup?: any) {
  try {
    const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: "HTML",
        reply_markup: replyMarkup,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Telegram API error:", errorData)
    }

    return response.json()
  } catch (error) {
    console.error("Send message error:", error)
    throw error
  }
}
