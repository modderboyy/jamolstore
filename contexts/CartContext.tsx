"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  stock_quantity: number
  min_order_quantity: number
  product_type?: "sale" | "rental"
  rental_price_per_unit?: number
  rental_deposit?: number
  rental_time_unit?: string
}

interface CartItem {
  id: string
  product_id: string
  quantity: number
  rental_duration?: number
  rental_time_unit?: string
  product: Product
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  deliveryFee: number
  grandTotal: number
  addToCart: (productId: string, quantity: number, rentalOptions?: any) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const deliveryFee = 15000 // 15,000 so'm
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalPrice = items.reduce((sum, item) => {
    if (item.product.product_type === "rental" && item.product.rental_price_per_unit && item.rental_duration) {
      const rentalTotal = item.product.rental_price_per_unit * item.rental_duration * item.quantity
      const depositTotal = (item.product.rental_deposit || 0) * item.quantity
      return sum + rentalTotal + depositTotal
    }
    return sum + item.product.price * item.quantity
  }, 0)

  const grandTotal = totalPrice + (totalItems > 0 ? deliveryFee : 0)

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

      const { data: dbCart, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const localCart = getLocalCart()
      const mergedCart = [...(dbCart || [])]

      // Merge local cart with database cart
      for (const localItem of localCart) {
        const existingItem = mergedCart.find((item) => item.product_id === localItem.product_id)
        if (existingItem) {
          existingItem.quantity += localItem.quantity
        } else {
          const { data: product } = await supabase.from("products").select("*").eq("id", localItem.product_id).single()

          if (product) {
            const { data: newCartItem } = await supabase
              .from("cart_items")
              .insert({
                user_id: user.id,
                product_id: localItem.product_id,
                quantity: localItem.quantity,
                rental_duration: localItem.rental_duration,
                rental_time_unit: localItem.rental_time_unit,
              })
              .select(`
                *,
                product:products(*)
              `)
              .single()

            if (newCartItem) {
              mergedCart.push(newCartItem)
            }
          }
        }
      }

      // Update database with merged quantities
      for (const item of mergedCart) {
        const dbItem = dbCart?.find((db) => db.id === item.id)
        if (item.quantity !== (dbItem?.quantity || 0)) {
          await supabase.from("cart_items").update({ quantity: item.quantity }).eq("id", item.id)
        }
      }

      setItems(mergedCart)
      localStorage.removeItem("jamolstroy_cart")
    } catch (error) {
      console.error("Error loading cart:", error)
      loadLocalCart()
    } finally {
      setLoading(false)
    }
  }

  const loadLocalCart = () => {
    const localCart = getLocalCart()
    setItems(localCart)
  }

  const getLocalCart = (): CartItem[] => {
    try {
      const saved = localStorage.getItem("jamolstroy_cart")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  }

  const saveLocalCart = (cartItems: CartItem[]) => {
    localStorage.setItem("jamolstroy_cart", JSON.stringify(cartItems))
  }

  const addToCart = async (productId: string, quantity: number, rentalOptions?: any) => {
    try {
      setLoading(true)

      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (productError || !product) throw new Error("Product not found")

      if (user) {
        const existingItem = items.find((item) => item.product_id === productId)

        if (existingItem) {
          const newQuantity = existingItem.quantity + quantity
          await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", existingItem.id)

          setItems((prev) =>
            prev.map((item) => (item.id === existingItem.id ? { ...item, quantity: newQuantity } : item)),
          )
        } else {
          const { data: newItem, error } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity,
              rental_duration: rentalOptions?.rental_duration,
              rental_time_unit: rentalOptions?.rental_time_unit,
            })
            .select(`
              *,
              product:products(*)
            `)
            .single()

          if (error) throw error
          setItems((prev) => [...prev, newItem])
        }
      } else {
        const localCart = getLocalCart()
        const existingItem = localCart.find((item) => item.product_id === productId)

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          localCart.push({
            id: `local_${Date.now()}`,
            product_id: productId,
            quantity,
            rental_duration: rentalOptions?.rental_duration,
            rental_time_unit: rentalOptions?.rental_time_unit,
            product,
          })
        }

        saveLocalCart(localCart)
        setItems(localCart)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      setLoading(true)

      if (user && !itemId.startsWith("local_")) {
        await supabase.from("cart_items").delete().eq("id", itemId)
      }

      const newItems = items.filter((item) => item.id !== itemId)
      setItems(newItems)

      if (!user) {
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId)
        return
      }

      setLoading(true)

      if (user && !itemId.startsWith("local_")) {
        await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
      }

      const newItems = items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      setItems(newItems)

      if (!user) {
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    } finally {
      setLoading(false)
    }
  }

  const clearCart = async () => {
    try {
      setLoading(true)

      if (user) {
        await supabase.from("cart_items").delete().eq("user_id", user.id)
      }

      setItems([])
      localStorage.removeItem("jamolstroy_cart")
    } catch (error) {
      console.error("Error clearing cart:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        deliveryFee,
        grandTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
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
