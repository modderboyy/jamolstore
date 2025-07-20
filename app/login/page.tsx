"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Loader2, MessageCircle, Phone, Mail, ExternalLink } from "lucide-react"
import { v4 as uuidv4 } from "uuid"

export default function LoginPage() {
  const router = useRouter()
  const { user, loading, loginWithPhone, loginWithEmail } = useAuth()
  const { isTelegramWebApp } = useTelegram()

  const [phoneNumber, setPhoneNumber] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [telegramLoginUrl, setTelegramLoginUrl] = useState("")
  const [loginToken, setLoginToken] = useState("")
  const [loginStatus, setLoginStatus] = useState<"pending" | "approved" | "rejected" | null>(null)

  useEffect(() => {
    if (user) {
      router.push("/")
    }
  }, [user, router])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (loginToken && loginStatus === "pending") {
      // Poll for login status
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/website-login?token=${loginToken}`)
          const data = await response.json()

          if (data.status === "approved" && data.user) {
            setLoginStatus("approved")
            localStorage.setItem("jamolstroy_user", JSON.stringify(data.user))
            window.location.href = "/"
          } else if (data.status === "rejected") {
            setLoginStatus("rejected")
          }
        } catch (error) {
          console.error("Login status check error:", error)
        }
      }, 2000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [loginToken, loginStatus])

  const handleTelegramLogin = async () => {
    try {
      setIsLoading(true)
      const clientId = uuidv4()

      const response = await fetch("/api/website-login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ client_id: clientId }),
      })

      const data = await response.json()

      if (response.ok) {
        setLoginToken(data.login_token)
        setTelegramLoginUrl(data.telegram_url)
        setLoginStatus("pending")

        // Open Telegram
        window.open(data.telegram_url, "_blank")
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error("Telegram login error:", error)
      alert("Telegram login xatoligi")
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phoneNumber.trim()) return

    try {
      setIsLoading(true)
      await loginWithPhone(phoneNumber)
      router.push("/")
    } catch (error) {
      console.error("Phone login error:", error)
      alert("Telefon raqam orqali kirish xatoligi")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    try {
      setIsLoading(true)
      await loginWithEmail(email)
      router.push("/")
    } catch (error) {
      console.error("Email login error:", error)
      alert("Email orqali kirish xatoligi")
    } finally {
      setIsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </div>
    )
  }

  if (isTelegramWebApp) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Telegram Web App</CardTitle>
            <CardDescription>Siz allaqachon Telegram orqali kirgansiz</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/")} className="w-full">
              Bosh sahifaga o'tish
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">JamolStroy</CardTitle>
          <CardDescription>Hisobingizga kiring</CardDescription>
        </CardHeader>
        <CardContent>
          {loginStatus === "pending" ? (
            <div className="text-center space-y-4">
              <div className="animate-pulse">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Telegram orqali tasdiqlang</h3>
              <p className="text-muted-foreground text-sm">Telegram botga o'ting va login so'rovini tasdiqlang</p>
              {telegramLoginUrl && (
                <Button variant="outline" onClick={() => window.open(telegramLoginUrl, "_blank")} className="w-full">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Telegram botni ochish
                </Button>
              )}
              <Button
                variant="ghost"
                onClick={() => {
                  setLoginStatus(null)
                  setLoginToken("")
                  setTelegramLoginUrl("")
                }}
                className="w-full"
              >
                Bekor qilish
              </Button>
            </div>
          ) : loginStatus === "rejected" ? (
            <div className="text-center space-y-4">
              <div className="text-red-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4" />
              </div>
              <h3 className="text-lg font-semibold">Login rad etildi</h3>
              <p className="text-muted-foreground text-sm">Telegram orqali login rad etildi</p>
              <Button
                onClick={() => {
                  setLoginStatus(null)
                  setLoginToken("")
                  setTelegramLoginUrl("")
                }}
                className="w-full"
              >
                Qayta urinish
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="telegram" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="telegram">Telegram</TabsTrigger>
                <TabsTrigger value="phone">Telefon</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              <TabsContent value="telegram" className="space-y-4">
                <div className="text-center space-y-4">
                  <MessageCircle className="h-12 w-12 mx-auto text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Telegram orqali kirish</h3>
                    <p className="text-muted-foreground text-sm">
                      Xavfsiz va tez kirish uchun Telegram akkauntingizdan foydalaning
                    </p>
                  </div>
                  <Button onClick={handleTelegramLogin} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yuklanmoqda...
                      </>
                    ) : (
                      <>
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Telegram orqali kirish
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="phone" className="space-y-4">
                <form onSubmit={handlePhoneLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon raqam</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+998 90 123 45 67"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yuklanmoqda...
                      </>
                    ) : (
                      <>
                        <Phone className="h-4 w-4 mr-2" />
                        Telefon orqali kirish
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email manzil</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Yuklanmoqda...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Email orqali kirish
                      </>
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
