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
  color: 'black' | 'white' | 'gray' | 'blue' | 'red' | 'green' | 'yellow' | 'pink' | 'purple' | 'brown' | 'orange' | 'beige' | 'navy'
  seasons: string[] // ['spring', 'summer', 'fall', 'winter']
  image_url: string
  created_at: string
  updated_at: string
}

export interface Outfit {
  id: string
  user_id: string
  name: string
  created_at: string
}

export interface OutfitItem {
  outfit_id: string
  item_id: string
  role: 'top' | 'bottom' | 'shoes' | 'accessory'
}

export interface WearLog {
  id: string
  user_id: string
  outfit_id: string
  worn_date: string
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      clothing_items: {
        Row: ClothingItem
        Insert: Omit<ClothingItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ClothingItem, 'id' | 'created_at'>>
      }
      outfits: {
        Row: Outfit
        Insert: Omit<Outfit, 'id' | 'created_at'>
        Update: Partial<Omit<Outfit, 'id' | 'created_at'>>
      }
      outfit_items: {
        Row: OutfitItem
        Insert: OutfitItem
        Update: never
      }
      wear_logs: {
        Row: WearLog
        Insert: Omit<WearLog, 'id' | 'created_at'>
        Update: never
      }
    }
  }
}