"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, User, Phone, Mail, MapPin, MessageSquare, ShoppingBag, Edit3, Save, X } from "lucide-react"

export default function ProfilePage() {
  const { user, signOut, getAuthenticatedClient } = useAuth()
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    email: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    if (!user) {
      router.push("/login")
      return
    }

    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      email: user.email || "",
    })
  }, [user, router, mounted])

  const handleSave = async () => {
    if (!user || !mounted) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update profile")
      }

      // Update local storage with new user data
      if (typeof window !== "undefined") {
        localStorage.setItem("jamolstroy_user", JSON.stringify(result.user))
      }

      setIsEditing(false)
      alert("Profil muvaffaqiyatli yangilandi!")

      // Refresh the page to update user context
      if (typeof window !== "undefined") {
        window.location.reload()
      }
    } catch (error) {
      console.error("Profile update error:", error)
      alert("Profil yangilashda xatolik: " + (error as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (!user || !mounted) return

    setFormData({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      email: user.email || "",
    })
    setIsEditing(false)
  }

  const handleSignOut = () => {
    if (!mounted) return
    signOut()
  }

  const handleNavigation = (path: string) => {
    if (!mounted) return
    router.push(path)
  }

  const handleBack = () => {
    if (!mounted) return
    router.back()
  }

  if (!mounted) {
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={handleBack} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">Profil</h1>
            </div>

            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="p-2 rounded-lg hover:bg-muted transition-colors">
                <Edit3 className="w-5 h-5" />
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button onClick={handleCancel} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">
                {user.first_name} {user.last_name}
              </h2>
              <p className="text-muted-foreground">@{user.username || "foydalanuvchi"}</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Ism</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Ismingizni kiriting"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{user.first_name || "Kiritilmagan"}</span>
                </div>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Familiya</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Familiyangizni kiriting"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{user.last_name || "Kiritilmagan"}</span>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-2">Telefon raqam</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="+998 90 123 45 67"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{user.phone_number || "Kiritilmagan"}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="email@example.com"
                />
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email || "Kiritilmagan"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => handleNavigation("/profile/addresses")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>Manzillarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>

          <button
            onClick={() => handleNavigation("/orders")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors border-b border-border"
          >
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-5 h-5 text-muted-foreground" />
              <span>Buyurtmalarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>

          <button
            onClick={() => handleNavigation("/profile/reviews")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span>Sharhlarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Chiqish
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
