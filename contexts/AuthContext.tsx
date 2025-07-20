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
  email?: string
  avatar_url?: string
  is_verified: boolean
  role: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: UserProfile | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => void
  checkWebsiteLoginStatus: (token: string) => Promise<UserProfile | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user: tgUser, isReady, isTelegramWebApp } = useTelegram()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isReady) {
      if (isTelegramWebApp && tgUser) {
        // Telegram Web App automatic login
        console.log("Starting Telegram auto login...")
        handleTelegramAutoLogin()
      } else {
        // Regular web - check for login token or local session
        console.log("Checking web session...")
        checkWebSession()
      }
    }
  }, [isReady, isTelegramWebApp, tgUser])

  const handleTelegramAutoLogin = async () => {
    if (!tgUser) {
      console.log("No Telegram user found")
      setLoading(false)
      return
    }

    try {
      console.log("Auto login for Telegram user:", tgUser.id)

      // Find user by Telegram ID
      const { data: existingUser, error: searchError } = await supabase
        .from("users")
        .select("*")
        .eq("telegram_id", tgUser.id.toString())
        .single()

      if (searchError && searchError.code !== "PGRST116") {
        throw searchError
      }

      let userData = existingUser

      // If user doesn't exist, create new user
      if (!existingUser) {
        console.log("Creating new user for Telegram ID:", tgUser.id)

        const { data: newUser, error: createError } = await supabase
          .from("users")
          .insert([
            {
              telegram_id: tgUser.id.toString(),
              first_name: tgUser.first_name,
              last_name: tgUser.last_name || "",
              username: tgUser.username || "",
              is_verified: true,
              role: "customer",
            },
          ])
          .select()
          .single()

        if (createError) {
          console.error("Error creating user:", createError)
          throw createError
        }
        userData = newUser
        console.log("New user created successfully:", userData.id)
      } else {
        console.log("Existing user found, updating info...")

        // Update existing user info
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || "",
            username: tgUser.username || "",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingUser.id)
          .select()
          .single()

        if (updateError) {
          console.error("Error updating user:", updateError)
          throw updateError
        }
        userData = updatedUser
      }

      setUser(userData)
      localStorage.setItem("jamolstroy_user", JSON.stringify(userData))
      console.log("Telegram auto login successful for:", userData.first_name)
    } catch (error) {
      console.error("Telegram auto login error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebSession = async () => {
    try {
      // Check local storage first
      const savedUser = localStorage.getItem("jamolstroy_user")
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        setUser(userData)
        console.log("Local session found for:", userData.first_name)
      }

      // Check URL for login token
      const urlParams = new URLSearchParams(window.location.search)
      const loginToken = urlParams.get("login_token")

      if (loginToken) {
        console.log("Login token found in URL:", loginToken)
        const loginUser = await checkWebsiteLoginStatus(loginToken)
        if (loginUser) {
          setUser(loginUser)
          localStorage.setItem("jamolstroy_user", JSON.stringify(loginUser))
          console.log("Website login successful for:", loginUser.first_name)
          // Remove token from URL
          window.history.replaceState({}, document.title, window.location.pathname)
        }
      }
    } catch (error) {
      console.error("Web session check error:", error)
    } finally {
      setLoading(false)
    }
  }

  const checkWebsiteLoginStatus = async (token: string): Promise<UserProfile | null> => {
    try {
      console.log("Checking website login status for token:", token)

      const { data, error } = await supabase
        .from("website_login_sessions")
        .select(`
          *,
          user:users(*)
        `)
        .eq("temp_token", token)
        .eq("status", "approved")
        .single()

      if (error) {
        console.log("Website login session not found or not approved:", error.message)
        return null
      }

      if (!data?.user) {
        console.log("No user data in login session")
        return null
      }

      console.log("Website login session found for user:", data.user.first_name)
      return data.user as UserProfile
    } catch (error) {
      console.error("Website login status check error:", error)
      return null
    }
  }

  const signOut = () => {
    setUser(null)
    localStorage.removeItem("jamolstroy_user")
  }

  const value = {
    user,
    profile: user, // For backward compatibility
    loading,
    signOut,
    checkWebsiteLoginStatus,
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
