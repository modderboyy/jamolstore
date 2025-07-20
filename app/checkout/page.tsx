"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, User, Truck } from "lucide-react"
import Image from "next/image"

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, totalPrice, deliveryFee, grandTotal, clearCart } = useCart()

  const [customerName, setCustomerName] = useState("")
  const [customerPhone, setCustomerPhone] = useState("")
  const [deliveryAddress, setDeliveryAddress] = useState("")
  const [deliveryWithService, setDeliveryWithService] = useState(false)
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Foydalanuvchi ma'lumotlarini yuklash
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const generateOrderNumber = () => {
    return `JM${Date.now().toString().slice(-8)}`
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
      const finalDeliveryFee = deliveryWithService ? deliveryFee : 0

      // Buyurtmani yaratish
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_address: deliveryAddress.trim(),
          delivery_with_service: deliveryWithService,
          subtotal: totalPrice,
          delivery_fee: finalDeliveryFee,
          total_amount: totalPrice + finalDeliveryFee,
          notes: notes.trim() || null,
          status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Buyurtma elementlarini yaratish
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        total_price: item.product.price * item.quantity,
      }))

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

  if (items.length === 0) {
    router.push("/cart")
    return null
  }

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
          <div className="space-y-4">
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

            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="delivery-service"
                checked={deliveryWithService}
                onChange={(e) => setDeliveryWithService(e.target.checked)}
                className="w-4 h-4 text-primary bg-muted border-border rounded focus:ring-primary/20"
              />
              <label htmlFor="delivery-service" className="text-sm flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Yetkazib berish xizmati ({formatPrice(deliveryFee)} so'm)
              </label>
            </div>

            {!deliveryWithService && (
              <p className="text-xs text-muted-foreground">
                Yetkazib berish xizmatisiz buyurtma qilsangiz, mahsulotni o'zingiz olib ketishingiz kerak.
              </p>
            )}
          </div>
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
                {deliveryWithService ? formatPrice(deliveryFee) + " so'm" : "0 so'm"}
              </span>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-title-3 font-bold">Jami to'lov:</span>
                <span className="text-title-2 font-bold">
                  {formatPrice(totalPrice + (deliveryWithService ? deliveryFee : 0))} so'm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !customerName.trim() || !customerPhone.trim() || !deliveryAddress.trim()}
          className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Buyurtma berilmoqda..." : "Buyurtmani tasdiqlash"}
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
