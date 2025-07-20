"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"

interface Product {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  stock_quantity: number
}

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: Product
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  deliveryFee: number
  grandTotal: number
  addToCart: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  clearCart: () => Promise<void>
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const deliveryFee = 15000 // 15,000 so'm
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const grandTotal = totalPrice + deliveryFee

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

      // Load cart from database
      const { data: dbCart, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id)

      if (error) throw error

      // Load local cart
      const localCart = getLocalCart()

      // Merge local cart with database cart
      const mergedCart = [...(dbCart || [])]

      for (const localItem of localCart) {
        const existingItem = mergedCart.find((item) => item.product_id === localItem.product_id)
        if (existingItem) {
          // Update quantity
          existingItem.quantity += localItem.quantity
        } else {
          // Add new item to database
          const { data: product } = await supabase.from("products").select("*").eq("id", localItem.product_id).single()

          if (product) {
            const { data: newCartItem } = await supabase
              .from("cart_items")
              .insert({
                user_id: user.id,
                product_id: localItem.product_id,
                quantity: localItem.quantity,
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
        if (item.quantity !== (dbCart?.find((db) => db.id === item.id)?.quantity || 0)) {
          await supabase.from("cart_items").update({ quantity: item.quantity }).eq("id", item.id)
        }
      }

      setItems(mergedCart)

      // Clear local cart after merging
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

  const addToCart = async (productId: string, quantity: number) => {
    try {
      // Get product details
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (productError || !product) throw new Error("Product not found")

      if (user) {
        // Add to database
        const existingItem = items.find((item) => item.product_id === productId)

        if (existingItem) {
          // Update existing item
          const newQuantity = existingItem.quantity + quantity
          await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", existingItem.id)

          setItems((prev) =>
            prev.map((item) => (item.id === existingItem.id ? { ...item, quantity: newQuantity } : item)),
          )
        } else {
          // Add new item
          const { data: newItem, error } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity,
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
        // Add to local storage
        const localCart = getLocalCart()
        const existingItem = localCart.find((item) => item.product_id === productId)

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          localCart.push({
            id: `local_${Date.now()}`,
            product_id: productId,
            quantity,
            product,
          })
        }

        saveLocalCart(localCart)
        setItems(localCart)
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    }
  }

  const removeFromCart = async (itemId: string) => {
    try {
      if (user && !itemId.startsWith("local_")) {
        // Remove from database
        await supabase.from("cart_items").delete().eq("id", itemId)
      }

      // Remove from state
      const newItems = items.filter((item) => item.id !== itemId)
      setItems(newItems)

      if (!user) {
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(itemId)
        return
      }

      if (user && !itemId.startsWith("local_")) {
        // Update in database
        await supabase.from("cart_items").update({ quantity }).eq("id", itemId)
      }

      // Update in state
      const newItems = items.map((item) => (item.id === itemId ? { ...item, quantity } : item))
      setItems(newItems)

      if (!user) {
        saveLocalCart(newItems)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
    }
  }

  const clearCart = async () => {
    try {
      if (user) {
        // Clear from database
        await supabase.from("cart_items").delete().eq("user_id", user.id)
      }

      // Clear from state and local storage
      setItems([])
      localStorage.removeItem("jamolstroy_cart")
    } catch (error) {
      console.error("Error clearing cart:", error)
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
