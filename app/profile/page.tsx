"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShoppingBag,
  Star,
  Edit,
  LogOut,
  AlertTriangle,
  Building2,
} from "lucide-react"
import Image from "next/image"

interface UserStats {
  totalOrders: number
  totalSpent: number
  averageRating: number
  joinDate: string
}

interface CompanyInfo {
  id: string
  name: string
  version: string
  logo_url: string
  phone_number: string
  location: string
  time: string
  social_telegram: string
  social_x: string
  social_youtube: string
  social_instagram: string
  description: string
}

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"profile" | "company">("profile")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [mathQuestion, setMathQuestion] = useState("")
  const [mathAnswer, setMathAnswer] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState(0)
  const [showFinalConfirm, setShowFinalConfirm] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchUserStats()
    fetchCompanyInfo()
  }, [user, router])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Fetch user orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .eq("customer_id", user.id)

      if (ordersError) throw ordersError

      const totalOrders = orders?.length || 0
      const totalSpent = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      setStats({
        totalOrders,
        totalSpent,
        averageRating: 4.8, // Mock rating
        joinDate: user.created_at,
      })
    } catch (error) {
      console.error("Error fetching user stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("company")
        .select("*")
        .eq("version", "1.0.0")
        .eq("is_active", true)
        .single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company info error:", error)
    }
  }

  const generateMathQuestion = () => {
    const operations = ["+", "-", "*"]
    const operation = operations[Math.floor(Math.random() * operations.length)]
    let num1, num2, answer

    switch (operation) {
      case "+":
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        answer = num1 + num2
        break
      case "-":
        num1 = Math.floor(Math.random() * 20) + 10
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 - num2
        break
      case "*":
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        answer = num1 * num2
        break
      default:
        num1 = 2
        num2 = 2
        answer = 4
    }

    setMathQuestion(`${num1} ${operation} ${num2} = ?`)
    setCorrectAnswer(answer)
  }

  const handleLogoutClick = () => {
    generateMathQuestion()
    setShowLogoutConfirm(true)
    setMathAnswer("")
    setShowFinalConfirm(false)
  }

  const handleMathSubmit = () => {
    if (Number.parseInt(mathAnswer) === correctAnswer) {
      setShowFinalConfirm(true)
    } else {
      alert("Noto'g'ri javob! Qaytadan urinib ko'ring.")
      generateMathQuestion()
      setMathAnswer("")
    }
  }

  const handleFinalLogout = async () => {
    try {
      // Clear all website login sessions for this user
      if (user) {
        await supabase.from("website_login_sessions").delete().eq("user_id", user.id)
      }

      // Sign out
      signOut()
      router.push("/")
    } catch (error) {
      console.error("Error during logout:", error)
      signOut()
      router.push("/")
    }
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex bg-muted rounded-lg p-1 mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
              activeTab === "profile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profilim</span>
          </button>
          <button
            onClick={() => setActiveTab("company")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-all duration-200 ${
              activeTab === "company"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Kompaniya</span>
          </button>
        </div>

        {activeTab === "profile" ? (
          <>
            {/* Profile Header */}
            <div className="bg-card rounded-xl border border-border p-6 mb-6">
              <div className="flex items-start space-x-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground text-2xl font-bold">
                    {user.first_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-2">
                    {user.first_name} {user.last_name}
                  </h1>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {user.phone_number && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4" />
                        <span>{user.phone_number}</span>
                      </div>
                    )}
                    {user.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>A'zo bo'lgan: {formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <ShoppingBag className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <div className="text-sm text-muted-foreground">Buyurtmalar</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{formatPrice(stats.totalSpent)}</div>
                  <div className="text-sm text-muted-foreground">Jami xarid</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">{stats.averageRating}</div>
                  <div className="text-sm text-muted-foreground">Reyting</div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4 text-center">
                  <User className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold">VIP</div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-3 mb-6">
              <button
                onClick={() => router.push("/orders")}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="font-medium">Buyurtmalarim</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>

              <button
                onClick={() => router.push("/cart")}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <span className="font-medium">Savatcha</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>

              <button
                onClick={() => router.push("/profile/addresses")}
                className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span className="font-medium">Manzillarim</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>

              <button className="w-full flex items-center justify-between p-4 bg-card rounded-xl border border-border hover:border-primary/20 transition-colors">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5 text-primary" />
                  <span className="font-medium">Sharhlarim</span>
                </div>
                <span className="text-muted-foreground">→</span>
              </button>
            </div>

            {/* Logout Section */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Xavfsizlik
              </h3>
              <button
                onClick={handleLogoutClick}
                className="w-full flex items-center justify-center space-x-2 bg-red-500 text-white py-3 px-6 rounded-lg hover:bg-red-600 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Hisobdan chiqish</span>
              </button>
            </div>
          </>
        ) : (
          /* Company Tab */
          <div className="space-y-6">
            {companyInfo && (
              <>
                {/* Company Header */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      {companyInfo.logo_url ? (
                        <Image
                          src={companyInfo.logo_url || "/placeholder.svg"}
                          alt={companyInfo.name}
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <Building2 className="w-8 h-8 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold mb-2">{companyInfo.name}</h1>
                      <p className="text-muted-foreground mb-4">
                        {companyInfo.description || "Qurilish materiallari va xizmatlar"}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                          Versiya {companyInfo.version}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Aloqa ma'lumotlari</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-primary" />
                      <span>{companyInfo.phone_number}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span>{companyInfo.location}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span>Ish vaqti: {companyInfo.time}</span>
                    </div>
                  </div>
                </div>

                {/* Social Media */}
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold mb-4">Ijtimoiy tarmoqlar</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {companyInfo.social_telegram && (
                      <a
                        href={`https://t.me/${companyInfo.social_telegram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-950/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">T</span>
                        </div>
                        <span className="text-blue-600 dark:text-blue-400">Telegram</span>
                      </a>
                    )}
                    {companyInfo.social_instagram && (
                      <a
                        href={`https://instagram.com/${companyInfo.social_instagram.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-950/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">I</span>
                        </div>
                        <span className="text-pink-600 dark:text-pink-400">Instagram</span>
                      </a>
                    )}
                    {companyInfo.social_youtube && (
                      <a
                        href={`https://youtube.com/${companyInfo.social_youtube.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">Y</span>
                        </div>
                        <span className="text-red-600 dark:text-red-400">YouTube</span>
                      </a>
                    )}
                    {companyInfo.social_x && (
                      <a
                        href={`https://x.com/${companyInfo.social_x.replace("@", "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-950/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-950/30 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-bold">X</span>
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">X (Twitter)</span>
                      </a>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center">Hisobdan chiqish</h3>

            {!showFinalConfirm ? (
              <>
                <p className="text-sm text-muted-foreground mb-4 text-center">
                  Xavfsizlik uchun quyidagi savolga javob bering:
                </p>
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold mb-2">{mathQuestion}</div>
                  <input
                    type="number"
                    value={mathAnswer}
                    onChange={(e) => setMathAnswer(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all text-center"
                    placeholder="Javobni kiriting"
                    autoFocus
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleMathSubmit}
                    disabled={!mathAnswer}
                    className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Tekshirish
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-6 text-center">
                  Rozimisiz o'chirishga? Bu amalni bekor qilib bo'lmaydi.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Yo'q
                  </button>
                  <button
                    onClick={handleFinalLogout}
                    className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Ha, chiqish
                  </button>
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
