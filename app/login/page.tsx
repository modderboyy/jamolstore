"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, loginWithTelegram } = useAuth()
  const { isTelegramWebApp, isReady, user: tgUser } = useTelegram()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Telegram Web App da avtomatik login
  useEffect(() => {
    if (isReady && isTelegramWebApp && tgUser && !user) {
      handleTelegramAutoLogin()
    }
  }, [isReady, isTelegramWebApp, tgUser, user])

  const handleTelegramAutoLogin = async () => {
    setLoading(true)
    setError("")

    try {
      const telegramData = {
        telegram_id: tgUser!.id.toString(),
        first_name: tgUser!.first_name,
        last_name: tgUser!.last_name || "",
        username: tgUser!.username || "",
      }

      await loginWithTelegram(telegramData)
      setSuccess("Muvaffaqiyatli kirildi!")
      setTimeout(() => router.push("/"), 1000)
    } catch (error: any) {
      console.error("Telegram auto login error:", error)
      setError("Telegram orqali kirishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramLogin = async () => {
    setLoading(true)
    setError("")

    try {
      // Telegram botga yo'naltirish
      const botUrl = `https://t.me/jamolstroy_bot?start=web_login`
      window.open(botUrl, "_blank", "width=400,height=600")

      setSuccess("Telegram botni oching va 'Kirish' tugmasini bosing")
    } catch (error: any) {
      console.error("Telegram login error:", error)
      setError("Telegram orqali kirishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  // Telegram Web App da loading ko'rsatish
  if (isTelegramWebApp && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Tizimga kirilmoqda...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header - faqat oddiy web da */}
      {!isTelegramWebApp && (
        <div className="bg-card border-b border-border p-4">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.push("/")} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Hisobga kirish</h1>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isTelegramWebApp ? "Xush kelibsiz!" : "Telegram orqali kirish"}
            </h2>
            <p className="text-muted-foreground">
              {isTelegramWebApp
                ? "Tizimga avtomatik kirilmoqda..."
                : "Telegram botimiz orqali tez va xavfsiz tarzda hisobingizga kirasiz"}
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Faqat oddiy web da login tugmasini ko'rsatish */}
          {!isTelegramWebApp && (
            <div className="space-y-4">
              <button
                onClick={handleTelegramLogin}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground rounded-xl py-4 flex items-center justify-center space-x-3 hover:bg-primary/90 transition-all font-semibold disabled:opacity-50 shadow-clean ios-button"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <MessageCircle className="w-5 h-5" />
                )}
                <span>{loading ? "Ochilmoqda..." : "Telegram orqali kirish"}</span>
              </button>

              <div className="text-center text-sm text-muted-foreground">
                <p>Telegram botimizga o'tib, "Kirish" tugmasini bosing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
