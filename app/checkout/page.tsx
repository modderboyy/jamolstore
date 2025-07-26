"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { ArrowLeft, User, Truck, Plus, Check, Home, AlertCircle } from "lucide-react"
import Image from "next/image"

interface Address {
  id: string
  name: string
  address: string
  city?: string
  region?: string
  is_default: boolean
}

interface CompanyInfo {
  phone_number: string
  address: string
}

interface DeliverySummary {
  has_delivery_products: boolean
  has_no_delivery_products: boolean
  delivery_products: any[]
  no_delivery_products: any[]
  max_delivery_fee: number
  company_address: string
}

export default function CheckoutPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { items, totalPrice, deliveryInfo, grandTotal, clearCart } = useCart()

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
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [deliverySummary, setDeliverySummary] = useState<DeliverySummary | null>(null)
  const [customerLocation, setCustomerLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (user) {
      fetchUserData()
      fetchAddresses()
      fetchCompanyInfo()
      fetchDeliverySummary()
      getCurrentLocation()
    } else {
      setIsLoading(false)
    }
  }, [user])

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCustomerLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (error) => {
          console.log("Location access denied:", error)
        },
      )
    }
  }

  const fetchCompanyInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("company")
        .select("phone_number, address")
        .eq("is_active", true)
        .single()

      if (error) throw error
      setCompanyInfo(data)
    } catch (error) {
      console.error("Company info error:", error)
    }
  }

  const fetchDeliverySummary = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase.rpc("get_delivery_summary", { customer_id_param: user.id })

      if (error) throw error
      setDeliverySummary(data)
    } catch (error) {
      console.error("Delivery summary error:", error)
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

      const defaultAddress = data?.find((addr) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
        setDeliveryAddress(defaultAddress.address)
      }
    } catch (error) {
      console.error("Addresses error:", error)
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
          is_default: addresses.length === 0,
        })
        .select()
        .single()

      if (error) throw error

      fetchAddresses()
      setSelectedAddressId(data.id)
      setDeliveryAddress(data.address)

      setNewAddressName("")
      setNewAddress("")
      setShowAddressForm(false)
    } catch (error) {
      console.error("Address creation error:", error)
      alert("Manzil qo'shishda xatolik yuz berdi")
    }
  }

  const calculateItemTotal = (item: any) => {
    if (item.product.product_type === "rental" && item.product.rental_price_per_unit && item.rental_duration) {
      return item.product.rental_price_per_unit * item.rental_duration * item.quantity
    }
    return item.product.price * item.quantity
  }

  const handleSubmitOrder = async () => {
    if (!user || items.length === 0) return

    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Iltimos, ism va telefon raqamini kiriting")
      return
    }

    if (deliveryWithService && deliverySummary?.has_delivery_products && !deliveryAddress.trim()) {
      alert("Yetkazib berish uchun manzil kiriting")
      return
    }

    setIsSubmitting(true)

    try {
      const orderNumber = generateOrderNumber()
      const finalDeliveryFee = deliveryInfo?.final_delivery_fee || 0
      const finalAddress =
        deliveryWithService && deliverySummary?.has_delivery_products
          ? deliveryAddress.trim()
          : `O'zim olib ketaman: ${companyInfo?.address || "Kompaniya manzili"}`

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          customer_name: customerName.trim(),
          customer_phone: customerPhone.trim(),
          delivery_address: finalAddress,
          address_id: selectedAddressId,
          delivery_with_service: deliveryWithService && deliverySummary?.has_delivery_products,
          subtotal: totalPrice,
          delivery_fee: finalDeliveryFee,
          total_amount: grandTotal,
          notes: notes.trim() || null,
          status: "pending",
          customer_location: customerLocation ? JSON.stringify(customerLocation) : null,
        })
        .select()
        .single()

      if (orderError) throw orderError

      const orderItems = items.map((item) => {
        const variations = item.variations ? JSON.stringify(item.variations) : null

        return {
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: calculateItemTotal(item),
          variations: variations,
          rental_duration: item.rental_duration,
          rental_time_unit: item.rental_time_unit,
        }
      })

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      await clearCart()

      alert("Buyurtma muvaffaqiyatli berildi! Tez orada aloqaga chiqamiz.")
      router.push("/orders")
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
    router.push("/")
    return null
  }

  const hasDeliveryItems = items.some((item) => item.product.has_delivery)
  const hasNonDeliveryItems = items.some((item) => !item.product.has_delivery)

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      <div className="container mx-auto px-4 py-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Buyurtma berish</h1>
            <p className="text-sm text-muted-foreground">{items.length} ta mahsulot</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Order Items */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4">Buyurtma tarkibi</h3>
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
                    <span className="text-sm font-semibold">{formatPrice(calculateItemTotal(item))} so'm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
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
                placeholder={companyInfo?.phone_number || "+998 90 123 45 67"}
              />
            </div>
          </div>
        </div>

        {/* Delivery Summary */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Truck className="w-5 h-5 mr-2" />
            Yetkazib berish ma'lumotlari
          </h3>

          {/* Products with delivery */}
          {hasDeliveryItems && (
            <div className="mb-4">
              <h4 className="font-medium text-green-600 mb-2">Yetkazib berish mavjud mahsulotlar:</h4>
              <div className="space-y-2">
                {items
                  .filter((item) => item.product.has_delivery)
                  .map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded"
                    >
                      <span>
                        {item.product.name_uz} ({item.quantity} ta)
                      </span>
                      <span className="font-medium">{formatPrice(item.product.delivery_price)} so'm</span>
                    </div>
                  ))}
              </div>

              {/* Free delivery notification */}
              {deliveryInfo && deliveryInfo.cart_total >= deliveryInfo.free_delivery_threshold && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-green-600 mb-1">
                    <span className="text-sm font-medium">🎉 Yetkazib berish tekin!</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Siz {formatPrice(deliveryInfo.free_delivery_threshold)} so'mdan yuqori mahsulot olyapsiz
                  </p>
                </div>
              )}

              {/* Delivery service option */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <button
                  onClick={() => setDeliveryWithService(!deliveryWithService)}
                  className="flex items-center space-x-3 w-full text-left"
                >
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      deliveryWithService ? "bg-primary border-primary" : "border-gray-300"
                    }`}
                  >
                    {deliveryWithService && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Yetkazib berish xizmatini qo'shish</span>
                    <p className="text-sm text-muted-foreground">
                      {deliveryInfo && deliveryInfo.delivery_discount > 0 ? (
                        <span>
                          <span className="line-through">{formatPrice(deliveryInfo.original_delivery_fee)} so'm</span>
                          <span className="ml-2 text-green-600 font-medium">0 so'm</span>
                          <span className="ml-1 text-green-600">(-{deliveryInfo.discount_percentage}% chegirma)</span>
                        </span>
                      ) : (
                        `Narx: ${formatPrice(deliveryInfo?.original_delivery_fee || 0)} so'm`
                      )}
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Products without delivery */}
          {hasNonDeliveryItems && (
            <div className="mb-4">
              <h4 className="font-medium text-orange-600 mb-2">Yetkazib berish mavjud emas:</h4>
              <div className="space-y-2">
                {items
                  .filter((item) => !item.product.has_delivery)
                  .map((item, index) => (
                    <div key={index} className="text-sm bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                      {item.product.name_uz} ({item.quantity} ta)
                    </div>
                  ))}
              </div>
              <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-orange-800 dark:text-orange-200">
                      Bu mahsulotlarni o'zingiz olib ketishingiz kerak
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 mt-1">
                      Manzil: {companyInfo?.address || "Kompaniya manzili"}
                    </p>
                    <p className="text-orange-700 dark:text-orange-300 mt-1">
                      O'zingiz bilan ID kodingiz va telegramingiz orqali tasdiqlash uchun telefoningizni ham olib
                      keling.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Address input for delivery */}
          {deliveryWithService && hasDeliveryItems && (
            <div className="mt-4">
              <h4 className="font-medium mb-3">Yetkazib berish manzili</h4>

              {addresses.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Saqlangan manzillar</label>
                  <div className="grid grid-cols-1 gap-3">
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
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!showAddressForm ? (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center space-x-2 text-primary hover:text-primary/80 mb-4"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi manzil qo'shish</span>
                </button>
              ) : (
                <div className="bg-muted/30 p-4 rounded-lg mb-4">
                  <h4 className="font-medium mb-3">Yangi manzil</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1">Manzil nomi *</label>
                      <input
                        type="text"
                        value={newAddressName}
                        onChange={(e) => setNewAddressName(e.target.value)}
                        className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                        placeholder="Masalan: Uy, Ish"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">To'liq manzil *</label>
                      <textarea
                        value={newAddress}
                        onChange={(e) => setNewAddress(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 bg-background rounded-lg border border-border focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all resize-none"
                        placeholder="To'liq manzilni kiriting"
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

              {addresses.length === 0 && !showAddressForm && (
                <div>
                  <label className="block text-sm font-medium mb-2">Yetkazib berish manzili *</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all resize-none"
                    placeholder="To'liq manzilni kiriting"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-card rounded-lg border border-border p-4">
          <h3 className="text-lg font-semibold mb-4">Qo'shimcha izoh</h3>
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
          <h3 className="text-lg font-semibold mb-4">To'lov xulosasi</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Mahsulotlar:</span>
              <span className="font-medium">{formatPrice(totalPrice)} so'm</span>
            </div>

            <div className="flex justify-between">
              <span>Yetkazib berish:</span>
              <div className="text-right">
                {deliveryInfo?.has_delivery_items ? (
                  deliveryInfo.delivery_discount > 0 ? (
                    <div>
                      <span className="line-through text-muted-foreground text-sm">
                        {formatPrice(deliveryInfo.original_delivery_fee)} so'm
                      </span>
                      <span className="ml-2 text-green-600 font-medium">0 so'm</span>
                      <div className="text-xs text-green-600">-{deliveryInfo.discount_percentage}% chegirma</div>
                    </div>
                  ) : (
                    <span className="font-medium">{formatPrice(deliveryInfo.final_delivery_fee)} so'm</span>
                  )
                ) : (
                  <span className="text-red-600 font-medium">Mavjud emas</span>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <div className="flex justify-between">
                <span className="text-lg font-bold">Jami to'lov:</span>
                <span className="text-lg font-bold text-primary">{formatPrice(grandTotal)} so'm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmitOrder}
          disabled={isSubmitting || !customerName.trim() || !customerPhone.trim()}
          className="w-full bg-primary text-primary-foreground rounded-lg py-4 font-medium hover:bg-primary/90 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.01]"
        >
          {isSubmitting ? "Buyurtma berilmoqda..." : "Buyurtmani tasdiqlash"}
        </button>
      </div>

      <BottomNavigation />
    </div>
  )
}
