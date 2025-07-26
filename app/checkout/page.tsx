"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, MapPin, Phone, User, CreditCard, Truck, Package, AlertCircle } from "lucide-react"

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

interface CartItem {
  id: string
  product_id: string
  quantity: number
  price: number
  product_name: string
  product_image: string
  is_rental: boolean
  rental_duration?: number
}

export default function CheckoutPage() {
  const { user, getAuthenticatedClient } = useAuth()
  const { items, getTotalPrice, clearCart } = useCart()
  const router = useRouter()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [deliveryMethod, setDeliveryMethod] = useState<string>("delivery")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)

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
  }, [user, items, router])

  const fetchAddresses = async () => {
    if (!user) return

    try {
      const authClient = getAuthenticatedClient()
      const { data, error } = await authClient.rpc("get_user_addresses", {
        user_id_param: user.id,
      })

      if (error) throw error

      setAddresses(data || [])
      const defaultAddress = data?.find((addr: Address) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddress(defaultAddress.id)
      }
    } catch (error) {
      console.error("Addresses fetch error:", error)
    } finally {
      setIsLoadingAddresses(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddress) return

    setIsLoading(true)
    try {
      const authClient = getAuthenticatedClient()

      // Create order
      const { data: order, error: orderError } = await authClient
        .from("orders")
        .insert([
          {
            user_id: user.id,
            address_id: selectedAddress,
            total_amount: getTotalPrice(),
            payment_method: paymentMethod,
            delivery_method: deliveryMethod,
            status: "pending",
          },
        ])
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item: CartItem) => ({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
        is_rental: item.is_rental,
        rental_duration: item.rental_duration,
      }))

      const { error: itemsError } = await authClient.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart and redirect
      clearCart()
      router.push(`/order-success?orderId=${order.id}`)
    } catch (error) {
      console.error("Order creation error:", error)
      alert("Buyurtma yaratishda xatolik yuz berdi")
    } finally {
      setIsLoading(false)
    }
  }

  const selectedAddressData = addresses.find((addr) => addr.id === selectedAddress)
  const hasRentalItems = items.some((item: CartItem) => item.is_rental)

  if (isLoadingAddresses) {
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
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Buyurtmani rasmiylashtirish</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Delivery Address */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3 mb-4">
            <MapPin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Yetkazib berish manzili</h2>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-muted-foreground mb-3">Manzil qo'shilmagan</p>
              <button
                onClick={() => router.push("/profile/addresses")}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Manzil qo'shish
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedAddress === address.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedAddress(address.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{address.name}</span>
                        {address.is_default && (
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Asosiy</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mb-1">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{address.phone}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {address.region}, {address.district}, {address.street}, {address.house}
                      </p>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedAddress === address.id ? "border-primary bg-primary" : "border-muted-foreground"
                      }`}
                    />
                  </div>
                </div>
              ))}
              <button
                onClick={() => router.push("/profile/addresses")}
                className="w-full p-3 border border-dashed border-muted-foreground/50 rounded-lg text-muted-foreground hover:border-primary hover:text-primary transition-colors"
              >
                + Yangi manzil qo'shish
              </button>
            </div>
          )}
        </div>

        {/* Delivery Method */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Truck className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Yetkazib berish usuli</h2>
          </div>

          <div className="space-y-3">
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                deliveryMethod === "delivery" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setDeliveryMethod("delivery")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Yetkazib berish</h3>
                  <p className="text-sm text-muted-foreground">Manzilga yetkazib beramiz</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    deliveryMethod === "delivery" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                deliveryMethod === "pickup" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setDeliveryMethod("pickup")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">O'zingiz olib ketish</h3>
                  <p className="text-sm text-muted-foreground">Do'kondan olib ketasiz</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    deliveryMethod === "pickup" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pickup Information */}
        {deliveryMethod === "pickup" && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Yetkazib berish ma'lumotlari</h3>
                <div className="space-y-2 text-sm text-amber-700 dark:text-amber-300">
                  <p>
                    <strong>Yetkazib berish mavjud emas:</strong>
                  </p>
                  <div className="space-y-1">
                    {items.map((item: CartItem, index) => (
                      <p key={index}>
                        • {item.product_name} ({item.quantity} ta)
                      </p>
                    ))}
                  </div>
                  <p>
                    <strong>Bu mahsulotlarni o'zingiz olib ketishingiz kerak</strong>
                  </p>
                  <p>
                    <strong>Manzil:</strong> Qashqadaryo viloyati, G'uzor tumani, Shu ko'chaning, shu uyi
                  </p>
                  <p>
                    O'zingiz bilan ID kodingiz va telegramingiz orqali tasdiqlash uchun telefoningizni ham olib keling.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">To'lov usuli</h2>
          </div>

          <div className="space-y-3">
            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                paymentMethod === "cash" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("cash")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Naqd pul</h3>
                  <p className="text-sm text-muted-foreground">Yetkazib berganda to'lash</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === "cash" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                paymentMethod === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setPaymentMethod("card")}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Plastik karta</h3>
                  <p className="text-sm text-muted-foreground">Onlayn to'lov</p>
                </div>
                <div
                  className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === "card" ? "border-primary bg-primary" : "border-muted-foreground"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card rounded-lg border border-border p-4">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">Buyurtma xulosasi</h2>
          </div>

          <div className="space-y-3">
            {items.map((item: CartItem) => (
              <div key={item.id} className="flex items-center justify-between py-2">
                <div className="flex-1">
                  <h3 className="font-medium">{item.product_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} ta × {item.price.toLocaleString()} so'm
                    {item.is_rental && item.rental_duration && (
                      <span className="ml-2 text-primary">({item.rental_duration} kun ijara)</span>
                    )}
                  </p>
                </div>
                <span className="font-medium">{(item.quantity * item.price).toLocaleString()} so'm</span>
              </div>
            ))}

            <div className="border-t border-border pt-3">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Jami:</span>
                <span>{getTotalPrice().toLocaleString()} so'm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rental Warning */}
        {hasRentalItems && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-1">Ijara shartlari</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Ijaraga olingan mahsulotlar belgilangan muddatda qaytarilishi kerak. Kechikish uchun qo'shimcha to'lov
                  olinadi.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={!selectedAddress || isLoading}
          className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Buyurtma yaratilmoqda...</span>
            </div>
          ) : (
            `Buyurtma berish - ${getTotalPrice().toLocaleString()} so'm`
          )}
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
