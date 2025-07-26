import { createSupabaseClient } from "./supabase"

// Helper function to create authenticated Supabase client
export const getAuthenticatedSupabase = (user: any) => {
  if (!user?.id) {
    throw new Error("User not authenticated")
  }

  return createSupabaseClient(user.id)
}

// Helper function to create Supabase client with token
export const getSupabaseWithToken = (token: string) => {
  return createSupabaseClient(undefined, token)
}
