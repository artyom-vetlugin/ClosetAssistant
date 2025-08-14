import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./supabase', () => {
  return {
    supabase: {
      functions: {
        invoke: vi.fn(),
      },
    },
  }
})

import { AIStylistService } from './aiService'
import { supabase } from './supabase'
import type { OutfitSuggestion } from './outfitService'
import type { ClothingItem } from './supabase'

const mockOpinion = {
  rating: 92,
  summary: 'Cohesive, season-appropriate, and balanced.',
  pros: ['Great harmony', 'Season fit'],
  cons: ['None'],
  suggestions: ['Add subtle accessory'],
}

const outfit: OutfitSuggestion = {
  id: 'o1',
  score: 80,
  reasoning: [],
  items: {
    top: { id: 't1', type: 'top', color: 'blue', image_url: 'top.jpg' } as unknown as ClothingItem,
    bottom: { id: 'b1', type: 'bottom', color: 'white', image_url: 'bottom.jpg' } as unknown as ClothingItem,
    shoes: { id: 's1', type: 'shoes', color: 'gray', image_url: 'shoes.jpg' } as unknown as ClothingItem,
  },
  breakdown: { color: 0, season: 0, style: 0, variety: 0, freshness: 0, accessory: 0, penalties: 0, total: 80 },
}

describe('AIStylistService.getOpinion', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    localStorage.clear()
  })

  it('invokes edge function and returns data', async () => {
    ;(supabase.functions.invoke as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: mockOpinion, error: null } as unknown)

    const res = await AIStylistService.getOpinion(outfit)
    expect(res.rating).toBe(92)
    expect(supabase.functions.invoke).toHaveBeenCalledWith('ai-opinion', expect.objectContaining({ body: expect.any(Object) }))
  })

  it('caches by item IDs and reads from cache second time', async () => {
    ;(supabase.functions.invoke as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: mockOpinion, error: null } as unknown)
    const first = await AIStylistService.getOpinion(outfit)
    expect(first.rating).toBe(92)

    vi.resetAllMocks()
    const second = await AIStylistService.getOpinion(outfit)
    expect(second.rating).toBe(92)
    expect(supabase.functions.invoke).not.toHaveBeenCalled()
  })

  it('throws when function returns error', async () => {
    ;(supabase.functions.invoke as unknown as { mockResolvedValue: (v: unknown) => void }).mockResolvedValue({ data: null, error: { message: 'boom' } } as unknown)
    await expect(AIStylistService.getOpinion(outfit)).rejects.toThrow(/boom/)
  })
})


