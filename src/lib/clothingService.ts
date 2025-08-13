import { supabase } from './supabase'
import type { ClothingItem } from './supabase'

export interface CreateClothingItemData {
  type: ClothingItem['type']
  color: ClothingItem['color']
  seasons: string[]
  styles: string[]
  image_url: string
}

export interface UpdateClothingItemData extends Partial<CreateClothingItemData> {
  id: string
}

export interface ClothingItemFilters {
  type?: string
  color?: string
  season?: string
  style?: string
}

export class ClothingService {
  /**
   * Create a new clothing item
   */
  static async createItem(itemData: CreateClothingItemData): Promise<ClothingItem> {
    const { data, error } = await supabase
      .from('clothing_items')
      .insert([
        {
          ...itemData,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating clothing item:', error)
      throw new Error('Failed to create clothing item')
    }

    return data
  }

  /**
   * Get all clothing items for the current user
   */
  static async getItems(filters: ClothingItemFilters = {}): Promise<ClothingItem[]> {
    let query = supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.color) {
      query = query.eq('color', filters.color)
    }
    if (filters.season) {
      query = query.contains('seasons', [filters.season])
    }
    if (filters.style) {
      query = query.contains('styles', [filters.style])
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching clothing items:', error)
      throw new Error('Failed to fetch clothing items')
    }

    return data || []
  }

  /**
   * Get a single clothing item by ID
   */
  static async getItem(id: string): Promise<ClothingItem | null> {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Item not found
      }
      console.error('Error fetching clothing item:', error)
      throw new Error('Failed to fetch clothing item')
    }

    return data
  }

  /**
   * Update a clothing item
   */
  static async updateItem(itemData: UpdateClothingItemData): Promise<ClothingItem> {
    const { id, ...updateData } = itemData
    
    const { data, error } = await supabase
      .from('clothing_items')
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating clothing item:', error)
      throw new Error('Failed to update clothing item')
    }

    return data
  }

  /**
   * Delete a clothing item
   */
  static async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('clothing_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting clothing item:', error)
      throw new Error('Failed to delete clothing item')
    }
  }

  /**
   * Get clothing item statistics
   */
  static async getStats(): Promise<{
    total: number
    byType: Record<string, number>
    byColor: Record<string, number>
  }> {
    const { data, error } = await supabase
      .from('clothing_items')
      .select('type, color')

    if (error) {
      console.error('Error fetching clothing stats:', error)
      throw new Error('Failed to fetch clothing statistics')
    }

    const items = data || []
    const byType: Record<string, number> = {}
    const byColor: Record<string, number> = {}

    items.forEach(item => {
      byType[item.type] = (byType[item.type] || 0) + 1
      byColor[item.color] = (byColor[item.color] || 0) + 1
    })

    return {
      total: items.length,
      byType,
      byColor,
    }
  }
}