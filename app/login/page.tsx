"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { ArrowLeft, Phone, MessageCircle, AlertCircle, CheckCircle, Clock } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const { user, loginWithTelegram, loginWithPhone } = useAuth()
  const { isTelegramWebApp, isReady } = useTelegram()
  const [loading, setLoading] = useState(false)
  const [showOtpLogin, setShowOtpLogin] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [waitingForOtp, setWaitingForOtp] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  // Telegram Web App da login sahifasini ko'rsatmaslik
  useEffect(() => {
    if (isReady && isTelegramWebApp) {
      router.push("/")
    }
  }, [isReady, isTelegramWebApp, router])

  const handleTelegramLogin = async () => {
    setLoading(true)
    setError("")

    try {
      // Session token yaratish
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      setSessionToken(token)

      // Telegram botga login so'rovi yuborish
      const botUrl = `https://t.me/jamolstroy_bot?start=web_login_${token}`
      window.open(botUrl, "_blank", "width=400,height=600")

      // Login holatini kuzatish
      setWaitingForOtp(true)
      checkLoginStatus(token)
    } catch (error: any) {
      console.error("Telegram login error:", error)
      setError("Telegram orqali kirishda xatolik yuz berdi")
      setLoading(false)
    }
  }

  const checkLoginStatus = async (token: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 daqiqa

    const checkStatus = async () => {
      try {
        attempts++

        // Login session holatini tekshirish
        const response = await fetch(`/api/check-login-session?token=${token}`)
        const data = await response.json()

        if (data.success && data.user) {
          // Muvaffaqiyatli login
          const userData = await loginWithTelegram(data.user)
          setSuccess("Muvaffaqiyatli kirildi!")
          setWaitingForOtp(false)
          setTimeout(() => router.push("/"), 1000)
        } else if (data.rejected) {
          // Login rad etildi
          setError("Login rad etildi")
          setWaitingForOtp(false)
          setLoading(false)
        } else if (attempts >= maxAttempts) {
          // Vaqt tugadi
          setError("Login vaqti tugadi. Qaytadan urinib ko'ring.")
          setWaitingForOtp(false)
          setLoading(false)
        } else {
          // Kutishda davom etish
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error("Login status check error:", error)
        if (attempts >= maxAttempts) {
          setError("Xatolik yuz berdi")
          setWaitingForOtp(false)
          setLoading(false)
        } else {
          setTimeout(checkStatus, 2000)
        }
      }
    }

    checkStatus()
  }

  const handlePhoneLogin = async () => {
    if (!phoneNumber.trim()) {
      setError("Telefon raqamni kiriting")
      return
    }

    setLoading(true)
    setError("")

    try {
      // Session token yaratish
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)
      setSessionToken(token)

      // Telegram botga OTP so'rovi yuborish
      const cleanPhone = phoneNumber.replace(/\D/g, "")
      const botUrl = `https://t.me/jamolstroy_bot?start=otp_login_${token}_${cleanPhone}`
      window.open(botUrl, "_blank", "width=400,height=600")

      // OTP holatini kuzatish
      setWaitingForOtp(true)
      checkOtpStatus(token)
    } catch (error: any) {
      console.error("Phone login error:", error)
      setError("Telefon orqali kirishda xatolik yuz berdi")
      setLoading(false)
    }
  }

  const checkOtpStatus = async (token: string) => {
    let attempts = 0
    const maxAttempts = 60 // 2 daqiqa

    const checkStatus = async () => {
      try {
        attempts++

        // OTP session holatini tekshirish
        const response = await fetch(`/api/check-otp-session?token=${token}`)
        const data = await response.json()

        if (data.success && data.user) {
          // Muvaffaqiyatli OTP
          const userData = await loginWithPhone(data.user.phone_number)
          setSuccess("Muvaffaqiyatli kirildi!")
          setWaitingForOtp(false)
          setTimeout(() => router.push("/"), 1000)
        } else if (data.rejected) {
          // OTP rad etildi
          setError("OTP rad etildi")
          setWaitingForOtp(false)
          setLoading(false)
        } else if (attempts >= maxAttempts) {
          // Vaqt tugadi
          setError("OTP vaqti tugadi. Qaytadan urinib ko'ring.")
          setWaitingForOtp(false)
          setLoading(false)
        } else {
          // Kutishda davom etish
          setTimeout(checkStatus, 2000)
        }
      } catch (error) {
        console.error("OTP status check error:", error)
        if (attempts >= maxAttempts) {
          setError("Xatolik yuz berdi")
          setWaitingForOtp(false)
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
    setWaitingForOtp(false)
    setSessionToken(null)
    setError("")
    setSuccess("")
    setPhoneNumber("")
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
    return null
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
        {/* Waiting for Login/OTP */}
        {waitingForOtp && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-10 h-10 text-primary animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Kutilmoqda...</h2>
              <p className="text-muted-foreground">
                {showOtpLogin ? "Telegram botda OTP kodni tasdiqlang" : "Telegram botda login tugmasini bosing"}
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                Agar bot oynasi ochilmagan bo'lsa, quyidagi tugmani bosing:
              </p>
              <button
                onClick={() => {
                  if (sessionToken) {
                    const botUrl = showOtpLogin
                      ? `https://t.me/jamolstroy_bot?start=otp_login_${sessionToken}_${phoneNumber.replace(/\D/g, "")}`
                      : `https://t.me/jamolstroy_bot?start=web_login_${sessionToken}`
                    window.open(botUrl, "_blank", "width=400,height=600")
                  }
                }}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
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

        {/* Login Forms */}
        {!waitingForOtp && (
          <>
            {!showOtpLogin ? (
              /* Telegram Login */
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

                  <div className="text-center">
                    <button
                      onClick={() => setShowOtpLogin(true)}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm underline"
                    >
                      Telefon raqam orqali kirish
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Phone Login */
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Phone className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Telefon orqali kirish</h2>
                  <p className="text-muted-foreground">
                    Telefon raqamingizni kiriting, Telegram botimizga OTP kod yuboramiz
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
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Telefon raqam</label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+998 90 123 45 67"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>

                  <button
                    onClick={handlePhoneLogin}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-4 flex items-center justify-center space-x-3 hover:bg-primary/90 transition-all font-semibold disabled:opacity-50 shadow-clean ios-button"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <Phone className="w-5 h-5" />
                    )}
                    <span>{loading ? "Yuborilmoqda..." : "OTP kod olish"}</span>
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowOtpLogin(false)
                        setError("")
                        setSuccess("")
                        setPhoneNumber("")
                      }}
                      className="text-muted-foreground hover:text-foreground transition-colors text-sm underline"
                    >
                      Telegram orqali kirishga qaytish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
