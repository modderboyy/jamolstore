"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name_uz: string
    price: number
    unit: string
    images: string[]
    stock_quantity: number
    min_order_quantity: number
  }
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  deliveryFee: number
  grandTotal: number
  addToCart: (productId: string, quantity?: number) => Promise<void>
  updateQuantity: (productId: string, quantity: number) => Promise<void>
  removeFromCart: (productId: string) => Promise<void>
  clearCart: () => Promise<void>
  getTotalPrice: () => number
  loading: boolean
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  const deliveryFee = 15000 // 15,000 so'm
  const freeDeliveryLimit = 100000 // 100,000 so'm

  useEffect(() => {
    if (user) {
      loadCart()
    } else {
      // Clear cart when user logs out
      setItems([])
    }
  }, [user])

  const loadCart = async () => {
    if (!user) return

    setLoading(true)
    try {
      // Load cart from database for logged in users
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products(*)
        `)
        .eq("user_id", user.id)

      if (error) throw error

      const cartItems = (data || []).filter((item) => item.product) // Filter out items with deleted products
      setItems(cartItems)

      // Merge with local storage cart if exists
      const localCart = localStorage.getItem("jamolstroy_cart")
      if (localCart) {
        try {
          const localCartData = JSON.parse(localCart)
          await mergeLocalCartWithDatabase(localCartData)
          localStorage.removeItem("jamolstroy_cart") // Clear local cart after merge
        } catch (error) {
          console.error("Error merging local cart:", error)
        }
      }
    } catch (error) {
      console.error("Error loading cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const mergeLocalCartWithDatabase = async (localCartData: any[]) => {
    if (!user || !localCartData.length) return

    try {
      for (const localItem of localCartData) {
        // Check if product exists in database cart
        const existingItem = items.find((item) => item.product_id === localItem.product_id)

        if (existingItem) {
          // Update quantity (add local quantity to database quantity)
          const newQuantity = existingItem.quantity + localItem.quantity
          await updateQuantity(localItem.product_id, newQuantity)
        } else {
          // Add new item to database cart
          await addToCart(localItem.product_id, localItem.quantity)
        }
      }
    } catch (error) {
      console.error("Error merging cart:", error)
    }
  }

  const saveToLocalStorage = (cartItems: CartItem[]) => {
    if (!user) {
      // Only save to localStorage if user is not logged in
      const localCartData = cartItems.map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
      }))
      localStorage.setItem("jamolstroy_cart", JSON.stringify(localCartData))
    }
  }

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      // Get product info
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single()

      if (productError || !product) {
        throw new Error("Mahsulot topilmadi")
      }

      const finalQuantity = Math.max(quantity, product.min_order_quantity || 1)

      if (user) {
        // Logged in user - save to database
        const existingItem = items.find((item) => item.product_id === productId)

        if (existingItem) {
          const newQuantity = existingItem.quantity + finalQuantity
          await updateQuantity(productId, newQuantity)
        } else {
          const { data, error } = await supabase
            .from("cart_items")
            .insert({
              user_id: user.id,
              product_id: productId,
              quantity: finalQuantity,
            })
            .select(`
              *,
              product:products(*)
            `)
            .single()

          if (error) throw error
          setItems((prev) => [...prev, data])
        }
      } else {
        // Not logged in - save to localStorage
        const existingItem = items.find((item) => item.product_id === productId)

        if (existingItem) {
          const newQuantity = existingItem.quantity + finalQuantity
          const updatedItems = items.map((item) =>
            item.product_id === productId ? { ...item, quantity: newQuantity } : item,
          )
          setItems(updatedItems)
          saveToLocalStorage(updatedItems)
        } else {
          const newItem: CartItem = {
            id: `local_${productId}`,
            product_id: productId,
            quantity: finalQuantity,
            product: product,
          }
          const updatedItems = [...items, newItem]
          setItems(updatedItems)
          saveToLocalStorage(updatedItems)
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error)
      throw error
    }
  }

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      if (quantity <= 0) {
        await removeFromCart(productId)
        return
      }

      if (user) {
        // Logged in user - update in database
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) throw error
      }

      // Update local state
      const updatedItems = items.map((item) => (item.product_id === productId ? { ...item, quantity } : item))
      setItems(updatedItems)

      if (!user) {
        saveToLocalStorage(updatedItems)
      }
    } catch (error) {
      console.error("Error updating quantity:", error)
      throw error
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      if (user) {
        // Logged in user - remove from database
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)

        if (error) throw error
      }

      // Update local state
      const updatedItems = items.filter((item) => item.product_id !== productId)
      setItems(updatedItems)

      if (!user) {
        saveToLocalStorage(updatedItems)
      }
    } catch (error) {
      console.error("Error removing from cart:", error)
      throw error
    }
  }

  const clearCart = async () => {
    try {
      if (user) {
        // Logged in user - clear database cart
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

        if (error) throw error
      }

      setItems([])

      if (!user) {
        localStorage.removeItem("jamolstroy_cart")
      }
    } catch (error) {
      console.error("Error clearing cart:", error)
      throw error
    }
  }

  // Calculations
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const finalDeliveryFee = totalPrice >= freeDeliveryLimit ? 0 : deliveryFee
  const grandTotal = totalPrice + finalDeliveryFee

  const getTotalPrice = () => totalPrice

  const value = {
    items,
    totalItems,
    totalPrice,
    deliveryFee: finalDeliveryFee,
    grandTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    loading,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
