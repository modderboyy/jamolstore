"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, User, Truck, Plus, Check, Home } from "lucide-react"
import Image from "next/image"

interface Address {
  id: string
  name: string
  address: string
  city?: string
  region?: string
  postal_code?: string
  is_default: boolean
}

interface CompanyInfo {
  phone_number: string
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, totalPrice, clearCart } = useCart()

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryWithService, setDeliveryWithService] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [newAddressName, setNewAddressName] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [deliveryFee, setDeliveryFee] = useState(0)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)

  // Foydalanuvchi ma'lumotlarini yuklash
  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchAddresses()
      fetchCompanyInfo()
    } else {
      setIsLoading(false)
    }
  }, [user])

  // Calculate delivery fee based on products
  useEffect(() => {
    if (items.length > 0 && deliveryWithService) {
      calculateDeliveryFee()
    } else {
      setDeliveryFee(0)
    }
  }, [items, deliveryWithService])

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase.from("company").select("phone_number").eq("is_active", true).single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company info error:", error)
    }
  }

  const fetchUserData = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("users")
        .select("first_name, last_name, phone_number")
        .eq("id", user.id)
        .single()

      if (error) throw error

      setCustomerName(`${data.first_name} ${data.last_name}`)
      setCustomerPhone(data.phone_number || "")
    } catch (error) {
      console.error("Foydalanuvchi ma'lumotlarini yuklashda xatolik:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })

      if (error) throw error

      setAddresses(data || [])

      // Select default address if available
      const defaultAddress = data?.find((addr) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        setDeliveryAddress(defaultAddress.address)
      }
    } catch (error) {
      console.error("Addresses error:", error)
    }
  }

  const calculateDeliveryFee = () => {
    let maxDeliveryFee = 0
    let hasDeliveryLimit = false
    let totalWithDeliveryLimit = 0

    // Find the highest delivery fee among all products
    for (const item of items) {
      if (item.product.has_delivery) {
        if (item.product.delivery_price > maxDeliveryFee) {
          maxDeliveryFee = item.product.delivery_price
        }

        // Check if any product has delivery limit
        if (item.product.delivery_limit > 0) {
          hasDeliveryLimit = true
          totalWithDeliveryLimit += item.product.price * item.quantity
        }
      }
    }

    // If total price exceeds delivery limit, delivery is free
    if (hasDeliveryLimit && totalWithDeliveryLimit >= items[0].product.delivery_limit) {
      setDeliveryFee(0)
    } else {
      setDeliveryFee(maxDeliveryFee)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const generateOrderNumber = () => {
    return `JM${Date.now().toString().slice(-8)}`
  }

  const handleAddressSelect = (addressId: string) => {
    setSelectedAddressId(addressId)
    const selected = addresses.find((addr) => addr.id === addressId)
    if (selected) {
      setDeliveryAddress(selected.address)
    }
  }

  const handleAddNewAddress = async () => {
    if (!user || !newAddressName.trim() || !newAddress.trim()) {
      alert("Iltimos, barcha maydonlarni to'ldiring")
      return
    }

    try {
      const { data, error } = await supabase
        .from("addresses")
        .insert({
          user_id: user.id,
          name: newAddressName.trim(),
          address: newAddress.trim(),
          is_default: addresses.length === 0, // First address is default
        })
        .select()
        .single()

      if (error) throw error

      // Refresh addresses and select the new one
      fetchAddresses()
      setSelectedAddressId(data.id)
      setDeliveryAddress(data.address)

      // Reset form
      setNewAddressName("")
      setNewAddress("")
      setShowAddressForm(false)
    } catch (error) {
      console.error("Address creation error:", error)
      alert("Manzil qo'shishda xatolik yuz berdi")
    }
  }

  const handleSubmitOrder = async () => {
    if (!user || items.length === 0) return

    if (!customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()) {
      alert("Iltimos, barcha majburiy maydonlarni to'ldiring")
      return
    }

    setIsSubmitting(true)

    try {
      const orderNumber = generateOrderNumber()
      const finalDeliveryFee = deliveryWithService ? deliveryFee : null

      // Buyurtmani yaratish
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_address: deliveryAddress.trim(),
          address_id: selectedAddressId,
          delivery_with_service: deliveryWithService,
          subtotal: totalPrice,
          delivery_fee: finalDeliveryFee,
          total_amount: totalPrice + (finalDeliveryFee || 0),
          notes: notes.trim() || null,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Buyurtma elementlarini yaratish
      const orderItems = items.map((item) => {
        // Extract variation data if available
        const variations = item.variations ? JSON.stringify(item.variations) : null

        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
          variations: variations,
          rental_duration: item.rental_duration,
          rental_time_unit: item.rental_time_unit,
        }
      })

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Savatni tozalash
      await clearCart()

      // Muvaffaqiyat sahifasiga o'tish
      router.push(`/order-success?order=${orderNumber}`)
    } catch (error) {
      console.error("Buyurtma berishda xatolik:", error)
      alert("Buyurtma berishda xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20 md:pb-4">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        </div>
        <BottomNavigation />
      </div>
    )
  }

  if (!user) {
    router.push("/login")
    return null
  }

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

  const grandTotal = totalPrice + (deliveryWithService ? deliveryFee : 0)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-title-3 font-bold">Buyurtma berish</h1>
            <p className="text-footnote text-muted-foreground">{items.length} ta mahsulot</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Order Items */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-headline font-semibold mb-4">Buyurtma tarkibi</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex space-x-3">
                <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                  {item.product.images?.[0] ? (
                    <Image
                      src={item.product.images[0] || "/placeholder.svg"}
                      alt={item.product.name_uz}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted-foreground/20" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium line-clamp-1">{item.product.name_uz}</h4>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">
                      {item.quantity} {item.product.unit} × {formatPrice(item.product.price)} so'm
                    </span>
                    <span className="text-sm font-semibold">
                      {formatPrice(item.product.price * item.quantity)} so'm
                    </span>
                  </div>

                  {/* Show variations if available */}
                  {item.variations && item.variations.length > 0 && (
                    <div className="mt-1 text-xs text-blue-600">
                      {item.variations.map((variation, idx) => (
                        <span key={idx} className="mr-2">
                          {variation.type}: {variation.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-headline font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Buyurtmachi ma'lumotlari
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Ism-familiya *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                placeholder="Ism-familiyangizni kiriting"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Telefon raqam *</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all"
                placeholder="+998 90 123 45 67"
              />
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-headline font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Yetkazib berish manzili
          </h3>

          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Saqlangan manzillar</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {addresses.map((address) => (
                  <button
                    key={address.id}
                    onClick={() => handleAddressSelect(address.id)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedAddressId === address.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/50 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-start">
                      <div className="mr-3">
                        <Home
                          className={`w-5 h-5 ${selectedAddressId === address.id ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{address.name}</span>
                          {selectedAddressId === address.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{address.address}</p>
                        {address.is_default && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded mt-1 inline-block">
                            Asosiy
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add New Address Button */}
          {!showAddressForm ? (
            <button
              onClick={() => setShowAddressForm(true)}
              className="flex items-center space-x-2 text-primary hover:text-primary/80 mb-4"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi manzil qo'shish</span>
            </button>
          ) : (
            <div className="bg-muted/30 p-4 rounded-lg mb-4 animate-fadeIn">
              <h4 className="font-medium mb-3">Yangi manzil</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Manzil nomi *</label>
                  <input
                    type="text"
                    value={newAddressName}
                    onChange={(e) => setNewAddressName(e.target.value)}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                    placeholder="Masalan: Uy, Ish, va h.k."
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">To'liq manzil *</label>
                  <textarea
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                    placeholder="Masalan: G'uzor tumani, Mustaqillik mahallasi, 10-ko'cha, 34-uy"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddressForm(false)}
                    className="px-3 py-1.5 bg-muted text-muted-foreground rounded-lg text-sm hover:bg-muted/80 transition-colors"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleAddNewAddress}
                    disabled={!newAddressName.trim() || !newAddress.trim()}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manual Address Input */}
          {addresses.length === 0 && !showAddressForm && (
            <div>
              <label className="block text-sm font-medium mb-2">To'liq manzil *</label>
              <textarea
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                placeholder="Masalan: G'uzor tumani, Mustaqillik mahallasi, 10-ko'cha, 34-uy"
              />
            </div>
          )}

          <div className="flex items-center space-x-3 mt-4">
            <input
              type="checkbox"
              id="delivery-service"
              checked={deliveryWithService}
              onChange={(e) => setDeliveryWithService(e.target.checked)}
              className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary/20"
            />
            <label htmlFor="delivery-service" className="text-sm flex items-center">
              <Truck className="w-4 h-4 mr-2" />
              Yetkazib berish xizmati {deliveryFee > 0 ? `(${formatPrice(deliveryFee)} so'm)` : "(Bepul)"}
            </label>
          </div>

          {!deliveryWithService && (
            <p className="text-xs text-muted-foreground mt-2">
              Yetkazib berish xizmatisiz buyurtma qilsangiz, mahsulotni o'zingiz olib ketishingiz kerak.
            </p>
          )}
        </div>

        {/* Notes */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-headline font-semibold mb-4">Qo'shimcha izoh</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
            placeholder="Buyurtma haqida qo'shimcha ma'lumot (ixtiyoriy)"
          />
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-headline font-semibold mb-4">To'lov xulosasi</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-body">Mahsulotlar:</span>
              <span className="text-body font-medium">{formatPrice(totalPrice)} so'm</span>
            </div>

            <div className="flex justify-between">
              <span className="text-body">Yetkazib berish:</span>
              <span className="text-body font-medium">
                {deliveryWithService ? (deliveryFee > 0 ? formatPrice(deliveryFee) + " so'm" : "Bepul") : "0 so'm"}
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-title-3 font-bold">Jami to'lov:</span>
                <span className="text-title-2 font-bold">{formatPrice(grandTotal)} so'm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()}
          className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01]"
        >
          {isSubmitting ? "Buyurtma berilmoqda..." : "Buyurtmani tasdiqlash"}
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
