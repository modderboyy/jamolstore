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
  city: string
  region: string
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate required fields
    if (!formData.name?.trim() || !formData.address?.trim()) {
      alert("Manzil nomi va manzil majburiy maydonlar")
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
            city: formData.city?.trim() || "",
            region: formData.region?.trim() || "",
            is_default: formData.is_default,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingAddress.id)
          .eq("user_id", user.id) // Security check

        if (error) throw error
      } else {
        // Add new address using function
        const { data, error } = await supabase.rpc("add_user_address", {
          user_id_param: user.id,
          name_param: formData.name.trim(),
          address_param: formData.address.trim(),
          city_param: formData.city?.trim() || "",
          region_param: formData.region?.trim() || "",
          is_default_param: formData.is_default,
        })

        if (error) throw error
        if (!data.success) {
          alert(data.message)
          return
        }
      }

      // Reset form and refresh addresses
      setFormData({
        name: "",
        address: "",
        city: "",
        region: "",
        is_default: false,
      })
      setShowAddForm(false)
      setEditingAddress(null)
      fetchAddresses()
      alert(editingAddress ? "Manzil yangilandi!" : "Manzil qo'shildi!")
    } catch (error) {
      console.error("Address submit error:", error)
      alert("Xatolik yuz berdi")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setFormData({
      name: address.name || "",
      address: address.address || "",
      city: address.city || "",
      region: address.region || "",
      is_default: address.is_default,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirishni xohlaysizmi?")) return

    try {
      const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", user.id) // Security check

      if (error) throw error
      fetchAddresses()
      alert("Manzil o'chirildi!")
    } catch (error) {
      console.error("Delete address error:", error)
      alert("Xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // First, unset all defaults
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id)

      // Then set the selected one as default
      const { error } = await supabase.from("addresses").update({ is_default: true }).eq("id", addressId)

      if (error) throw error
      fetchAddresses()
      alert("Asosiy manzil o'zgartirildi!")
    } catch (error) {
      console.error("Set default error:", error)
      alert("Xatolik yuz berdi")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      region: "",
      is_default: false,
    })
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

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Manzillarim</h1>
            <p className="text-sm text-muted-foreground">{addresses.length} ta manzil</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Delivery Info */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-border p-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🚚</span>
            </div>
            <div>
              <h3 className="font-semibold text-green-700 dark:text-green-300">
                200,000 so'mdan yuqori xaridlarda tekin yetkazib berish!
              </h3>
              <p className="text-sm text-green-600 dark:text-green-400">
                Qashqadaryo viloyati bo'ylab tez va xavfsiz yetkazib berish
              </p>
            </div>
          </div>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Manzillar yo'q</h3>
            <p className="text-muted-foreground mb-6">Birinchi manzilni qo'shing</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Manzil qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{address.name}</h3>
                      {address.is_default && (
                        <span className="px-2 py-1 bg-primary text-primary-foreground text-xs rounded">Asosiy</span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">{address.address}</p>
                    {(address.city || address.region) && (
                      <p className="text-muted-foreground text-sm">
                        {address.city}
                        {address.city && address.region && ", "}
                        {address.region}
                      </p>
                    )}
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
                <div className="text-xs text-muted-foreground">
                  Qo'shilgan: {new Date(address.created_at).toLocaleDateString("uz-UZ")}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nomi *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Uy, Ish, va hokazo"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Manzil *</label>
                <textarea
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  rows={3}
                  placeholder="To'liq manzil"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Shahar</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Shahar nomi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Viloyat</label>
                <input
                  type="text"
                  value={formData.region || ""}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                  placeholder="Viloyat nomi"
                />
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
              <div className="flex space-x-3 pt-4">
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
                    <span>{editingAddress ? "Yangilash" : "Qo'shish"}</span>
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
