"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, Plus, Edit3, Trash2, Check } from "lucide-react"

interface Address {
  id: string
  name: string
  phone: string
  region: string
  district: string
  street: string
  house: string
  is_default: boolean
}

export default function AddressesPage() {
  const { user, getAuthenticatedClient } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    region: "",
    district: "",
    street: "",
    house: "",
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
      const authClient = getAuthenticatedClient()
      const { data, error } = await authClient.rpc("get_user_addresses", {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const authClient = getAuthenticatedClient()

      if (editingId) {
        // Update existing address
        const { error } = await authClient.rpc("update_user_address", {
          address_id_param: editingId,
          user_id_param: user.id,
          name_param: formData.name,
          phone_param: formData.phone,
          region_param: formData.region,
          district_param: formData.district,
          street_param: formData.street,
          house_param: formData.house,
          is_default_param: formData.is_default,
        })

        if (error) throw error
      } else {
        // Create new address
        const { error } = await authClient.rpc("create_user_address", {
          user_id_param: user.id,
          name_param: formData.name,
          phone_param: formData.phone,
          region_param: formData.region,
          district_param: formData.district,
          street_param: formData.street,
          house_param: formData.house,
          is_default_param: formData.is_default,
        })

        if (error) throw error
      }

      await fetchAddresses()
      resetForm()
      alert(editingId ? "Manzil yangilandi!" : "Manzil qo'shildi!")
    } catch (error) {
      console.error("Address save error:", error)
      alert("Manzil saqlashda xatolik yuz berdi")
    }
  }

  const handleEdit = (address: Address) => {
    setFormData({
      name: address.name,
      phone: address.phone,
      region: address.region,
      district: address.district,
      street: address.street,
      house: address.house,
      is_default: address.is_default,
    })
    setEditingId(address.id)
    setShowForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!user || !confirm("Manzilni o'chirishni xohlaysizmi?")) return

    try {
      const authClient = getAuthenticatedClient()
      const { error } = await authClient.rpc("delete_user_address", {
        address_id_param: addressId,
        user_id_param: user.id,
      })

      if (error) throw error
      await fetchAddresses()
      alert("Manzil o'chirildi!")
    } catch (error) {
      console.error("Address delete error:", error)
      alert("Manzil o'chirishda xatolik yuz berdi")
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      region: "",
      district: "",
      street: "",
      house: "",
      is_default: false,
    })
    setEditingId(null)
    setShowForm(false)
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

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold">Manzillarim</h1>
            </div>

            <button
              onClick={() => setShowForm(true)}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Address Form */}
        {showForm && (
          <div className="bg-card rounded-lg border border-border p-4 mb-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingId ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ism</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    placeholder="To'liq ismingiz"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    placeholder="+998 90 123 45 67"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Viloyat</label>
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    placeholder="Viloyat nomi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tuman</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    placeholder="Tuman nomi"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ko'cha</label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Ko'cha nomi"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Uy raqami</label>
                <input
                  type="text"
                  value={formData.house}
                  onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  placeholder="Uy raqami"
                  required
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

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 px-4 bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  {editingId ? "Yangilash" : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Manzil qo'shilmagan</h3>
            <p className="text-muted-foreground mb-4">Buyurtma berish uchun kamida bitta manzil qo'shing</p>
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Manzil qo'shish
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <div key={address.id} className="bg-card rounded-lg border border-border p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-medium">{address.name}</h3>
                      {address.is_default && (
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full flex items-center space-x-1">
                          <Check className="w-3 h-3" />
                          <span>Asosiy</span>
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{address.phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.region}, {address.district}, {address.street}, {address.house}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => handleDelete(address.id)}
                      className="p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
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
