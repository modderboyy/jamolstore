"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, User, Phone, Mail, Camera, Save, MapPin, MessageSquare, Package, LogOut } from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    if (user) {
      fetchUserData()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchUserData = async () => {
    if (!user) return

    try {
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${user.access_token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setPhoneNumber(data.phone_number || "")
        setAvatarUrl(data.avatar_url || "")
      }
    } catch (error) {
      console.error("Profile fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !firstName.trim() || !lastName.trim()) {
      alert("Ism va familiya majburiy")
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: phoneNumber.trim(),
          avatar_url: avatarUrl.trim(),
        }),
      })

      if (response.ok) {
        alert("Profil muvaffaqiyatli yangilandi")
        setIsEditing(false)
        fetchUserData() // Refresh data
      } else {
        const error = await response.json()
        alert(error.error || "Profilni yangilashda xatolik")
      }
    } catch (error) {
      console.error("Profile update error:", error)
      alert("Profilni yangilashda xatolik yuz berdi")
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    if (confirm("Haqiqatan ham chiqmoqchimisiz?")) {
      await logout()
      router.push("/login")
    }
  }

  if (isLoading) {
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
    router.push("/login")
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Profil</h1>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Tahrirlash
            </button>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Profile Info */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-24 h-24 bg-muted rounded-full overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl || "/placeholder.svg"}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <User className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              {isEditing && (
                <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ism *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                      placeholder="Ismingizni kiriting"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-muted rounded-lg">{firstName || "Kiritilmagan"}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Familiya *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                      placeholder="Familiyangizni kiriting"
                    />
                  ) : (
                    <p className="px-3 py-2 bg-muted rounded-lg">{lastName || "Kiritilmagan"}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Telefon raqam</label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="+998 90 123 45 67"
                  />
                ) : (
                  <p className="px-3 py-2 bg-muted rounded-lg flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-muted-foreground" />
                    {phoneNumber || "Kiritilmagan"}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <p className="px-3 py-2 bg-muted rounded-lg flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  {user.email}
                </p>
              </div>

              {isEditing && (
                <div>
                  <label className="block text-sm font-medium mb-2">Avatar URL</label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="https://example.com/avatar.jpg"
                  />
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex space-x-3 w-full">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !firstName.trim() || !lastName.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Saqlash
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <button
            onClick={() => router.push("/profile/addresses")}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-muted-foreground" />
              <span>Manzillarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
          </button>

          <button
            onClick={() => router.push("/profile/reviews")}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <span>Sharhlarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
          </button>

          <button
            onClick={() => router.push("/orders")}
            className="w-full px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors border-b border-border"
          >
            <div className="flex items-center space-x-3">
              <Package className="w-5 h-5 text-muted-foreground" />
              <span>Buyurtmalarim</span>
            </div>
            <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
          </button>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-4 flex items-center space-x-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600"
          >
            <LogOut className="w-5 h-5" />
            <span>Chiqish</span>
          </button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
