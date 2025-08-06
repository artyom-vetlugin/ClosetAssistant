import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables. Using placeholder values for development.')
}

// Use placeholder values if environment variables are not set (for development)
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

// Database types based on our VISION.md schema
export interface ClothingItem {
  id: string
  user_id: string
  type: 'top' | 'bottom' | 'dress' | 'outerwear' | 'shoes' | 'accessory'
  color: 'black' | 'white' | 'gray' | 'blue' | 'red' | 'green' | 'yellow' | 'pink' | 'purple' | 'brown' | 'orange'
  seasons: string[] // ['spring', 'summer', 'fall', 'winter']
  image_url: string
  created_at: string
  updated_at: string
}

export interface SavedOutfit {
  id: string
  user_id: string
  name: string
  item_ids: string[] // Array of clothing_items IDs
  created_at: string
}

export interface WearLog {
  id: string
  user_id: string
  outfit_id: string | null
  item_ids: string[] // Array of clothing_items IDs
  worn_date: string
  created_at: string
}