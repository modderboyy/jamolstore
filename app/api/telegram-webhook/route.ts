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
      // =================== LOGIC TUZATILDI ===================

      // 1. Eng avvalo "deep link" orqali loginni tekshiramiz
      if (text && text.startsWith("/start login_")) {
        // Website login request
        const loginToken = text.replace("/start login_", "") // Tokenni to'g'ri ajratib olamiz
        console.log("Login request received for token:", loginToken)

        // Check if login session exists
        const { data: session, error: sessionError } = await supabase
          .from("website_login_sessions")
          .select("*")
          .eq("login_token", loginToken)
          .eq("status", "pending")
          .single()

        if (sessionError || !session) {
          console.log("Login session not found or expired")
          await sendTelegramMessage(chatId, "❌ Login sessiyasi topilmadi yoki muddati tugagan.")
          return NextResponse.json({ ok: true })
        }

        // Send permission request
        const permissionMessage = `🔐 Website login so'rovi

JamolStroy websaytiga kirishga ruxsat berasizmi?

👤 Sizning ma'lumotlaringiz:
• Ism: ${message.from.first_name} ${message.from.last_name || ""}
• Username: @${message.from.username || "yo'q"}

⚠️ Faqat o'zingiz so'ragan bo'lsangina ruxsat bering!`

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "✅ Ruxsat berish",
                callback_data: `approve_${loginToken}`,
              },
              {
                text: "❌ Rad etish",
                callback_data: `reject_${loginToken}`,
              },
            ],
          ],
        }

        await sendTelegramMessage(chatId, permissionMessage, keyboard)
      
      // 2. Keyin oddiy /start buyrug'ini tekshiramiz
      } else if (text === "/start") {
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

      // 3. Qolgan buyruqlar avvalgidek qoladi
      } else if (text === "/help") {
        const helpMessage = `📋 Yordam:

/start - Botni qayta ishgabb tushirish
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

    // Callback query handling (BU QISM O'ZGARTIRILMADI)
    if (body.callback_query) {
      const callbackQuery = body.callback_query
      const chatId = callbackQuery.message.chat.id
      const userId = callbackQuery.from.id
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
      } else if (data.startsWith("approve_")) {
        // Approve login
        const loginToken = data.replace("approve_", "")
        console.log("Login approved for token:", loginToken)

        try {
          // Get user data
          const userData = {
            telegram_id: userId.toString(),
            first_name: callbackQuery.from.first_name || "",
            last_name: callbackQuery.from.last_name || "",
            username: callbackQuery.from.username || "",
            is_verified: true,
          }

          // Create or update user
          const { data: user, error: userError } = await supabase
            .from("users")
            .upsert(userData, {
              onConflict: "telegram_id",
            })
            .select()
            .single()

          if (userError) throw userError

          // Update login session
          const { error: updateError } = await supabase
            .from("website_login_sessions")
            .update({
              status: "approved",
              user_id: user.id,
              approved_at: new Date().toISOString(),
            })
            .eq("login_token", loginToken)

          if (updateError) throw updateError

          await sendTelegramMessage(chatId, "✅ Login muvaffaqiyatli tasdiqlandi! Websaytga qaytishingiz mumkin.")

          // Edit the original message
          await editTelegramMessage(chatId, callbackQuery.message.message_id, "✅ Login tasdiqlandi")
        } catch (error) {
          console.error("Login approval error:", error)
          await sendTelegramMessage(chatId, "❌ Login tasdiqlanishida xatolik yuz berdi.")
        }
      } else if (data.startsWith("reject_")) {
        // Reject login
        const loginToken = data.replace("reject_", "")
        console.log("Login rejected for token:", loginToken)

        try {
          // Update login session
          const { error: updateError } = await supabase
            .from("website_login_sessions")
            .update({
              status: "rejected",
              approved_at: new Date().toISOString(),
            })
            .eq("login_token", loginToken)

          if (updateError) throw updateError

          await sendTelegramMessage(chatId, "❌ Login rad etildi.")

          // Edit the original message
          await editTelegramMessage(chatId, callbackQuery.message.message_id, "❌ Login rad etildi")
        } catch (error) {
          console.error("Login rejection error:", error)
          await sendTelegramMessage(chatId, "❌ Login rad etishda xatolik yuz berdi.")
        }
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
