"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, Plus, Home, Edit, Trash2, MapPin, Check } from "lucide-react"

interface Address {
  id: string
  name: string
  address: string
  city?: string
  region?: string
  postal_code?: string
  is_default: boolean
  created_at: string
}

export default function AddressesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    region: "",
    postal_code: "",
    is_default: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAddresses()
    } else {
      router.push("/login")
    }
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
    if (!user || !formData.name.trim() || !formData.address.trim()) return

    setIsSubmitting(true)
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
            is_default: formData.is_default,
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
          is_default: formData.is_default || addresses.length === 0,
        })

        if (error) throw error
      }

      // If this address is set as default, update others
      if (formData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", editingAddress?.id || "")
      }

      fetchAddresses()
      resetForm()
    } catch (error) {
      console.error("Address save error:", error)
      alert("Manzil saqlashda xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
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
      is_default: address.is_default,
    })
    setShowForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirishni xohlaysizmi?")) return

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Address delete error:", error)
      alert("Manzil o'chirishda xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      // Remove default from all addresses
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user?.id)

      // Set new default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Set default error:", error)
      alert("Asosiy manzil o'rnatishda xatolik yuz berdi")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      region: "",
      postal_code: "",
      is_default: false,
    })
    setEditingAddress(null)
    setShowForm(false)
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
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Manzillarim</h1>
              <p className="text-muted-foreground">{addresses.length} ta manzil</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:block">Yangi manzil</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Address Form */}
        {showForm && (
          <div className="bg-card rounded-lg border border-border p-6 mb-6 animate-slideInDown">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Shahar</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Masalan: Toshkent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Viloyat</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                    placeholder="Masalan: Toshkent viloyati"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Pochta indeksi</label>
                <input
                  type="text"
                  value={formData.postal_code}
                  onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Masalan: 100000"
                />
              </div>

              <div className="flex items-center space-x-3">
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

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name.trim() || !formData.address.trim()}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Saqlanmoqda..." : editingAddress ? "Yangilash" : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Manzillar yo'q</h2>
            <p className="text-muted-foreground mb-6">Siz hali hech qanday manzil qo'shmagansiz</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Birinchi manzilni qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div
                key={address.id}
                className="bg-card rounded-lg border border-border p-6 animate-slideInUp"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="p-2 bg-muted rounded-lg">
                      <Home className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold">{address.name}</h3>
                        {address.is_default && (
                          <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>Asosiy</span>
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground mb-2">{address.address}</p>
                      {(address.city || address.region) && (
                        <p className="text-sm text-muted-foreground">
                          {[address.city, address.region].filter(Boolean).join(", ")}
                          {address.postal_code && ` • ${address.postal_code}`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Asosiy qilish"
                      >
                        <Check className="w-4 h-4" />
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
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
