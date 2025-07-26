"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MapPin, Plus, Edit, Trash2, Home, Building, ArrowLeft } from "lucide-react"

interface Address {
  id: string
  title: string
  full_address: string
  district: string
  landmark?: string
  phone_number?: string
  is_default: boolean
  address_type: "home" | "work" | "other"
}

export default function AddressesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    full_address: "",
    district: "",
    landmark: "",
    phone_number: "",
    address_type: "home" as "home" | "work" | "other",
    is_default: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        .from("user_addresses")
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

  const formatPhoneInput = (value: string) => {
    if (!value) return ""
    const digits = value.replace(/\D/g, "")

    if (digits.length <= 3) {
      return `+${digits}`
    } else if (digits.length <= 5) {
      return `+${digits.slice(0, 3)} ${digits.slice(3)}`
    } else if (digits.length <= 8) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5)}`
    } else if (digits.length <= 10) {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`
    } else {
      return `+${digits.slice(0, 3)} ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 10)} ${digits.slice(10, 12)}`
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!formData.title?.trim() || !formData.full_address?.trim() || !formData.district?.trim()) {
      alert("Sarlavha, to'liq manzil va tuman majburiy maydonlar")
      return
    }

    setIsSubmitting(true)
    try {
      const addressData = {
        user_id: user.id,
        title: formData.title.trim(),
        full_address: formData.full_address.trim(),
        district: formData.district.trim(),
        landmark: formData.landmark?.trim() || null,
        phone_number: formData.phone_number?.trim() || null,
        address_type: formData.address_type,
        is_default: formData.is_default,
      }

      if (editingAddress) {
        // Update existing address
        const { error } = await supabase
          .from("user_addresses")
          .update(addressData)
          .eq("id", editingAddress.id)
          .eq("user_id", user.id)

        if (error) throw error
        alert("Manzil muvaffaqiyatli yangilandi")
      } else {
        // Create new address
        const { error } = await supabase.from("user_addresses").insert(addressData)

        if (error) throw error
        alert("Manzil muvaffaqiyatli qo'shildi")
      }

      // Reset form
      setFormData({
        title: "",
        full_address: "",
        district: "",
        landmark: "",
        phone_number: "",
        address_type: "home",
        is_default: false,
      })
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
      title: address.title || "",
      full_address: address.full_address || "",
      district: address.district || "",
      landmark: address.landmark || "",
      phone_number: address.phone_number || "",
      address_type: address.address_type || "home",
      is_default: address.is_default || false,
    })
    setShowAddForm(true)
  }

  const handleDelete = async (addressId: string) => {
    if (!confirm("Bu manzilni o'chirishni xohlaysizmi?")) return

    try {
      const { error } = await supabase.from("user_addresses").delete().eq("id", addressId).eq("user_id", user?.id)

      if (error) throw error
      alert("Manzil muvaffaqiyatli o'chirildi")
      fetchAddresses()
    } catch (error) {
      console.error("Error deleting address:", error)
      alert("Manzilni o'chirishda xatolik yuz berdi")
    }
  }

  const handleSetDefault = async (addressId: string) => {
    if (!user) return

    try {
      // First, remove default from all addresses
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id)

      // Then set the selected address as default
      const { error } = await supabase
        .from("user_addresses")
        .update({ is_default: true })
        .eq("id", addressId)
        .eq("user_id", user.id)

      if (error) throw error
      fetchAddresses()
    } catch (error) {
      console.error("Error setting default address:", error)
      alert("Asosiy manzilni o'rnatishda xatolik yuz berdi")
    }
  }

  const getAddressTypeIcon = (type: string) => {
    switch (type) {
      case "home":
        return <Home className="w-4 h-4" />
      case "work":
        return <Building className="w-4 h-4" />
      default:
        return <MapPin className="w-4 h-4" />
    }
  }

  const getAddressTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return "Uy"
      case "work":
        return "Ish"
      default:
        return "Boshqa"
    }
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
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Manzillarim</h1>
          </div>
          <Button
            onClick={() => {
              setEditingAddress(null)
              setFormData({
                title: "",
                full_address: "",
                district: "",
                landmark: "",
                phone_number: "",
                address_type: "home",
                is_default: false,
              })
              setShowAddForm(true)
            }}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Qo'shish</span>
          </Button>
        </div>

        {/* Addresses List */}
        {addresses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Manzillar yo'q</h3>
              <p className="text-muted-foreground text-center mb-4">Buyurtma berish uchun manzil qo'shing</p>
              <Button onClick={() => setShowAddForm(true)} className="flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Birinchi manzilni qo'shish</span>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id} className={address.is_default ? "border-primary" : ""}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getAddressTypeIcon(address.address_type)}
                        <h3 className="font-semibold">{address.title}</h3>
                        {address.is_default && (
                          <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">Asosiy</span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{address.full_address}</p>
                      <p className="text-sm text-muted-foreground mb-1">{address.district}</p>
                      {address.landmark && (
                        <p className="text-sm text-muted-foreground mb-1">Mo'ljal: {address.landmark}</p>
                      )}
                      {address.phone_number && (
                        <p className="text-sm text-muted-foreground">Tel: {address.phone_number}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(address)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(address.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {!address.is_default && (
                    <div className="mt-3 pt-3 border-t">
                      <Button variant="outline" size="sm" onClick={() => handleSetDefault(address.id)}>
                        Asosiy qilish
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Address Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>{editingAddress ? "Manzilni tahrirlash" : "Yangi manzil qo'shish"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Sarlavha *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Masalan: Uyim, Ishxonam"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address_type">Manzil turi</Label>
                  <select
                    id="address_type"
                    value={formData.address_type}
                    onChange={(e) =>
                      setFormData({ ...formData, address_type: e.target.value as "home" | "work" | "other" })
                    }
                    className="w-full px-3 py-2 bg-background border border-input rounded-md"
                  >
                    <option value="home">Uy</option>
                    <option value="work">Ish</option>
                    <option value="other">Boshqa</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="full_address">To'liq manzil *</Label>
                  <Textarea
                    id="full_address"
                    value={formData.full_address}
                    onChange={(e) => setFormData({ ...formData, full_address: e.target.value })}
                    placeholder="Ko'cha, uy raqami va boshqa ma'lumotlar"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="district">Tuman *</Label>
                  <Input
                    id="district"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    placeholder="Masalan: G'uzor tumani"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="landmark">Mo'ljal</Label>
                  <Input
                    id="landmark"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="Yaqin atrofdagi mashhur joy"
                  />
                </div>

                <div>
                  <Label htmlFor="phone_number">Telefon raqam</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: formatPhoneInput(e.target.value) })}
                    placeholder="+998 90 123 45 67"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_default"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="is_default">Asosiy manzil sifatida belgilash</Label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingAddress(null)
                    }}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    Bekor qilish
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : editingAddress ? (
                      "Yangilash"
                    ) : (
                      "Qo'shish"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <BottomNavigation />
    </div>
  )
}
