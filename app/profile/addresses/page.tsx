"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, Plus, Edit, Trash2, Check } from "lucide-react"

interface Address {
  id: string
  name: string
  address: string
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
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
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) return
    if (!formData.name?.trim() || !formData.address?.trim()) {
      alert("Barcha maydonlarni to'ldiring")
      return
    }

    setIsSubmitting(true)
    try {
      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("addresses")
          .update({
            name: formData.name.trim(),
            address: formData.address.trim(),
            is_default: formData.is_default,
          })
          .eq("id", editingAddress.id)

        if (error) throw error
      } else {
        // Add new address
        const { error } = await supabase.from("addresses").insert({
          user_id: user.id,
          name: formData.name.trim(),
          address: formData.address.trim(),
          is_default: formData.is_default,
        })

        if (error) throw error
      }

      // If this is set as default, update other addresses
      if (formData.is_default) {
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .neq("id", editingAddress?.id || "")
      }

      setFormData({ name: "", address: "", is_default: false })
      setShowAddForm(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error) {
      console.error("Error saving address:", error)
      alert("Manzilni saqlashda xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name || "",
      address: address.address || "",
      is_default: address.is_default,
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
      console.error("Error deleting address:", error)
      alert("Manzilni o'chirishda xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // First, set all addresses to non-default
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)

      // Then set the selected address as default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Error setting default address:", error)
      alert("Asosiy manzilni o'rnatishda xatolik yuz berdi")
    }
  }

  const resetForm = () => {
    setFormData({ name: "", address: "", is_default: false })
    setShowAddForm(false)
    setEditingAddress(null)
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

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Manzillarim</h1>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </button>
        </div>

        {/* Delivery Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-border p-6 mb-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🚚</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Yetkazib berish xizmati</h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                200,000 so'mdan yuqori xaridlarda tekin yetkazib berish!
              </p>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            <p>• Qashqadaryo viloyati, G'uzor tumani bo'ylab</p>
            <p>• Tez va xavfsiz yetkazib berish</p>
          </div>
        </div>

        {/* Addresses List */}
        <div className="space-y-4">
          {addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Manzillar yo'q</h3>
              <p className="text-muted-foreground mb-4">Yetkazib berish uchun manzil qo'shing</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Birinchi manzilni qo'shish
              </button>
            </div>
          ) : (
            addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-card rounded-xl border p-4 ${
                  address.is_default ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold">{address.name}</h3>
                      {address.is_default && (
                        <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                          Asosiy
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">{address.address}</p>
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Qashqadaryo viloyati, G'uzor tumani</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                        title="Asosiy qilish"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 hover:bg-muted rounded-lg transition-colors text-red-500"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Address Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-xl border border-border p-6 w-full max-w-md">
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
                  placeholder="Masalan: Uy, Ish, Do'kon"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">To'liq manzil *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all min-h-[80px]"
                  placeholder="To'liq manzilni kiriting"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_default"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="is_default" className="text-sm">
                  Asosiy manzil sifatida belgilash
                </label>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.name?.trim() || !formData.address?.trim()}
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <span>{editingAddress ? "Yangilash" : "Saqlash"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
