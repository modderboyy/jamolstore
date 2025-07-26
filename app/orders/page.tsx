"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { TopBar } from "@/components/layout/top-bar"
import { BottomNavigation } from "@/components/layout/bottom-navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react"

interface OrderItem {
  id: string
  product_id: string
  product_title: string
  product_image_url: string
  quantity: number
  price: number
  total: number
}

interface Order {
  id: string
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled"
  total_amount: number
  created_at: string
  delivery_address: string
  phone_number: string
  items: OrderItem[]
}

const statusConfig = {
  pending: { label: "Kutilmoqda", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  confirmed: { label: "Tasdiqlandi", color: "bg-blue-100 text-blue-800", icon: CheckCircle },
  processing: { label: "Tayyorlanmoqda", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "Yetkazilmoqda", color: "bg-orange-100 text-orange-800", icon: Truck },
  delivered: { label: "Yetkazildi", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "Bekor qilindi", color: "bg-red-100 text-red-800", icon: XCircle },
}

export default function OrdersPage() {
  const { user, getAuthenticatedClient } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !user) {
      router.push("/login")
      return
    }
    if (mounted && user) {
      fetchOrders()
    }
  }, [user, router, mounted])

  const fetchOrders = async () => {
    if (!user) return

    try {
      const authClient = getAuthenticatedClient()

      // Fetch orders with items
      const { data: ordersData, error } = await authClient
        .from("orders")
        .select(`
          id,
          status,
          total_amount,
          created_at,
          delivery_address,
          phone_number,
          order_items (
            id,
            product_id,
            quantity,
            price,
            total,
            products (
              title,
              image_url
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Orders fetch error:", error)
        return
      }

      // Transform data
      const transformedOrders = (ordersData || []).map((order) => ({
        ...order,
        items:
          order.order_items?.map((item: any) => ({
            id: item.id,
            product_id: item.product_id,
            product_title: item.products?.title || "Noma'lum mahsulot",
            product_image_url: item.products?.image_url || "/placeholder.svg?height=60&width=60",
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })) || [],
      }))

      setOrders(transformedOrders)
    } catch (error) {
      console.error("Orders fetch error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrderClick = (orderId: string) => {
    router.push(`/orders/${orderId}`)
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

  if (!mounted) {
    return null
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
          <div className="flex items-center space-x-4">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Mening buyurtmalarim</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {orders.length === 0 ? (
          <div className="bg-card rounded-lg border border-border p-8 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Buyurtmalar yo'q</h3>
            <p className="text-muted-foreground mb-4">Siz hali hech qanday buyurtma bermagansiz</p>
            <Button onClick={() => router.push("/catalog")}>Xarid qilishni boshlash</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const StatusIcon = statusConfig[order.status].icon

              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleOrderClick(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-medium">Buyurtma #{order.id.slice(0, 8)}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                      </div>
                      <Badge className={statusConfig[order.status].color}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig[order.status].label}
                      </Badge>
                    </div>

                    {/* Order Items Preview */}
                    <div className="space-y-2 mb-4">
                      {order.items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <img
                            src={item.product_image_url || "/placeholder.svg"}
                            alt={item.product_title}
                            className="w-10 h-10 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.product_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.quantity} x {item.price.toLocaleString()} so'm
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-xs text-muted-foreground">va yana {order.items.length - 2} ta mahsulot...</p>
                      )}
                    </div>

                    {/* Order Summary */}
                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div>
                        <p className="text-sm text-muted-foreground">Jami summa</p>
                        <p className="font-medium text-lg">{order.total_amount.toLocaleString()} so'm</p>
                      </div>
                      <Button variant="outline" size="sm">
                        Batafsil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  )
}
