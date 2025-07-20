"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useTelegram } from "./TelegramContext"

interface User {
  id: string
  telegram_id: number
  first_name: string
  last_name: string
  username?: string
  phone_number?: string
  email?: string
  is_verified: boolean
  role: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { webApp, isTelegramWebApp } = useTelegram()

  useEffect(() => {
    initializeAuth()
  }, [webApp, isTelegramWebApp])

  const initializeAuth = async () => {
    try {
      if (isTelegramWebApp && webApp?.initDataUnsafe?.user) {
        // Telegram Web App - automatic login
        console.log("Telegram Web App detected, attempting auto-login...")
        const telegramUser = webApp.initDataUnsafe.user
        await handleTelegramLogin(telegramUser)
      } else {
        // Regular web - check local session
        console.log("Checking web session...")
        const savedUser = localStorage.getItem("jamolstroy_user")
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser)
          console.log("Local session found for:", parsedUser.first_name)
          setUser(parsedUser)
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTelegramLogin = async (telegramUser: any) => {
    try {
      // Check if user exists in database
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramUser.id)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError
      }

      let user = existingUser

      if (!existingUser) {
        // Create new user automatically
        console.log("Creating new user for Telegram ID:", telegramUser.id)
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert({
            telegram_id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name || "",
            username: telegramUser.username || null,
            is_verified: true,
            role: "customer",
          })
          .select()
          .single()

        if (createError) throw createError
        user = newUser
      }

      if (user) {
        console.log("Telegram user logged in:", user.first_name)
        setUser(user)
        localStorage.setItem("jamolstroy_user", JSON.stringify(user))
      }
    } catch (error) {
      console.error("Telegram login error:", error)
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("jamolstroy_user")
    localStorage.removeItem("jamolstroy_cart")

    // Clear all related data
    const keysToRemove = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith("jamolstroy_")) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key))
  }

  return <AuthContext.Provider value={{ user, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
