"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { ArrowLeft, MessageCircle, AlertCircle, CheckCircle, Clock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, checkWebsiteLoginStatus } = useAuth()
  const { isTelegramWebApp, isReady } = useTelegram()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [waitingForLogin, setWaitingForLogin] = useState(false)
  const [loginToken, setLoginToken] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    // URL dan login token tekshirish
    const token = searchParams.get("login_token")
    if (token) {
      handleLoginTokenCheck(token)
    }
  }, [searchParams])

  const handleLoginTokenCheck = async (token: string) => {
    setLoading(true)
    try {
      const loginUser = await checkWebsiteLoginStatus(token)
      if (loginUser) {
        setSuccess("Muvaffaqiyatli kirildi!")
        setTimeout(() => router.push("/"), 1000)
      } else {
        setError("Login sessiyasi topilmadi yoki muddati tugagan")
      }
    } catch (error) {
      console.error("Login token check error:", error)
      setError("Login tekshirishda xatolik yuz berdi")
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramLogin = async () => {
    setLoading(true)
    setError("")
    setWaitingForLogin(true)

    try {
      // Unique login token yaratish
      const token = `${Date.now()}_${Math.random().toString(36).substring(2)}`
      const timestamp = Date.now()
      const clientId = "jamolstroy_web"

      setLoginToken(token)

      // Telegram botga yo'naltirish
      const botUrl = `https://t.me/jamolstroy_bot?start=website_login_${token}_${timestamp}_${clientId}`
      window.open(botUrl, "_blank", "width=400,height=600")

      // Login holatini kuzatish
      checkLoginStatus(token)
    } catch (error: any) {
      console.error("Telegram login error:", error)
      setError("Telegram orqali kirishda xatolik yuz berdi")
      setLoading(false)
      setWaitingForLogin(false)
    }
  }

  const checkLoginStatus = async (token: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 daqiqa

    const checkStatus = async () => {
      try {
        attempts++

        const loginUser = await checkWebsiteLoginStatus(token)

        if (loginUser) {
          // Muvaffaqiyatli login
          setSuccess("Muvaffaqiyatli kirildi!")
          setWaitingForLogin(false)
          setLoading(false)
          setTimeout(() => router.push("/"), 1000)
        } else if (attempts >= maxAttempts) {
          // Vaqt tugadi
          setError("Login vaqti tugadi. Qaytadan urinib ko'ring.")
          setWaitingForLogin(false)
          setLoading(false)
        } else {
          // Kutishda davom etish
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error("Login status check error:", error)
        if (attempts >= maxAttempts) {
          setError("Xatolik yuz berdi")
          setWaitingForLogin(false)
          setLoading(false)
        } else {
          setTimeout(checkStatus, 2000)
        }
      }
    }

    checkStatus()
  }

  const resetLogin = () => {
    setLoading(false)
    setWaitingForLogin(false)
    setLoginToken(null)
    setError("")
    setSuccess("")
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

  // Telegram Web App da login sahifasini ko'rsatmaslik
  if (isTelegramWebApp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Xush kelibsiz!</h2>
          <p className="text-muted-foreground">Siz allaqachon tizimga kirgansiz</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.push("/")} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Hisobga kirish</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Waiting for Login */}
        {waitingForLogin && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Kutilmoqda...</h2>
              <p className="text-muted-foreground">Telegram botda "Ruxsat berish" tugmasini bosing</p>
            </div>

            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Agar bot oynasi ochilmagan bo'lsa:</p>
              <button
                onClick={() => {
                  if (loginToken) {
                    const timestamp = Date.now()
                    const clientId = "jamolstroy_web"
                    const botUrl = `https://t.me/jamolstroy_bot?start=website_login_${loginToken}_${timestamp}_${clientId}`
                    window.open(botUrl, "_blank", "width=400,height=600")
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
              >
                Botni ochish
              </button>
            </div>

            <button
              onClick={resetLogin}
              className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Bekor qilish
            </button>
          </div>
        )}

        {/* Login Form */}
        {!waitingForLogin && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-10 h-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Telegram orqali kirish</h2>
              <p className="text-muted-foreground">
                Telegram botimiz orqali tez va xavfsiz tarzda hisobingizga kirasiz
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
                <p>Telegram botimizga o'tib, "Ruxsat berish" tugmasini bosing</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
