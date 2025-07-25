"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Home, Star } from "lucide-react"

interface Address {
  id: string
  name: string
  address: string
  city?: string
  region?: string
  postal_code?: string
  is_default: boolean
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
    postal_code: "",
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
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error("Addresses fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !formData.name.trim() || !formData.address.trim()) {
      alert("Iltimos, majburiy maydonlarni to'ldiring")
      return
    }

    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("addresses")
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            city: formData.city.trim() || null,
            region: formData.region.trim() || null,
            postal_code: formData.postal_code.trim() || null,
          })
          .eq("id", editingAddress.id)

        if (error) throw error
      } else {
        // Create new address
        const { error } = await supabase.from("addresses").insert({
          user_id: user.id,
          name: formData.name.trim(),
          address: formData.address.trim(),
          city: formData.city.trim() || null,
          region: formData.region.trim() || null,
          postal_code: formData.postal_code.trim() || null,
          is_default: addresses.length === 0, // First address is default
        })

        if (error) throw error
      }

      // Reset form and refresh
      setFormData({ name: "", address: "", city: "", region: "", postal_code: "" })
      setShowAddForm(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error) {
      console.error("Address save error:", error)
      alert("Manzilni saqlashda xatolik yuz berdi")
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name,
      address: address.address,
      city: address.city || "",
      region: address.region || "",
      postal_code: address.postal_code || "",
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirishni xohlaysizmi?")) return

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Address delete error:", error)
      alert("Manzilni o'chirishda xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // First, remove default from all addresses
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)

      // Then set the selected address as default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Set default error:", error)
      alert("Asosiy manzilni o'zgartirishda xatolik yuz berdi")
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingAddress(null)
    setFormData({ name: "", address: "", city: "", region: "", postal_code: "" })
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Manzillarim</h1>
            <p className="text-sm text-muted-foreground">{addresses.length} ta manzil</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingAddress ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Manzil nomi *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Masalan: Uy, Ish, va h.k."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To'liq manzil *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                  placeholder="Masalan: G'uzor tumani, Mustaqillik mahallasi, 10-ko'cha, 34-uy"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Shahar</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Masalan: Qarshi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Viloyat</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Masalan: Qashqadaryo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Pochta indeksi</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Masalan: 180100"
                  />
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={cancelForm}
                  className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingAddress ? "Saqlash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Manzillar yo'q</h3>
            <p className="text-muted-foreground mb-6">Hozircha hech qanday manzil qo'shilmagan</p>
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
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Home className="w-4 h-4 text-primary" />
                      <span className="font-medium">{address.name}</span>
                      {address.is_default && (
                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium flex items-center space-x-1">
                          <Star className="w-3 h-3" />
                          <span>Asosiy</span>
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">{address.address}</p>
                    {(address.city || address.region || address.postal_code) && (
                      <div className="text-sm text-muted-foreground">
                        {[address.city, address.region, address.postal_code].filter(Boolean).join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Asosiy qilish"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
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
