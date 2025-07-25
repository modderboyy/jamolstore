"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "./AuthContext"

interface ProductVariation {
  type: string
  name: string
  value: string
  price?: number | null
}

interface CartProduct {
  id: string
  name_uz: string
  price: number
  unit: string
  images: string[]
  has_delivery: boolean
  delivery_price: number
  delivery_limit: number
  product_type?: "sale" | "rental"
  rental_price_per_unit?: number
  rental_deposit?: number
}

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: CartProduct
  variations?: ProductVariation[]
  rental_duration?: number
  rental_time_unit?: string
}

interface CartContextType {
  items: CartItem[]
  totalItems: number
  totalPrice: number
  deliveryFee: number
  grandTotal: number
  addToCart: (productId: string, quantity: number, options?: any) => Promise<void>
  updateQuantity: (itemId: string, quantity: number) => Promise<void>
  removeFromCart: (itemId: string) => Promise<void>
  clearCart: () => Promise<void>
  setDeliveryFee: (fee: number) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [deliveryFee, setDeliveryFeeState] = useState(0)

  useEffect(() => {
    if (user) {
      fetchCartItems()
    } else {
      setItems([])
    }
  }, [user])

  const fetchCartItems = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          product:products (
            id,
            name_uz,
            price,
            unit,
            images,
            has_delivery,
            delivery_price,
            delivery_limit,
            product_type,
            rental_price_per_unit,
            rental_deposit
          )
        `)
        .eq("customer_id", user.id)

      if (error) throw error

      const cartItems: CartItem[] = (data || []).map((item) => ({
        id: item.id,
        product_id: item.product_id,
        quantity: item.quantity,
        product: item.product,
        variations: item.variations ? JSON.parse(item.variations) : undefined,
        rental_duration: item.rental_duration,
        rental_time_unit: item.rental_time_unit,
      }))

      setItems(cartItems)
    } catch (error) {
      console.error("Cart fetch error:", error)
    }
  }

  const addToCart = async (productId: string, quantity: number, options: any = {}) => {
    if (!user) throw new Error("User not authenticated")

    try {
      // Check if item with same variations already exists
      const existingItem = items.find((item) => {
        if (item.product_id !== productId) return false

        // Compare variations
        const existingVariations = item.variations || []
        const newVariations = options.variations || []

        if (existingVariations.length !== newVariations.length) return false

        return existingVariations.every((existing) =>
          newVariations.some(
            (newVar: ProductVariation) => existing.type === newVar.type && existing.value === newVar.value,
          ),
        )
      })

      if (existingItem) {
        // Update existing item quantity
        await updateQuantity(existingItem.id, existingItem.quantity + quantity)
      } else {
        // Add new item - fix the numeric error by ensuring proper data types
        const insertData: any = {
          customer_id: user.id,
          product_id: productId,
          quantity: Number.parseInt(quantity.toString()), // Ensure integer
          variations: options.variations ? JSON.stringify(options.variations) : null,
        }

        // Only add rental fields if they exist and are valid
        if (options.rental_duration && typeof options.rental_duration === "number") {
          insertData.rental_duration = Number.parseInt(options.rental_duration.toString())
        }
        if (options.rental_time_unit && typeof options.rental_time_unit === "string") {
          insertData.rental_time_unit = options.rental_time_unit
        }

        const { error } = await supabase.from("cart_items").insert(insertData)

        if (error) throw error
        await fetchCartItems()
      }
    } catch (error) {
      console.error("Add to cart error:", error)
      throw error
    }
  }

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId)
        return
      }

      const { error } = await supabase
        .from("cart_items")
        .update({ quantity: Number.parseInt(quantity.toString()) }) // Ensure integer
        .eq("id", itemId)

      if (error) throw error
      await fetchCartItems()
    } catch (error) {
      console.error("Update quantity error:", error)
    }
  }

  const removeFromCart = async (itemId: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

      if (error) throw error
      await fetchCartItems()
    } catch (error) {
      console.error("Remove from cart error:", error)
    }
  }

  const clearCart = async () => {
    if (!user) return

    try {
      const { error } = await supabase.from("cart_items").delete().eq("customer_id", user.id)

      if (error) throw error
      setItems([])
    } catch (error) {
      console.error("Clear cart error:", error)
    }
  }

  const setDeliveryFee = (fee: number) => {
    setDeliveryFeeState(fee)
  }

  // Calculate totals
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)

  const totalPrice = items.reduce((sum, item) => {
    const basePrice =
      item.product.product_type === "rental" && item.product.rental_price_per_unit
        ? item.product.rental_price_per_unit
        : item.product.price

    // Apply variation price additions (not replacements)
    let variationAddition = 0
    if (item.variations) {
      item.variations.forEach((variation) => {
        if (variation.price !== null && variation.price !== undefined && variation.price > 0) {
          variationAddition += variation.price
        }
      })
    }

    const itemPrice = basePrice + variationAddition

    if (item.product.product_type === "rental" && item.rental_duration) {
      const rentalTotal = itemPrice * item.rental_duration * item.quantity
      const depositTotal = (item.product.rental_deposit || 0) * item.quantity
      return sum + rentalTotal + depositTotal
    }

    return sum + itemPrice * item.quantity
  }, 0)

  const grandTotal = totalPrice + deliveryFee

  const value: CartContextType = {
    items,
    totalItems,
    totalPrice,
    deliveryFee,
    grandTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setDeliveryFee,
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
