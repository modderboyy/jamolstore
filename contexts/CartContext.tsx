"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"

interface CartItem {
  id: string
  product: {
    id: string
    name_uz: string
    price: number
    unit: string
    images: string[]
    stock_quantity: number
    min_order_quantity: number
    product_type: "sale" | "rental"
    rental_price_per_unit?: number
    rental_deposit?: number
    rental_time_unit?: "hour" | "day" | "week" | "month"
  }
  quantity: number
  rental_duration?: number
  rental_time_unit?: string
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  grandTotal: number
  addToCart: (productId: string, quantity: number, rentalOptions?: any) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  getTotalPrice: () => number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      loadLocalCart()
    }
  }, [user])

  const loadCart = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(
            id,
            name_uz,
            price,
            unit,
            images,
            stock_quantity,
            min_order_quantity,
            product_type,
            rental_price_per_unit,
            rental_deposit,
            rental_time_unit
          )
        `)
        .eq("user_id", user.id)

      if (error) throw error

      setItems(data || [])
    } catch (error) {
      console.error("Savatni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadLocalCart = () => {
    try {
      const localCart = localStorage.getItem("cart")
      if (localCart) {
        setItems(JSON.parse(localCart))
      }
    } catch (error) {
      console.error("Mahalliy savatni yuklashda xatolik:", error)
    }
  }

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem("cart", JSON.stringify(cartItems))
    } catch (error) {
      console.error("Mahalliy savatni saqlashda xatolik:", error)
    }
  }

  const addToCart = async (productId: string, quantity: number, rentalOptions?: any) => {
    try {
      setLoading(true)

      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (productError) throw productError

      const cartItem: CartItem = {
        id: productId,
        product: {
          id: product.id,
          name_uz: product.name_uz,
          price: product.price,
          unit: product.unit,
          images: product.images || [],
          stock_quantity: product.stock_quantity,
          min_order_quantity: product.min_order_quantity,
          product_type: product.product_type,
          rental_price_per_unit: product.rental_price_per_unit,
          rental_deposit: product.rental_deposit,
          rental_time_unit: product.rental_time_unit,
        },
        quantity,
        rental_duration: rentalOptions?.rental_duration,
        rental_time_unit: rentalOptions?.rental_time_unit,
      }

      if (user) {
        // Save to database
        const { error } = await supabase.from("cart_items").upsert({
          user_id: user.id,
          product_id: productId,
          quantity,
          rental_duration: rentalOptions?.rental_duration,
          rental_time_unit: rentalOptions?.rental_time_unit,
        })

        if (error) throw error
        await loadCart()
      } else {
        // Save to local storage
        const existingIndex = items.findIndex((item) => item.id === productId)
        let newItems: CartItem[]

        if (existingIndex >= 0) {
          newItems = [...items]
          newItems[existingIndex].quantity += quantity
        } else {
          newItems = [...items, cartItem]
        }

        setItems(newItems)
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Savatga qo'shishda xatolik:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      setLoading(true)

      if (user) {
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)

        if (error) throw error
        await loadCart()
      } else {
        const newItems = items.filter((item) => item.id !== productId)
        setItems(newItems)
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Savatdan o'chirishda xatolik:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId)
      return
    }

    try {
      setLoading(true)

      if (user) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) throw error
        await loadCart()
      } else {
        const newItems = items.map((item) => (item.id === productId ? { ...item, quantity } : item))
        setItems(newItems)
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Miqdorni yangilashda xatolik:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)

      if (user) {
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)
        if (error) throw error
      }

      setItems([])
      localStorage.removeItem("cart")
    } catch (error) {
      console.error("Savatni tozalashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      if (item.product.product_type === "rental" && item.product.rental_price_per_unit && item.rental_duration) {
        const rentalTotal = item.product.rental_price_per_unit * item.rental_duration * item.quantity
        const depositTotal = (item.product.rental_deposit || 0) * item.quantity
        return total + rentalTotal + depositTotal
      }
      return total + item.product.price * item.quantity
    }, 0)
  }

  const totalItems = items.reduce((total, item) => total + item.quantity, 0)
  const grandTotal = getTotalPrice()

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        grandTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalPrice,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
