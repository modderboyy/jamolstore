"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Plus, Home, Trash2, MapPin } from "lucide-react"

interface Address {
  id: string
  name: string
  address: string
  city?: string
  region?: string
  is_default: boolean
  created_at: string
}

export default function AddressesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [newAddressName, setNewAddressName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newCity, setNewCity] = useState("")
  const [newRegion, setNewRegion] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAddresses()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_user_addresses", {
        user_id_param: user.id,
      })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error("Addresses fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAddress = async () => {
    if (!user || !newAddressName.trim() || !newAddress.trim()) {
      alert("Manzil nomi va to'liq manzil majburiy")
      return
    }

    setIsSubmitting(true)

    try {
      const { data, error } = await supabase.rpc("add_user_address", {
        user_id_param: user.id,
        name_param: newAddressName.trim(),
        address_param: newAddress.trim(),
        city_param: newCity.trim(),
        region_param: newRegion.trim(),
        is_default_param: isDefault || addresses.length === 0,
      })

      if (error) throw error

      const result = data[0]
      if (result.success) {
        alert("Manzil muvaffaqiyatli qo'shildi")
        setNewAddressName("")
        setNewAddress("")
        setNewCity("")
        setNewRegion("")
        setIsDefault(false)
        setShowAddForm(false)
        fetchAddresses()
      } else {
        alert(result.message || "Manzil qo'shishda xatolik")
      }
    } catch (error) {
      console.error("Address add error:", error)
      alert("Manzil qo'shishda xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirmoqchimisiz?")) return

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", user?.id)

      if (error) throw error

      alert("Manzil o'chirildi")
      fetchAddresses()
    } catch (error) {
      console.error("Address delete error:", error)
      alert("Manzilni o'chirishda xatolik")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // First, unset all defaults
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user?.id)

      // Then set the selected one as default
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user?.id)

      if (error) throw error

      fetchAddresses()
    } catch (error) {
      console.error("Set default error:", error)
      alert("Asosiy manzilni o'rnatishda xatolik")
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
            <h1 className="text-xl font-bold">Manzillarim</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Add Address Form */}
        {showAddForm && (
          <div className="bg-card rounded-lg border border-border p-4">
            <h3 className="text-lg font-semibold mb-4">Yangi manzil qo'shish</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Manzil nomi *</label>
                <input
                  type="text"
                  value={newAddressName}
                  onChange={(e) => setNewAddressName(e.target.value)}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Masalan: Uy, Ish, Do'stim uyi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To'liq manzil *</label>
                <textarea
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                  placeholder="Ko'cha, uy raqami va boshqa ma'lumotlar"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Shahar</label>
                  <input
                    type="text"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Shahar nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Viloyat</label>
                  <input
                    type="text"
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Viloyat nomi"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="w-4 h-4 text-primary bg-muted border-gray-300 rounded focus:ring-primary/20"
                />
                <label htmlFor="isDefault" className="text-sm">
                  Asosiy manzil sifatida belgilash
                </label>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  onClick={handleAddAddress}
                  disabled={isSubmitting || !newAddressName.trim() || !newAddress.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Qo'shilmoqda..." : "Saqlash"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Hech qanday manzil yo'q</h3>
            <p className="text-muted-foreground mb-4">Yetkazib berish uchun manzil qo'shing</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Birinchi manzilni qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-card rounded-lg border p-4 ${
                  address.is_default ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Home className={`w-4 h-4 ${address.is_default ? "text-primary" : "text-muted-foreground"}`} />
                      <span className="font-medium">{address.name}</span>
                      {address.is_default && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                          Asosiy
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{address.address}</p>
                    {(address.city || address.region) && (
                      <p className="text-xs text-muted-foreground">
                        {[address.city, address.region].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Asosiy qilish"
                      >
                        <Home className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
