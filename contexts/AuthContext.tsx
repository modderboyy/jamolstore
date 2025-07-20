"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useTelegram } from "./TelegramContext"

interface UserProfile {
  id: string
  telegram_id?: string
  first_name: string
  last_name: string
  username?: string
  phone_number?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  loginWithTelegram: (telegramData: any) => Promise<UserProfile>
  loginWithPhone: (phoneNumber: string) => Promise<UserProfile>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady, isTelegramWebApp } = useTelegram()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isReady) {
      if (isTelegramWebApp && tgUser) {
        // Telegram Web App da avtomatik login
        handleTelegramAutoLogin()
      } else {
        // Oddiy web da localStorage dan session tekshirish
        checkLocalSession()
      }
    }
  }, [isReady, isTelegramWebApp, tgUser])

  const handleTelegramAutoLogin = async () => {
    if (!tgUser) {
      setLoading(false)
      return
    }

    try {
      const telegramData = {
        telegram_id: tgUser.id.toString(),
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || "",
        username: tgUser.username || "",
      }

      const userData = await loginWithTelegram(telegramData)
      setUser(userData)

      // Local storage ga saqlash
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
    } catch (error) {
      console.error("Telegram auto login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkLocalSession = () => {
    try {
      const savedUser = localStorage.getItem("jamolstroy_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      }
    } catch (error) {
      console.error("Local session check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const loginWithTelegram = async (telegramData: any): Promise<UserProfile> => {
    try {
      // Telegram ID orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", telegramData.telegram_id)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              telegram_id: telegramData.telegram_id,
              first_name: telegramData.first_name,
              last_name: telegramData.last_name,
              username: telegramData.username,
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
      } else {
        // Mavjud foydalanuvchi ma'lumotlarini yangilash
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            first_name: telegramData.first_name,
            last_name: telegramData.last_name,
            username: telegramData.username,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) throw updateError
        userData = updatedUser
      }

      return userData
    } catch (error) {
      console.error("Telegram login error:", error)
      throw error
    }
  }

  const loginWithPhone = async (phoneNumber: string): Promise<UserProfile> => {
    try {
      // Telefon raqam orqali foydalanuvchini qidirish
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", phoneNumber)
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // Agar foydalanuvchi topilmasa, yangi yaratish
      if (!existingUser) {
        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              phone_number: phoneNumber,
              first_name: "Foydalanuvchi",
              last_name: "",
            },
          ])
          .select()
          .single()

        if (createError) throw createError
        userData = newUser
      }

      return userData
    } catch (error) {
      console.error("Phone login error:", error)
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("jamolstroy_user")
  }

  const value = {
    user,
    loading,
    loginWithTelegram,
    loginWithPhone,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
