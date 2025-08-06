import { v4 as uuidv4 } from 'uuid'
import { supabase } from './supabase'
import { ClothingService } from './clothingService'
import { ColorHarmonyEngine } from './colorRules'
import type { ClothingItem, Outfit, OutfitItem, WearLog } from './supabase'

export interface OutfitSuggestion {
  id: string
  items: {
    top: ClothingItem
    bottom: ClothingItem
    shoes: ClothingItem
    accessory?: ClothingItem
  }
  score: number
  reasoning: string[]
}

export interface OutfitSuggestionOptions {
  seasonPreference?: string
  includeAccessories?: boolean
  maxSuggestions?: number
}

export class OutfitSuggestionService {
  /**
   * Generate outfit suggestions for the current user
   */
  static async generateSuggestions(
    options: OutfitSuggestionOptions = {}
  ): Promise<OutfitSuggestion[]> {
    const {
      seasonPreference,
      includeAccessories = true,
      maxSuggestions = 6
    } = options

    try {
      // 1. Get user's clothing items
      const allItems = await ClothingService.getItems()
      
      // 2. Group by type
      const tops = allItems.filter(i => i.type === 'top')
      const bottoms = allItems.filter(i => i.type === 'bottom')
      const shoes = allItems.filter(i => i.type === 'shoes')
      const accessories = allItems.filter(i => i.type === 'accessory')

      // 3. Check minimum requirements
      if (tops.length === 0 || bottoms.length === 0 || shoes.length === 0) {
        throw new Error('INSUFFICIENT_ITEMS')
      }

      // 4. Pre-filter items by season if specified
      let seasonFilteredTops = tops
      let seasonFilteredBottoms = bottoms
      let seasonFilteredShoes = shoes
      let seasonFilteredAccessories = accessories

      if (seasonPreference) {
        seasonFilteredTops = tops.filter(item => 
          this.isSeasonAppropriate(item, seasonPreference)
        )
        seasonFilteredBottoms = bottoms.filter(item => 
          this.isSeasonAppropriate(item, seasonPreference)
        )
        seasonFilteredShoes = shoes.filter(item => 
          this.isSeasonAppropriate(item, seasonPreference)
        )
        seasonFilteredAccessories = accessories.filter(item => 
          this.isSeasonAppropriate(item, seasonPreference)
        )

        // Check if we have enough items after filtering
        if (seasonFilteredTops.length === 0 || 
            seasonFilteredBottoms.length === 0 || 
            seasonFilteredShoes.length === 0) {
          
          // Fallback: if strict filtering leaves us with nothing, 
          // use all items but heavily penalize wrong season items
          console.log(`Not enough ${seasonPreference} items, using all items with season penalties`)
          seasonFilteredTops = tops
          seasonFilteredBottoms = bottoms
          seasonFilteredShoes = shoes
          seasonFilteredAccessories = accessories
        }
      }

      // 5. Generate combinations from filtered items
      const combinations: OutfitSuggestion[] = []

      for (const top of seasonFilteredTops) {
        for (const bottom of seasonFilteredBottoms) {
          for (const shoe of seasonFilteredShoes) {
            // Base outfit without accessories
            const baseOutfit = {
              id: uuidv4(),
              items: { top, bottom, shoes: shoe },
              score: 0,
              reasoning: []
            }
            combinations.push(baseOutfit)

            // Add accessories if requested and available
            if (includeAccessories && seasonFilteredAccessories.length > 0) {
              for (const accessory of seasonFilteredAccessories.slice(0, 2)) { // Limit accessories
                combinations.push({
                  id: uuidv4(),
                  items: { top, bottom, shoes: shoe, accessory },
                  score: 0,
                  reasoning: []
                })
              }
            }
          }
        }
      }

      // 5. Score each combination
      const scoredOutfits = combinations.map(outfit => {
        const scored = this.scoreOutfit(outfit, seasonPreference)
        return {
          ...outfit,
          score: scored.score,
          reasoning: scored.reasoning
        }
      })

      // 6. Filter, sort, and return best suggestions
      const minScore = seasonPreference ? 65 : 60 // Higher threshold when season is specified
      return scoredOutfits
        .filter(outfit => outfit.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxSuggestions)

    } catch (error) {
      console.error('Error generating outfit suggestions:', error)
      if (error instanceof Error && error.message === 'INSUFFICIENT_ITEMS') {
        throw error
      }
      throw new Error('Failed to generate outfit suggestions')
    }
  }

  /**
   * Score an outfit combination
   */
  private static scoreOutfit(
    outfit: OutfitSuggestion,
    seasonPreference?: string
  ): { score: number; reasoning: string[] } {
    const { top, bottom, shoes, accessory } = outfit.items
    let totalScore = 0
    const reasoning: string[] = []

    // 1. Color Harmony Score (45% weight)
    const colorScore = ColorHarmonyEngine.scoreColorCombination(
      top.color,
      bottom.color,
      shoes.color
    )
    totalScore += colorScore * 0.45

    // Add color reasoning
    const colorReasons = ColorHarmonyEngine.generateColorReasoning(
      top.color,
      bottom.color,
      shoes.color
    )
    reasoning.push(...colorReasons)

    // 2. Season Matching Score (40% weight - increased importance)
    if (seasonPreference) {
      const seasonScore = this.scoreSeasonMatch([top, bottom, shoes], seasonPreference)
      totalScore += seasonScore * 0.4

      // Check if any items are completely wrong for the season
      const wrongSeasonItems = [top, bottom, shoes].filter(item => 
        !this.isSeasonAppropriate(item, seasonPreference)
      )
      
      if (wrongSeasonItems.length > 0) {
        // Heavy penalty for wrong season items
        totalScore -= 30 * wrongSeasonItems.length
        reasoning.push(`⚠️ Some items not ideal for ${seasonPreference}`)
      } else if (seasonScore >= 80) {
        reasoning.push(`Perfect for ${seasonPreference} weather`)
      } else if (seasonScore >= 50) {
        reasoning.push(`Suitable for ${seasonPreference}`)
      }
    } else {
      // No season preference, give neutral score
      totalScore += 75 * 0.4
    }

    // 3. Variety/Balance Score (15% weight)
    const varietyScore = this.scoreItemVariety([top, bottom, shoes, accessory].filter(Boolean) as ClothingItem[])
    totalScore += varietyScore * 0.15

    if (varietyScore >= 80) {
      reasoning.push(`Good variety in clothing types`)
    }

    // 4. Accessory bonus (if present)
    if (accessory) {
      // Small bonus for including accessories
      totalScore += 5
      
      // Check if accessory color works
      const accessoryColorScore = Math.min(
        ColorHarmonyEngine.scoreColorCombination(top.color, accessory.color, 'black'),
        ColorHarmonyEngine.scoreColorCombination(bottom.color, accessory.color, 'black')
      )
      
      if (accessoryColorScore >= 70) {
        totalScore += 5
        reasoning.push(`${accessory.color} accessory complements the outfit`)
      }
    }

    return {
      score: Math.round(Math.max(0, Math.min(100, totalScore))),
      reasoning: reasoning.slice(0, 3) // Limit to top 3 reasons
    }
  }

  /**
   * Check if an item is appropriate for a given season
   */
  private static isSeasonAppropriate(item: ClothingItem, targetSeason: string): boolean {
    // Items tagged for all seasons are always appropriate
    if (item.seasons.includes('all') || item.seasons.length >= 3) {
      return true
    }

    // Item specifically tagged for this season
    if (item.seasons.includes(targetSeason)) {
      return true
    }

    // Adjacent seasons are somewhat appropriate
    const adjacentSeasons: Record<string, string[]> = {
      'spring': ['summer'], // Spring clothes work in early summer
      'summer': ['spring'], // Summer clothes work in late spring  
      'fall': ['winter'],   // Fall clothes work in early winter
      'winter': ['fall']    // Winter clothes work in late fall
    }

    // Allow adjacent seasons but only if item has no strict season restrictions
    if (item.seasons.length === 1) {
      // Single-season items are strict - only allow exact match or adjacent
      return adjacentSeasons[targetSeason]?.includes(item.seasons[0]) || false
    }

    // Multi-season items (but not all) - check if target season is included
    return item.seasons.includes(targetSeason)
  }

  /**
   * Score how well items match a target season
   */
  private static scoreSeasonMatch(items: ClothingItem[], targetSeason: string): number {
    let totalScore = 0

    for (const item of items) {
      // All-season items get neutral score
      if (item.seasons.includes('all') || item.seasons.length >= 3) {
        totalScore += 60
        continue
      }

      // Perfect match gets high score
      if (item.seasons.includes(targetSeason)) {
        totalScore += 100
        continue
      }

      // Adjacent seasons get partial score
      const adjacentSeasons: Record<string, string[]> = {
        'spring': ['summer'],
        'summer': ['spring', 'fall'],
        'fall': ['summer', 'winter'],
        'winter': ['fall']
      }

      if (adjacentSeasons[targetSeason]?.some(s => item.seasons.includes(s))) {
        totalScore += 40
        continue
      }

      // Wrong season gets low score
      totalScore += 20
    }

    return totalScore / items.length
  }

  /**
   * Score item variety (different types, colors, etc.)
   */
  private static scoreItemVariety(items: ClothingItem[]): number {
    const colors = new Set(items.map(item => item.color))
    const types = new Set(items.map(item => item.type))

    let score = 50 // Base score

    // Bonus for color variety (but not too much)
    if (colors.size === 2) score += 20
    if (colors.size === 3) score += 30
    if (colors.size >= 4) score += 10 // Too many colors can be chaotic

    // Bonus for having all required types
    if (types.has('top') && types.has('bottom') && types.has('shoes')) {
      score += 20
    }

    return Math.min(100, score)
  }

  /**
   * Save an outfit suggestion as a user's saved outfit
   */
  static async saveOutfit(
    suggestion: OutfitSuggestion,
    customName?: string
  ): Promise<Outfit> {
    try {
      const user = await supabase.auth.getUser()
      if (!user.data.user) {
        throw new Error('User not authenticated')
      }

      // Generate outfit name
      const name = customName || this.generateOutfitName(suggestion)

      // 1. Create outfit record
      const { data: outfit, error: outfitError } = await supabase
        .from('outfits')
        .insert({
          user_id: user.data.user.id,
          name
        })
        .select()
        .single()

      if (outfitError) {
        throw outfitError
      }

      // 2. Create outfit_items records
      const outfitItems: OutfitItem[] = [
        { outfit_id: outfit.id, item_id: suggestion.items.top.id, role: 'top' },
        { outfit_id: outfit.id, item_id: suggestion.items.bottom.id, role: 'bottom' },
        { outfit_id: outfit.id, item_id: suggestion.items.shoes.id, role: 'shoes' }
      ]

      if (suggestion.items.accessory) {
        outfitItems.push({
          outfit_id: outfit.id,
          item_id: suggestion.items.accessory.id,
          role: 'accessory'
        })
      }

      const { error: itemsError } = await supabase
        .from('outfit_items')
        .insert(outfitItems)

      if (itemsError) {
        // Cleanup: delete the outfit if items insertion failed
        await supabase.from('outfits').delete().eq('id', outfit.id)
        throw itemsError
      }

      return outfit

    } catch (error) {
      console.error('Error saving outfit:', error)
      throw new Error('Failed to save outfit')
    }
  }

  /**
   * Generate a name for an outfit
   */
  private static generateOutfitName(suggestion: OutfitSuggestion): string {
    const { top, bottom, shoes } = suggestion.items
    
    // Try to create a descriptive name
    const dominantColor = this.getDominantColor([top.color, bottom.color, shoes.color])
    const season = this.getCommonSeason([top, bottom, shoes])
    
    const adjectives = ['Casual', 'Classic', 'Modern', 'Stylish', 'Simple', 'Chic']
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)]
    
    if (season && season !== 'all') {
      return `${randomAdj} ${season.charAt(0).toUpperCase() + season.slice(1)} Look`
    }
    
    if (dominantColor) {
      return `${dominantColor.charAt(0).toUpperCase() + dominantColor.slice(1)} ${randomAdj} Outfit`
    }
    
    return `${randomAdj} Outfit #${Math.floor(Math.random() * 100)}`
  }

  /**
   * Get the most common color from a list
   */
  private static getDominantColor(colors: string[]): string | null {
    const colorCounts: Record<string, number> = {}
    
    colors.forEach(color => {
      colorCounts[color] = (colorCounts[color] || 0) + 1
    })
    
    const sortedColors = Object.entries(colorCounts)
      .sort(([,a], [,b]) => b - a)
    
    return sortedColors.length > 0 ? sortedColors[0][0] : null
  }

  /**
   * Get the most common season from items
   */
  private static getCommonSeason(items: ClothingItem[]): string | null {
    const seasonCounts: Record<string, number> = {}
    
    items.forEach(item => {
      item.seasons.forEach(season => {
        if (season !== 'all') {
          seasonCounts[season] = (seasonCounts[season] || 0) + 1
        }
      })
    })
    
    const sortedSeasons = Object.entries(seasonCounts)
      .sort(([,a], [,b]) => b - a)
    
    return sortedSeasons.length > 0 ? sortedSeasons[0][0] : null
  }

  /**
   * Get user's saved outfits
   */
  static async getSavedOutfits(): Promise<(Outfit & { items: ClothingItem[] })[]> {
    try {
      const { data: outfits, error } = await supabase
        .from('outfits')
        .select(`
          *,
          outfit_items!inner(
            role,
            clothing_items!inner(*)
          )
        `)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      // Transform the data structure
      return (outfits || []).map(outfit => ({
        ...outfit,
        items: (outfit as any).outfit_items.map((oi: any) => oi.clothing_items)
      }))

    } catch (error) {
      console.error('Error fetching saved outfits:', error)
      throw new Error('Failed to fetch saved outfits')
    }
  }
}