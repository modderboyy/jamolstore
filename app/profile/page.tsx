"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { TopBar } from "@/components/layout/top-bar"
import {
  Phone,
  ShoppingBag,
  Heart,
  Settings,
  LogOut,
  Edit3,
  Star,
  Calendar,
  Shield,
  Award,
  MessageCircle,
} from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  const { user, profile, loading, signOut } = useAuth()
  const { webApp, isTelegramWebApp } = useTelegram()
  const router = useRouter()
  const [orderCount, setOrderCount] = useState(0)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [stats, setStats] = useState({
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  })

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        if (!isTelegramWebApp) {
          router.push("/login")
        }
        return
      }
      fetchUserStats()
    }
  }, [user, profile, loading, router, isTelegramWebApp])

  const fetchUserStats = async () => {
    if (!user) return

    try {
      // Buyurtmalar sonini olish
      const { count: totalOrders, error: ordersError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id)

      if (ordersError) throw ordersError

      // Tugallangan buyurtmalar
      const { count: completedOrders, error: completedError } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("customer_id", user.id)
        .eq("status", "delivered")

      if (completedError) throw completedError

      // Jami sarflangan pul
      const { data: ordersData, error: spentError } = await supabase
        .from("orders")
        .select("total_amount")
        .eq("customer_id", user.id)
        .eq("status", "delivered")

      if (spentError) throw spentError

      const totalSpent = ordersData?.reduce((sum, order) => sum + order.total_amount, 0) || 0

      setStats({
        totalOrders: totalOrders || 0,
        completedOrders: completedOrders || 0,
        totalSpent,
      })
      setOrderCount(totalOrders || 0)
    } catch (error) {
      console.error("Statistikalarni yuklashda xatolik:", error)
    }
  }

  const handleSignOut = async () => {
    if (isSigningOut) return

    if (isTelegramWebApp) {
      webApp?.showConfirm("Tizimdan chiqishni xohlaysizmi?", (confirmed: boolean) => {
        if (confirmed) {
          performSignOut()
        }
      })
    } else {
      performSignOut()
    }
  }

  const performSignOut = async () => {
    setIsSigningOut(true)
    try {
      await signOut()
      if (isTelegramWebApp) {
        webApp?.showAlert("Tizimdan muvaffaqiyatli chiqildi")
        webApp?.close()
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Chiqishda xatolik:", error)
      if (isTelegramWebApp) {
        webApp?.showAlert("Chiqishda xatolik yuz berdi")
      }
    } finally {
      setIsSigningOut(false)
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
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      label: "Buyurtmalarim",
      value: `${stats.totalOrders} ta`,
      href: "/orders",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      icon: Heart,
      label: "Sevimlilar",
      value: "",
      href: "/favorites",
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      icon: Settings,
      label: "Sozlamalar",
      value: "",
      href: "/settings",
      color: "text-gray-600",
      bgColor: "bg-gray-100",
    },
  ]

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Profil</h1>
          <button className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Edit3 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-br from-card to-card/80 rounded-2xl p-6 border border-border mb-6 shadow-sm">
          <div className="flex items-center space-x-6 mb-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-primary/20">
              {profile.avatar_url || profile.telegram_photo_url ? (
                <Image
                  src={profile.avatar_url || profile.telegram_photo_url || "/placeholder.svg"}
                  alt={`${profile.first_name} ${profile.last_name}`}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-primary font-bold text-3xl">
                    {profile.first_name[0]}
                    {profile.last_name[0]}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">
                {profile.first_name} {profile.last_name}
              </h2>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{profile.phone_number}</span>
                </div>
                {profile.telegram_username && (
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">@{profile.telegram_username}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{formatDate(profile.created_at)} dan beri</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">{stats.totalOrders}</div>
              <div className="text-sm text-muted-foreground">Buyurtmalar</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 mb-1">{stats.completedOrders}</div>
              <div className="text-sm text-muted-foreground">Tugallangan</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {stats.totalSpent > 0 ? formatPrice(stats.totalSpent / 1000) + "K" : "0"}
              </div>
              <div className="text-sm text-muted-foreground">Sarflangan</div>
            </div>
          </div>
        </div>

        {/* Achievement Badge */}
        {stats.completedOrders >= 5 && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-2xl p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Sodiq mijoz</h3>
                <p className="text-sm text-yellow-700">5+ buyurtma tugallangani uchun</p>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6 shadow-sm">
          {menuItems.map((item, index) => {
            const Icon = item.icon
            return (
              <button
                key={item.label}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors ${
                  index !== menuItems.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <span className="font-medium text-lg">{item.label}</span>
                </div>
                <div className="flex items-center space-x-3">
                  {item.value && <span className="text-muted-foreground">{item.value}</span>}
                  <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Security Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-green-800">Hisob himoyalangan</h3>
              <p className="text-sm text-green-700">Telegram orqali xavfsiz kirish</p>
            </div>
          </div>
        </div>

        {/* Worker Profile Section */}
        {profile.role === "worker" && (
          <div className="bg-card rounded-2xl p-6 border border-border mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Ishchi profili</h3>
              <button className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors">
                Tahrirlash
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Holat</span>
                <span className="font-medium text-green-600">Faol</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reyting</span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">5.0</span>
                  <span className="text-sm text-muted-foreground">(0 sharh)</span>
                </div>
              </div>

              <button className="w-full bg-primary text-primary-foreground rounded-lg py-3 font-medium hover:bg-primary/90 transition-colors">
                Profil sozlamalari
              </button>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full bg-gradient-to-r from-destructive to-destructive/90 text-destructive-foreground rounded-2xl py-4 font-semibold hover:from-destructive/90 hover:to-destructive transition-all duration-300 disabled:opacity-50 flex items-center justify-center space-x-3 shadow-lg"
        >
          {isSigningOut ? (
            <div className="w-5 h-5 border-2 border-destructive-foreground/30 border-t-destructive-foreground rounded-full animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          <span>{isSigningOut ? "Chiqilmoqda..." : "Tizimdan chiqish"}</span>
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
