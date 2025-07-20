"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { TopBar } from "@/components/layout/top-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Phone,
  Mail,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  MessageCircle,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
} from "lucide-react"

interface UserStats {
  totalOrders: number
  totalSpent: number
  favoriteProducts: number
}

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()
  const { isTelegramWebApp } = useTelegram()
  const router = useRouter()

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  })
  const [userStats, setUserStats] = useState<UserStats>({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mathQuestion, setMathQuestion] = useState({ question: "", answer: 0 })
  const [mathAnswer, setMathAnswer] = useState("")
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        if (!isTelegramWebApp) {
          router.push("/login")
        }
        return
      }
      setEditForm({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        email: user.email || "",
      })
      fetchUserStats()
    }
  }, [user, loading, router, isTelegramWebApp])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Get total orders and spent amount
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("customer_id", user.id)

      if (ordersError) throw ordersError

      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      // Get favorite products count (if you have a favorites table)
      // For now, we'll set it to 0
      const favoriteProducts = 0

      setUserStats({
        totalOrders,
        totalSpent,
        favoriteProducts,
      })
    } catch (error) {
      console.error("Foydalanuvchi statistikasini yuklashda xatolik:", error)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      const { error } = await supabase
        .from("users")
        .update({
          first_name: editForm.first_name,
          last_name: editForm.last_name,
          phone_number: editForm.phone_number,
          email: editForm.email,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Update local storage
      const updatedUser = {
        ...user,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        phone_number: editForm.phone_number,
        email: editForm.email,
      }
      localStorage.setItem("jamolstroy_user", JSON.stringify(updatedUser))

      setIsEditing(false)
      // Refresh the page to get updated user data
      window.location.reload()
    } catch (error) {
      console.error("Profilni yangilashda xatolik:", error)
      alert("Profilni yangilashda xatolik yuz berdi")
    } finally {
      setIsSaving(false)
    }
  }

  const generateMathQuestion = () => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]

    let answer = 0
    let question = ""

    switch (operation) {
      case "+":
        answer = num1 + num2
        question = `${num1} + ${num2}`
        break
      case "-":
        answer = num1 - num2
        question = `${num1} - ${num2}`
        break
      case "*":
        answer = num1 * num2
        question = `${num1} × ${num2}`
        break
    }

    setMathQuestion({ question, answer })
  }

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true)
    generateMathQuestion()
    setMathAnswer("")
    setShowFinalConfirm(false)
  }

  const handleMathSubmit = () => {
    if (Number.parseInt(mathAnswer) === mathQuestion.answer) {
      setShowFinalConfirm(true)
    } else {
      alert("Noto'g'ri javob! Qaytadan urinib ko'ring.")
      generateMathQuestion()
      setMathAnswer("")
    }
  }

  const handleFinalLogout = async () => {
    try {
      // Clear all sessions from database if needed
      if (user) {
        await supabase.from("website_login_sessions").delete().eq("user_id", user.id)
      }

      // Sign out and clear local storage
      signOut()
      router.push("/")
    } catch (error) {
      console.error("Chiqishda xatolik:", error)
    }
    setShowLogoutConfirm(false)
    setShowFinalConfirm(false)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Tizimga kiring</h2>
            <p className="text-muted-foreground mb-6">Profilingizni ko'rish uchun tizimga kiring</p>
            <Button onClick={() => router.push("/login")}>Tizimga kirish</Button>
          </div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">
                    {user.first_name} {user.last_name}
                  </CardTitle>
                  <CardDescription className="flex items-center space-x-2">
                    {user.username && (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>@{user.username}</span>
                      </>
                    )}
                    {user.is_verified && (
                      <Badge variant="secondary" className="ml-2">
                        <Shield className="w-3 h-3 mr-1" />
                        Tasdiqlangan
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)} disabled={isSaving}>
                {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Ism</Label>
                    <Input
                      id="first_name"
                      value={editForm.first_name}
                      onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                      placeholder="Ismingizni kiriting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Familiya</Label>
                    <Input
                      id="last_name"
                      value={editForm.last_name}
                      onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                      placeholder="Familiyangizni kiriting"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone_number">Telefon raqam</Label>
                    <Input
                      id="phone_number"
                      type="tel"
                      value={editForm.phone_number}
                      onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                      placeholder="+998 90 123 45 67"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button onClick={handleSaveProfile} disabled={isSaving} className="flex-1">
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saqlanmoqda...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Saqlash
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isSaving}>
                    Bekor qilish
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {user.phone_number && (
                  <div className="flex items-center space-x-3">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{user.phone_number}</span>
                  </div>
                )}
                {user.email && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>Ro'yxatdan o'tgan: {formatDate(user.created_at)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.totalOrders}</p>
                  <p className="text-sm text-muted-foreground">Jami buyurtmalar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">₽</span>
                </div>
                <div>
                  <p className="text-2xl font-bold">{formatPrice(userStats.totalSpent)}</p>
                  <p className="text-sm text-muted-foreground">Jami xarajat</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{userStats.favoriteProducts}</p>
                  <p className="text-sm text-muted-foreground">Sevimli mahsulotlar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Tez harakatlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => router.push("/orders")}
            >
              <ShoppingBag className="w-4 h-4 mr-3" />
              Buyurtmalarim
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start bg-transparent"
              onClick={() => router.push("/catalog")}
            >
              <Settings className="w-4 h-4 mr-3" />
              Katalog
            </Button>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Hisob ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Telegram ID</span>
              <span className="font-mono text-sm">{user.telegram_id}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Foydalanuvchi ID</span>
              <span className="font-mono text-sm">{user.id.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Rol</span>
              <Badge variant="secondary">{user.role || "customer"}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Oxirgi yangilanish</span>
              <span className="text-sm">{formatDate(user.updated_at)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Logout Section */}
        <Card>
          <CardContent className="p-6">
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogoutClick}>
              <LogOut className="w-4 h-4 mr-3" />
              Hisobdan chiqish
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg p-6 w-full max-w-md">
            {!showFinalConfirm ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Matematik savol</h3>
                <p className="text-muted-foreground mb-4">Hisobdan chiqish uchun quyidagi savolga javob bering:</p>
                <div className="text-center mb-4">
                  <span className="text-2xl font-bold">{mathQuestion.question} = ?</span>
                </div>
                <Input
                  type="number"
                  value={mathAnswer}
                  onChange={(e) => setMathAnswer(e.target.value)}
                  placeholder="Javobni kiriting"
                  className="mb-4"
                />
                <div className="flex space-x-3">
                  <Button onClick={handleMathSubmit} className="flex-1">
                    Tekshirish
                  </Button>
                  <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="flex-1">
                    Bekor qilish
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-4">Tasdiqlash</h3>
                <p className="text-muted-foreground mb-6">
                  Rozimisiz hisobdan chiqishga? Barcha sessiyalar o'chiriladi.
                </p>
                <div className="flex space-x-3">
                  <Button variant="destructive" onClick={handleFinalLogout} className="flex-1">
                    Ha, chiqish
                  </Button>
                  <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} className="flex-1">
                    Yo'q, qolish
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
