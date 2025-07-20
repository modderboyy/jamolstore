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
    loadCart()
  }, [user])

  const loadCart = async () => {
    setLoading(true)
    try {
      if (user) {
        // Login qilgan foydalanuvchilar uchun - ma'lumotlar bazasidan
        const { data, error } = await supabase
          .from("cart_items")
          .select(`
            *,
            product:products(*)
          `)
          .eq("user_id", user.id)

        if (error) throw error
        setItems(data || [])
      } else {
        // Login qilmagan foydalanuvchilar uchun - localStorage dan
        const savedCart = localStorage.getItem("jamolstroy_cart")
        if (savedCart) {
          const cartData = JSON.parse(savedCart)

          // Mahsulot ma'lumotlarini olish
          if (cartData.length > 0) {
            const productIds = cartData.map((item: any) => item.product_id)
            const { data: products, error } = await supabase.from("products").select("*").in("id", productIds)

            if (!error && products) {
              const cartItems = cartData
                .map((cartItem: any) => {
                  const product = products.find((p) => p.id === cartItem.product_id)
                  return {
                    id: cartItem.id || `local_${cartItem.product_id}`,
                    product_id: cartItem.product_id,
                    quantity: cartItem.quantity,
                    product: product,
                  }
                })
                .filter((item: any) => item.product)

              setItems(cartItems)
            }
          }
        }
      }
    } catch (error) {
      console.error("Savatni yuklashda xatolik:", error)
    } finally {
      setLoading(false)
    }
  }

  const saveToLocalStorage = (cartItems: CartItem[]) => {
    const localCartData = cartItems.map((item) => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
    }))
    localStorage.setItem("jamolstroy_cart", JSON.stringify(localCartData))
  }

  const addToCart = async (productId: string, quantity = 1) => {
    try {
      // Mahsulot ma'lumotlarini olish
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
        // Login qilgan foydalanuvchilar uchun - ma'lumotlar bazasiga
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
        // Login qilmagan foydalanuvchilar uchun - localStorage ga
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
      console.error("Savatga qo'shishda xatolik:", error)
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
        // Login qilgan foydalanuvchilar uchun
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity })
          .eq("user_id", user.id)
          .eq("product_id", productId)

        if (error) throw error
      }

      // Local state ni yangilash
      const updatedItems = items.map((item) => (item.product_id === productId ? { ...item, quantity } : item))
      setItems(updatedItems)

      if (!user) {
        saveToLocalStorage(updatedItems)
      }
    } catch (error) {
      console.error("Miqdorni yangilashda xatolik:", error)
      throw error
    }
  }

  const removeFromCart = async (productId: string) => {
    try {
      if (user) {
        // Login qilgan foydalanuvchilar uchun
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id).eq("product_id", productId)

        if (error) throw error
      }

      // Local state ni yangilash
      const updatedItems = items.filter((item) => item.product_id !== productId)
      setItems(updatedItems)

      if (!user) {
        saveToLocalStorage(updatedItems)
      }
    } catch (error) {
      console.error("Mahsulotni o'chirishda xatolik:", error)
      throw error
    }
  }

  const clearCart = async () => {
    try {
      if (user) {
        // Login qilgan foydalanuvchilar uchun
        const { error } = await supabase.from("cart_items").delete().eq("user_id", user.id)

        if (error) throw error
      }

      setItems([])

      if (!user) {
        localStorage.removeItem("jamolstroy_cart")
      }
    } catch (error) {
      console.error("Savatni tozalashda xatolik:", error)
      throw error
    }
  }

  // Hisob-kitoblar
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const finalDeliveryFee = totalPrice >= freeDeliveryLimit ? 0 : deliveryFee
  const grandTotal = totalPrice + finalDeliveryFee

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
