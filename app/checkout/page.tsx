"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useCart } from "@/contexts/CartContext"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { MapPin, CreditCard, Truck, Phone, Plus } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { TopBar } from "@/components/layout/top-bar"
import Image from "next/image"
import Link from "next/link"

interface Address {
  id: string
  title: string
  full_address: string
  region: string
  district: string
  street: string
  house_number: string
  apartment_number?: string
  is_default: boolean
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { items, subtotal, deliveryFee, grandTotal, clearCart } = useCart()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState<string>("cash")
  const [deliveryTime, setDeliveryTime] = useState<string>("standard")
  const [notes, setNotes] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [addressesLoading, setAddressesLoading] = useState(true)

  const freeDeliveryThreshold = 200000

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
    setPhoneNumber(user.phone || "")
  }, [user, items, router])

  const fetchAddresses = async () => {
    try {
      setAddressesLoading(true)
      const { data, error } = await supabase
        .from("user_addresses")
        .select("*")
        .eq("user_id", user?.id)
        .order("is_default", { ascending: false })

      if (error) throw error

      setAddresses(data || [])

      // Auto-select default address
      const defaultAddress = data?.find((addr) => addr.is_default)
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id)
      }
    } catch (error) {
      console.error("Error fetching addresses:", error)
      toast({
        title: "Xatolik",
        description: "Manzillarni yuklashda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setAddressesLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !selectedAddressId) {
      toast({
        title: "Xatolik",
        description: "Manzil tanlanmagan",
        variant: "destructive",
      })
      return
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Xatolik",
        description: "Telefon raqamini kiriting",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const selectedAddress = addresses.find((addr) => addr.id === selectedAddressId)

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: grandTotal,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          status: "pending",
          payment_method: paymentMethod,
          delivery_time: deliveryTime,
          notes: notes.trim() || null,
          phone_number: phoneNumber.trim(),
          delivery_address: selectedAddress?.full_address,
          address_details: {
            region: selectedAddress?.region,
            district: selectedAddress?.district,
            street: selectedAddress?.street,
            house_number: selectedAddress?.house_number,
            apartment_number: selectedAddress?.apartment_number,
          },
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        variation_id: item.variation_id,
        quantity: item.quantity,
        price: item.price,
        total: item.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Clear cart
      clearCart()

      toast({
        title: "Muvaffaqiyat!",
        description: "Buyurtmangiz qabul qilindi",
      })

      router.push(`/order-success?order_id=${order.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Xatolik",
        description: "Buyurtma berishda xatolik yuz berdi",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (!user || items.length === 0) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <TopBar />

      <div className="container mx-auto px-4 py-6 pb-20">
        <h1 className="text-2xl font-bold mb-6">Buyurtma berish</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Yetkazib berish manzili
              </CardTitle>
            </CardHeader>
            <CardContent>
              {addressesLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">Yetkazib berish uchun manzil qo'shing</p>
                  <Link href="/profile/addresses">
                    <Button variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Manzil qo'shish
                    </Button>
                  </Link>
                </div>
              ) : (
                <RadioGroup value={selectedAddressId} onValueChange={setSelectedAddressId}>
                  {addresses.map((address) => (
                    <div key={address.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <RadioGroupItem value={address.id} id={address.id} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor={address.id} className="font-medium">
                            {address.title}
                          </Label>
                          {address.is_default && (
                            <Badge variant="secondary" className="text-xs">
                              Asosiy
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{address.full_address}</p>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {addresses.length > 0 && (
                <div className="mt-4">
                  <Link href="/profile/addresses">
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Yangi manzil qo'shish
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Aloqa ma'lumotlari
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="phone">Telefon raqami *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Delivery Options */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Yetkazib berish
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={deliveryTime} onValueChange={setDeliveryTime}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="standard" id="standard" />
                  <Label htmlFor="standard">Standart (1-2 kun)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="express" id="express" />
                  <Label htmlFor="express">Tezkor (bugun)</Label>
                </div>
              </RadioGroup>

              {subtotal >= freeDeliveryThreshold && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium">✓ 200,000 so'mdan yuqorida tekin yetkazib berish</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                To'lov usuli
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Naqd pul (yetkazib berganda)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card">Plastik karta</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Order Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Qo'shimcha ma'lumot</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Buyurtma haqida qo'shimcha ma'lumot..."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Buyurtma xulosasi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div key={`${item.id}-${item.variation_id || "default"}`} className="flex gap-3">
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                      {item.variation_name && <p className="text-xs text-muted-foreground">{item.variation_name}</p>}
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatPrice(item.price)} so'm
                      </p>
                    </div>
                    <div className="text-sm font-medium">{formatPrice(item.price * item.quantity)} so'm</div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Mahsulotlar</span>
                  <span>{formatPrice(subtotal)} so'm</span>
                </div>
                <div className="flex justify-between">
                  <span>Yetkazib berish</span>
                  <span className={deliveryFee === 0 ? "text-green-600 font-medium" : ""}>
                    {deliveryFee === 0 ? "Tekin" : `${formatPrice(deliveryFee)} so'm`}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Jami</span>
                  <span>{formatPrice(grandTotal)} so'm</span>
                </div>
              </div>

              <Button type="submit" className="w-full mt-6" size="lg" disabled={loading || !selectedAddressId}>
                {loading ? "Buyurtma berilmoqda..." : "Buyurtma berish"}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
