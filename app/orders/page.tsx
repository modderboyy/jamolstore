"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useTelegram } from "@/contexts/TelegramContext"
import { supabase } from "@/lib/supabase"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { TopBar } from "@/components/layout/top-bar"
import { Package, Clock, CheckCircle, Truck, XCircle, Eye, Phone, MapPin, ShoppingBag } from "lucide-react"
import Image from "next/image"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  total_price: number
  product: {
    id: string
    name_uz: string
    unit: string
    images: string[]
  }
}

interface Order {
  id: string
  order_number: string
  customer_name: string
  customer_phone: string
  delivery_address: string
  delivery_with_service: boolean
  status: string
  subtotal: number
  delivery_fee: number
  total_amount: number
  notes?: string
  created_at: string
  updated_at: string
  order_items: OrderItem[]
}

const statusConfig = {
  pending: {
    label: "Kutilmoqda",
    color: "text-yellow-600",
    bgColor: "bg-yellow-50",
    borderColor: "border-yellow-200",
    icon: Clock,
  },
  confirmed: {
    label: "Tasdiqlandi",
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    icon: CheckCircle,
  },
  processing: {
    label: "Tayyorlanmoqda",
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    icon: Package,
  },
  shipped: {
    label: "Yetkazilmoqda",
    color: "text-indigo-600",
    bgColor: "bg-indigo-50",
    borderColor: "border-indigo-200",
    icon: Truck,
  },
  delivered: {
    label: "Yetkazildi",
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Bekor qilindi",
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    icon: XCircle,
  },
}

export default function OrdersPage() {
  const { user, profile, loading } = useAuth()
  const { isTelegramWebApp } = useTelegram()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetail, setShowOrderDetail] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user || !profile) {
        if (!isTelegramWebApp) {
          router.push("/login")
        }
        return
      }
      fetchOrders()
    }
  }, [user, profile, loading, router, isTelegramWebApp])

  const fetchOrders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          order_items (
            *,
            product:products (
              id,
              name_uz,
              unit,
              images
            )
          )
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Buyurtmalarni yuklashda xatolik:", error)
    } finally {
      setLoadingOrders(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("uz-UZ", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  const handleCallSupport = () => {
    window.open("tel:+998901234567")
  }

  if (loading || loadingOrders) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Yuklanmoqda...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-4">
      <TopBar />

      {/* Header */}
      <div className="container mx-auto px-4 py-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Buyurtmalarim</h1>
            <p className="text-muted-foreground">{orders.length} ta buyurtma</p>
          </div>
          <button
            onClick={handleCallSupport}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:block">Qo'llab-quvvatlash</span>
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold mb-2">Buyurtmalar yo'q</h2>
            <p className="text-muted-foreground mb-6">Siz hali hech qanday buyurtma bermagansiz</p>
            <button
              onClick={() => router.push("/catalog")}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Xarid qilishni boshlash
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const status = statusConfig[order.status as keyof typeof statusConfig]
              const StatusIcon = status.icon

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-lg border border-border p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleOrderClick(order)}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">#{order.order_number}</h3>
                      <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div
                      className={`flex items-center space-x-2 px-3 py-1 rounded-full ${status.bgColor} ${status.borderColor} border`}
                    >
                      <StatusIcon className={`w-4 h-4 ${status.color}`} />
                      <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mb-4">
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {order.order_items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex-shrink-0 flex items-center space-x-2 bg-muted/50 rounded-lg p-2"
                        >
                          <div className="w-10 h-10 bg-muted rounded-lg overflow-hidden">
                            {item.product.images?.[0] ? (
                              <Image
                                src={item.product.images[0] || "/placeholder.svg"}
                                alt={item.product.name_uz}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted-foreground/20" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-medium line-clamp-1">{item.product.name_uz}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} {item.product.unit}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 bg-muted/50 rounded-lg">
                          <span className="text-xs text-muted-foreground">+{order.order_items.length - 3}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>{order.order_items.length} ta mahsulot</span>
                      {order.delivery_with_service && (
                        <div className="flex items-center space-x-1">
                          <Truck className="w-4 h-4" />
                          <span>Yetkazib berish</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{formatPrice(order.total_amount)} so'm</p>
                      <button className="text-sm text-primary hover:underline flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>Batafsil</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation />

      {/* Order Detail Modal */}
      {showOrderDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="bg-background rounded-t-3xl md:rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border p-6 rounded-t-3xl md:rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">#{selectedOrder.order_number}</h2>
                  <p className="text-muted-foreground">{formatDate(selectedOrder.created_at)}</p>
                </div>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="p-2 rounded-full hover:bg-muted transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status */}
              <div className="text-center">
                {(() => {
                  const status = statusConfig[selectedOrder.status as keyof typeof statusConfig]
                  const StatusIcon = status.icon
                  return (
                    <div
                      className={`inline-flex items-center space-x-3 px-6 py-3 rounded-full ${status.bgColor} ${status.borderColor} border`}
                    >
                      <StatusIcon className={`w-6 h-6 ${status.color}`} />
                      <span className={`font-semibold ${status.color}`}>{status.label}</span>
                    </div>
                  )
                })()}
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-4">Buyurtma tarkibi</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex space-x-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] ? (
                          <Image
                            src={item.product.images[0] || "/placeholder.svg"}
                            alt={item.product.name_uz}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted-foreground/20" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product.name_uz}</h4>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-muted-foreground">
                            {item.quantity} {item.product.unit} × {formatPrice(item.unit_price)} so'm
                          </span>
                          <span className="font-semibold">{formatPrice(item.total_price)} so'm</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="font-semibold mb-4">Yetkazib berish ma'lumotlari</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="font-medium">Manzil</p>
                      <p className="text-muted-foreground">{selectedOrder.delivery_address}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Telefon</p>
                      <p className="text-muted-foreground">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Yetkazib berish</p>
                      <p className="text-muted-foreground">
                        {selectedOrder.delivery_with_service ? "Xizmat bilan" : "O'zingiz olib ketish"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold mb-4">Qo'shimcha izoh</h3>
                  <p className="text-muted-foreground bg-muted/30 rounded-lg p-4">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold mb-4">To'lov xulosasi</h3>
                <div className="space-y-3 bg-muted/30 rounded-lg p-4">
                  <div className="flex justify-between">
                    <span>Mahsulotlar:</span>
                    <span>{formatPrice(selectedOrder.subtotal)} so'm</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Yetkazib berish:</span>
                    <span>
                      {selectedOrder.delivery_fee === 0 ? "Tekin" : formatPrice(selectedOrder.delivery_fee) + " so'm"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Jami:</span>
                      <span>{formatPrice(selectedOrder.total_amount)} so'm</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCallSupport}
                  className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-3 font-medium hover:bg-secondary/80 transition-colors flex items-center justify-center space-x-2"
                >
                  <Phone className="w-5 h-5" />
                  <span>Qo'llab-quvvatlash</span>
                </button>
                {selectedOrder.status === "pending" && (
                  <button className="flex-1 bg-destructive text-destructive-foreground rounded-lg py-3 font-medium hover:bg-destructive/90 transition-colors">
                    Bekor qilish
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
