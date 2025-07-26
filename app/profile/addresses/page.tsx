"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Plus, Home, Edit, Trash2, MapPin } from "lucide-react"

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
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    region: "",
    is_default: false,
  })

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    fetchAddresses()
  }, [user, router])

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
      setLoading(false)
    }
  }

  const handleAddAddress = async () => {
    if (!user || !formData.name.trim() || !formData.address.trim()) {
      alert("Iltimos, majburiy maydonlarni to'ldiring")
      return
    }

    try {
      const { data, error } = await supabase.rpc("add_user_address", {
        user_id_param: user.id,
        name_param: formData.name.trim(),
        address_param: formData.address.trim(),
        city_param: formData.city.trim() || null,
        region_param: formData.region.trim() || null,
        is_default_param: formData.is_default,
      })

      if (error) throw error

      if (data.success) {
        alert(data.message)
        setFormData({ name: "", address: "", city: "", region: "", is_default: false })
        setShowAddForm(false)
        fetchAddresses()
      } else {
        alert(data.message)
      }
    } catch (error) {
      console.error("Add address error:", error)
      alert("Manzil qo'shishda xatolik yuz berdi")
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirishni xohlaysizmi?")) return

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Delete address error:", error)
      alert("Manzilni o'chirishda xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // First, unset all defaults
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user?.id)

      // Then set the selected one as default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Set default error:", error)
      alert("Asosiy manzilni o'rnatishda xatolik yuz berdi")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "short",
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

      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Manzillarim</h1>
            <p className="text-sm text-muted-foreground">{addresses.length} ta manzil</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Manzillar yo'q</h3>
            <p className="text-muted-foreground mb-6">Yetkazib berish uchun manzil qo'shing</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Birinchi manzilni qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-semibold">{address.name}</h3>
                        {address.is_default && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Asosiy</span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{address.address}</p>
                      {(address.city || address.region) && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {[address.city, address.region].filter(Boolean).join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Qo'shilgan: {formatDate(address.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-lg transition-colors"
                      >
                        Asosiy qilish
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingAddress(address)
                        setFormData({
                          name: address.name,
                          address: address.address,
                          city: address.city || "",
                          region: address.region || "",
                          is_default: address.is_default,
                        })
                        setShowAddForm(true)
                      }}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAddress(address.id)}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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

      {/* Add/Edit Address Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingAddress ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Manzil nomi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Masalan: Uy, Ish, Do'stim uyi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To'liq manzil *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                  placeholder="Ko'cha, uy raqami va boshqa ma'lumotlar"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">Shahar</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Shahar nomi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Viloyat</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Viloyat nomi"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary/20"
                />
                <label htmlFor="is_default" className="text-sm">
                  Asosiy manzil sifatida belgilash
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setEditingAddress(null)
                  setFormData({ name: "", address: "", city: "", region: "", is_default: false })
                }}
                className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
              >
                Bekor qilish
              </button>
              <button
                onClick={handleAddAddress}
                disabled={!formData.name.trim() || !formData.address.trim()}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {editingAddress ? "Saqlash" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
