import { supabase } from './supabase'
import type { OutfitSuggestion } from './outfitService'

export interface AIStylistOpinion {
  rating: number
  summary: string
  pros: string[]
  cons: string[]
  suggestions: string[]
  raw?: unknown
}

export class AIStylistService {
  private static cacheKey(itemsKey: string) {
    return `ai-opinion:${itemsKey}`
  }

  private static makeItemsKey(outfit: OutfitSuggestion) {
    const { top, bottom, shoes, accessory } = outfit.items
    return [top.id, bottom.id, shoes.id, accessory?.id || 'na'].join('|')
  }

  static async getOpinion(outfit: OutfitSuggestion): Promise<AIStylistOpinion> {
    const key = this.makeItemsKey(outfit)
    const cached = localStorage.getItem(this.cacheKey(key))
    if (cached) {
      try {
        return JSON.parse(cached) as AIStylistOpinion
      } catch {
        // ignore cache parse errors
      }
    }

    const payload = {
      items: {
        top: {
          image_url: outfit.items.top.image_url,
          color: outfit.items.top.color,
          type: outfit.items.top.type,
        },
        bottom: {
          image_url: outfit.items.bottom.image_url,
          color: outfit.items.bottom.color,
          type: outfit.items.bottom.type,
        },
        shoes: {
          image_url: outfit.items.shoes.image_url,
          color: outfit.items.shoes.color,
          type: outfit.items.shoes.type,
        },
        accessory: outfit.items.accessory
          ? {
              image_url: outfit.items.accessory.image_url,
              color: outfit.items.accessory.color,
              type: outfit.items.accessory.type,
            }
          : null,
      },
    }

    const { data, error } = await supabase.functions.invoke('ai-opinion', {
      body: payload,
    })

    if (error) throw new Error(error.message || 'AI opinion failed')
    if (!data) throw new Error('Empty AI response')

    localStorage.setItem(this.cacheKey(key), JSON.stringify(data))
    return data as AIStylistOpinion
  }
}



