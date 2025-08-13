import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OutfitSuggestionService } from './outfitService'
import type { ClothingItem } from './supabase'
import { ClothingService } from './clothingService'

const defaultItems = [
  { id: 't1', type: 'top', color: 'blue', seasons: ['summer'], styles: ['casual'], image_url: '', user_id: '', created_at: '', updated_at: '' },
  { id: 'b1', type: 'bottom', color: 'white', seasons: ['summer'], styles: ['casual'], image_url: '', user_id: '', created_at: '', updated_at: '' },
  { id: 's1', type: 'shoes', color: 'gray', seasons: ['summer'], styles: ['casual'], image_url: '', user_id: '', created_at: '', updated_at: '' },
  { id: 'a1', type: 'accessory', color: 'black', seasons: ['all'], styles: ['casual'], image_url: '', user_id: '', created_at: '', updated_at: '' },
]

let getItemsSpy: any

beforeEach(() => {
  getItemsSpy?.mockRestore()
  getItemsSpy = vi.spyOn(ClothingService, 'getItems').mockResolvedValue(defaultItems as ClothingItem[])
})

describe('OutfitSuggestionService.generateSuggestions', () => {

  it('returns scored suggestions above threshold for season', async () => {
    const suggestions = await OutfitSuggestionService.generateSuggestions({
      seasonPreference: 'summer',
      includeAccessories: true,
      maxSuggestions: 6,
    })
    expect(suggestions.length).toBeGreaterThan(0)
    for (const s of suggestions) {
      expect(s.score).toBeGreaterThanOrEqual(65)
      expect(s.items.top.type).toBe('top')
      expect(s.items.bottom.type).toBe('bottom')
      expect(s.items.shoes.type).toBe('shoes')
    }
  })

  it('throws INSUFFICIENT_ITEMS when a category is missing', async () => {
    ;(getItemsSpy as unknown as { mockResolvedValueOnce: (v: ClothingItem[]) => void }).mockResolvedValueOnce([
      { id: 't1', type: 'top', color: 'blue', seasons: ['summer'], styles: ['casual'], image_url: '', user_id: '', created_at: '', updated_at: '' },
    ] as unknown as ClothingItem[])
    await expect(
      OutfitSuggestionService.generateSuggestions()
    ).rejects.toThrowError(/INSUFFICIENT_ITEMS/)
  })
})


