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
        const parsed = JSON.parse(cached) as Partial<AIStylistOpinion>
        const hasValidRating = typeof parsed.rating === 'number' && parsed.rating >= 0 && parsed.rating <= 100
        const hasSomeContent = typeof parsed.summary === 'string' && parsed.summary.length > 0
        if (hasValidRating || hasSomeContent) {
          return parsed as AIStylistOpinion
        }
        // stale/empty cache from earlier failures — purge and continue to fetch fresh
        localStorage.removeItem(this.cacheKey(key))
      } catch {
        // bad cache — purge and continue
        localStorage.removeItem(this.cacheKey(key))
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
    if (!data || (typeof data === 'object' && Object.keys(data as Record<string, unknown>).length === 0)) {
      // Do not cache empty/invalid responses; allow user to retry
      throw new Error('AI returned no opinion. Please try again.')
    }

    localStorage.setItem(this.cacheKey(key), JSON.stringify(data))
    return data as AIStylistOpinion
  }
}



