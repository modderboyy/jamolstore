"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MapPin, CreditCard, Truck, Clock, ArrowLeft, Plus, Check, AlertCircle } from "lucide-react"
import Image from "next/image"

interface Address {
  id: string
  title: string
  full_address: string
  district: string
  landmark?: string
  phone_number?: string
  is_default: boolean
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, grandTotal, clearCart } = useCart()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash")
  const [notes, setNotes] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }
    if (items.length === 0) {
      router.push("/cart")
      return
    }
    fetchAddresses()
  }, [user, router, items])

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

      const addressList = data || []
      setAddresses(addressList)

      // Auto-select default address
      const defaultAddress = addressList.find((addr) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress)
      } else if (addressList.length > 0) {
        setSelectedAddress(addressList[0])
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const deliveryFee = grandTotal >= 200000 ? 0 : 15000
  const finalTotal = grandTotal + deliveryFee

  const handleSubmitOrder = async () => {
    if (!user || !selectedAddress) {
      alert("Iltimos, yetkazib berish manzilini tanlang")
      return
    }

    if (items.length === 0) {
      alert("Savat bo'sh")
      return
    }

    setIsSubmitting(true)
    try {
      // Create order
      const orderData = {
        customer_id: user.id,
        total_amount: finalTotal,
        delivery_fee: deliveryFee,
        payment_method: paymentMethod,
        delivery_address: selectedAddress.full_address,
        delivery_district: selectedAddress.district,
        delivery_landmark: selectedAddress.landmark || null,
        delivery_phone: selectedAddress.phone_number || user.phone_number,
        notes: notes.trim() || null,
        status: "pending",
      }

      const { data: order, error: orderError } = await supabase.from("orders").insert(orderData).select().single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price: item.price,
        variation: item.variation || null,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      clearCart()

      // Redirect to success page
      router.push(`/order-success?order_id=${order.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      alert("Buyurtma berishda xatolik yuz berdi. Qaytadan urinib ko'ring.")
    } finally {
      setIsSubmitting(false)
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

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="p-2">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Buyurtmani rasmiylashtirish</h1>
        </div>

        <div className="space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Yetkazib berish manzili</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Manzil qo'shilmagan</p>
                  <Button onClick={() => router.push("/profile/addresses")} className="flex items-center space-x-2">
                    <Plus className="w-4 h-4" />
                    <span>Manzil qo'shish</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddress?.id === address.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedAddress(address)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{address.title}</h4>
                            {address.is_default && (
                              <Badge variant="secondary" className="text-xs">
                                Asosiy
                              </Badge>
                            )}
                            {selectedAddress?.id === address.id && <Check className="w-4 h-4 text-primary" />}
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{address.full_address}</p>
                          <p className="text-sm text-muted-foreground">{address.district}</p>
                          {address.phone_number && (
                            <p className="text-sm text-muted-foreground">Tel: {address.phone_number}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => router.push("/profile/addresses")}
                    className="w-full flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Yangi manzil qo'shish</span>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>To'lov usuli</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("cash")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-lg">💵</span>
                      </div>
                      <div>
                        <h4 className="font-medium">Naqd pul</h4>
                        <p className="text-sm text-muted-foreground">Yetkazib berish vaqtida to'lov</p>
                      </div>
                    </div>
                    {paymentMethod === "cash" && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </div>

                <div
                  className={`p-3 border rounded-lg cursor-pointer transition-colors opacity-50 ${
                    paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setPaymentMethod("card")}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">Plastik karta</h4>
                        <p className="text-sm text-muted-foreground">Tez orada mavjud bo'ladi</p>
                      </div>
                    </div>
                    {paymentMethod === "card" && <Check className="w-5 h-5 text-primary" />}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border-green-200 dark:border-green-800">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                  <Truck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-300">Yetkazib berish ma'lumoti</h3>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    {deliveryFee === 0 ? "🎉 Tekin yetkazib berish!" : "200,000 so'mdan yuqorida tekin yetkazib berish"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Yetkazib berish vaqti: 1-2 ish kuni</span>
              </div>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Qo'shimcha izoh</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Buyurtma haqida qo'shimcha ma'lumot (ixtiyoriy)"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle>Buyurtma tarkibi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3">
                    <div className="relative w-12 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                      {item.variation && <p className="text-xs text-muted-foreground">Variant: {item.variation}</p>}
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(item.price)} so'm
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{formatPrice(item.price * item.quantity)} so'm</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Buyurtma xulosasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Mahsulotlar</span>
                  <span>{formatPrice(grandTotal)} so'm</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Yetkazib berish</span>
                  <span className={deliveryFee === 0 ? "text-green-600" : ""}>
                    {deliveryFee === 0 ? "Tekin" : `${formatPrice(deliveryFee)} so'm`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Jami to'lov</span>
                  <span>{formatPrice(finalTotal)} so'm</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="sticky bottom-20 md:bottom-4 bg-background/80 backdrop-blur-sm p-4 -mx-4 border-t">
            <Button
              onClick={handleSubmitOrder}
              disabled={isSubmitting || !selectedAddress}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <span>Buyurtmani tasdiqlash</span>
                  <span className="ml-2">({formatPrice(finalTotal)} so'm)</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <BottomNavigation />
    </div>
  )
}
