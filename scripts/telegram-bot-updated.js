const TelegramBot = require("node-telegram-bot-api")
const { createClient } = require("@supabase/supabase-js")

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Initialize bot
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

console.log("JamolStroy Telegram Bot started...")

// Start command
bot.onText(/\/start(.*)/, async (msg, match) => {
  const chatId = msg.chat.id
  const user = msg.from
  const startParam = match[1]?.trim()

  console.log(`Start command from user ${user.id}: ${user.first_name}`)

  try {
    // Check if user exists in database
    let { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", user.id.toString())
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      throw fetchError
    }

    // Create user if doesn't exist
    if (!existingUser) {
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          telegram_id: user.id.toString(),
          first_name: user.first_name,
          last_name: user.last_name || "",
          username: user.username || null,
        })
        .select()
        .single()

      if (createError) throw createError
      existingUser = newUser
      console.log("New user created:", existingUser)
    }

    // Handle website login if start parameter exists
    if (startParam && startParam.includes("_")) {
      const [tempToken, clientId] = startParam.split("_")
      await handleWebsiteLogin(chatId, user, tempToken, clientId)
      return
    }

    // Send welcome message
    const welcomeMessage = `
🏗️ *JamolStroy ilovasiga xush kelibsiz!*

Salom ${user.first_name}! 👋

Bu bot orqali siz:
• 🛒 Qurilish materiallarini ko'rishingiz
• 📱 Veb-ilovaga kirishingiz
• 📞 Bog'lanishingiz mumkin

Quyidagi tugmalardan birini tanlang:`

    const keyboard = {
      inline_keyboard: [
        [{ text: "🌐 Veb-ilovani ochish", web_app: { url: process.env.NEXT_PUBLIC_APP_URL } }],
        [
          { text: "📞 Bog'lanish", callback_data: "contact" },
          { text: "❓ Yordam", callback_data: "help" },
        ],
      ],
    }

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error("Start command error:", error)
    await bot.sendMessage(chatId, "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
  }
})

// Handle website login
async function handleWebsiteLogin(chatId, user, tempToken, clientId) {
  try {
    console.log(`Website login request: ${tempToken}_${clientId}`)

    // Find the login session
    const { data: session, error: sessionError } = await supabase
      .from("website_login_sessions")
      .select("*")
      .eq("temp_token", tempToken)
      .eq("client_id", clientId)
      .eq("status", "pending")
      .single()

    if (sessionError || !session) {
      await bot.sendMessage(chatId, "❌ Login sessiyasi topilmadi yoki muddati tugagan.")
      return
    }

    // Get user info
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", user.id.toString())
      .single()

    if (userError) {
      await bot.sendMessage(chatId, "❌ Foydalanuvchi ma'lumotlari topilmadi.")
      return
    }

    // Show user info and ask for permission
    const userInfo = `
🔐 *Veb-saytga kirish so'rovi*

👤 *Foydalanuvchi ma'lumotlari:*
• Ism: ${userData.first_name} ${userData.last_name || ""}
• Username: ${userData.username ? "@" + userData.username : "Yo'q"}
• Telefon: ${userData.phone || "Kiritilmagan"}

🌐 *Sayt:* ${process.env.NEXT_PUBLIC_APP_URL}

Ushbu ma'lumotlar bilan saytga kirishga ruxsat berasizmi?`

    const keyboard = {
      inline_keyboard: [
        [
          { text: "✅ Ruxsat berish", callback_data: `approve_${tempToken}_${clientId}` },
          { text: "❌ Rad etish", callback_data: `reject_${tempToken}_${clientId}` },
        ],
      ],
    }

    await bot.sendMessage(chatId, userInfo, {
      parse_mode: "Markdown",
      reply_markup: keyboard,
    })
  } catch (error) {
    console.error("Website login error:", error)
    await bot.sendMessage(chatId, "❌ Login jarayonida xatolik yuz berdi.")
  }
}

// Handle callback queries
bot.on("callback_query", async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id
  const messageId = callbackQuery.message.message_id
  const data = callbackQuery.data
  const user = callbackQuery.from

  try {
    if (data.startsWith("approve_")) {
      const [, tempToken, clientId] = data.split("_")

      // Get user data
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", user.id.toString())
        .single()

      if (userError) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: "Xatolik yuz berdi!" })
        return
      }

      // Update session as approved
      const { error: updateError } = await supabase
        .from("website_login_sessions")
        .update({
          status: "approved",
          user_id: userData.id,
          approved_at: new Date().toISOString(),
        })
        .eq("temp_token", tempToken)
        .eq("client_id", clientId)

      if (updateError) throw updateError

      // Update message
      await bot.editMessageText("✅ *Kirish tasdiqlandi!*\n\nSiz muvaffaqiyatli tizimga kirdingiz.", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
      })

      await bot.answerCallbackQuery(callbackQuery.id, { text: "Kirish tasdiqlandi!" })
    } else if (data.startsWith("reject_")) {
      const [, tempToken, clientId] = data.split("_")

      // Update session as rejected
      const { error: updateError } = await supabase
        .from("website_login_sessions")
        .update({
          status: "rejected",
          approved_at: new Date().toISOString(),
        })
        .eq("temp_token", tempToken)
        .eq("client_id", clientId)

      if (updateError) throw updateError

      // Update message
      await bot.editMessageText("❌ *Kirish rad etildi!*\n\nTizimga kirish bekor qilindi.", {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: "Markdown",
      })

      await bot.answerCallbackQuery(callbackQuery.id, { text: "Kirish rad etildi!" })
    } else if (data === "contact") {
      const contactMessage = `
📞 *Bog'lanish ma'lumotlari*

🏢 **JamolStroy**
📱 Telefon: +998 90 123 45 67
📧 Email: info@jamolstroy.uz
🌐 Sayt: ${process.env.NEXT_PUBLIC_APP_URL}
📍 Manzil: Toshkent, O'zbekiston

🕒 **Ish vaqti:**
Dushanba - Juma: 9:00 - 18:00
Shanba: 9:00 - 15:00
Yakshanba: Dam olish kuni`

      await bot.sendMessage(chatId, contactMessage, { parse_mode: "Markdown" })
      await bot.answerCallbackQuery(callbackQuery.id)
    } else if (data === "help") {
      const helpMessage = `
❓ **Yordam**

**Bot buyruqlari:**
• /start - Botni qayta ishga tushirish
• /help - Yordam ma'lumotlari

**Veb-ilova funksiyalari:**
• 🛒 Mahsulotlarni ko'rish va xarid qilish
• 📦 Buyurtmalar tarixi
• 👤 Profil boshqaruvi
• 🚚 Yetkazib berish ma'lumotlari

**Qo'llab-quvvatlash:**
Agar sizda savollar bo'lsa, /start buyrug'i orqali bog'lanish tugmasini bosing.`

      await bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" })
      await bot.answerCallbackQuery(callbackQuery.id)
    }
  } catch (error) {
    console.error("Callback query error:", error)
    await bot.answerCallbackQuery(callbackQuery.id, { text: "Xatolik yuz berdi!" })
  }
})

// Handle contact sharing
bot.on("contact", async (msg) => {
  const chatId = msg.chat.id
  const user = msg.from
  const contact = msg.contact

  try {
    // Update user phone number
    const { error } = await supabase
      .from("users")
      .update({ phone: contact.phone_number })
      .eq("telegram_id", user.id.toString())

    if (error) throw error

    await bot.sendMessage(chatId, "✅ Telefon raqamingiz saqlandi!")
  } catch (error) {
    console.error("Contact sharing error:", error)
    await bot.sendMessage(chatId, "❌ Telefon raqamini saqlashda xatolik yuz berdi.")
  }
})

// Handle errors
bot.on("error", (error) => {
  console.error("Bot error:", error)
})

// Handle polling errors
bot.on("polling_error", (error) => {
  console.error("Polling error:", error)
})

console.log("Bot is running...")
