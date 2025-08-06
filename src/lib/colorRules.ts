/**
 * Color Harmony Engine for Outfit Suggestions
 * Implements the rules from VISION.md Section 6
 */

export const NEUTRALS = ['black', 'white', 'gray', 'beige', 'navy'] as const
export const BOLD_COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown'] as const

export class ColorHarmonyEngine {
  /**
   * Check if a color is neutral
   */
  static isNeutral(color: string): boolean {
    return NEUTRALS.includes(color.toLowerCase() as any)
  }

  /**
   * Check if a color is bold/non-neutral
   */
  static isBold(color: string): boolean {
    return BOLD_COLORS.includes(color.toLowerCase() as any)
  }

  /**
   * Check if two colors can be paired together
   * Rule: Neutrals can pair with anything
   * Rule: Same color is OK
   * Rule: Specific good combinations defined
   */
  static canPairColors(color1: string, color2: string): boolean {
    const c1 = color1.toLowerCase()
    const c2 = color2.toLowerCase()

    // Rule 1: Neutrals can pair with anything
    if (this.isNeutral(c1) || this.isNeutral(c2)) return true

    // Rule 2: Same color is OK for different items
    if (c1 === c2) return true

    // Rule 3: Specific good combinations
    const goodPairs: Record<string, string[]> = {
      'red': ['white', 'black', 'gray', 'navy', 'beige'],
      'blue': ['white', 'gray', 'brown', 'beige', 'navy'],
      'green': ['brown', 'beige', 'white', 'gray', 'navy'],
      'yellow': ['gray', 'navy', 'brown', 'white'],
      'orange': ['brown', 'navy', 'gray', 'white'],
      'purple': ['gray', 'white', 'black'],
      'pink': ['gray', 'white', 'navy', 'brown'],
      'brown': ['beige', 'white', 'gray', 'green', 'blue', 'orange', 'pink']
    }

    return goodPairs[c1]?.includes(c2) || goodPairs[c2]?.includes(c1) || false
  }

  /**
   * Score a three-piece color combination (top, bottom, shoes)
   * Higher score = better combination
   */
  static scoreColorCombination(top: string, bottom: string, shoes: string): number {
    let score = 100

    // Deduct points for bad combinations
    if (!this.canPairColors(top, bottom)) {
      score -= 40 // Top and bottom must work together
    }
    
    if (!this.canPairColors(top, shoes)) {
      score -= 15 // Top and shoes less critical
    }
    
    if (!this.canPairColors(bottom, shoes)) {
      score -= 15 // Bottom and shoes less critical
    }

    // Bonus points for good practices
    
    // Bonus: Neutral shoes with bold top+bottom (VISION.md rule)
    if (this.isBold(top) && this.isBold(bottom) && this.isNeutral(shoes)) {
      score += 20
    }

    // Bonus: All neutrals (classic look)
    if (this.isNeutral(top) && this.isNeutral(bottom) && this.isNeutral(shoes)) {
      score += 15
    }

    // Bonus: One bold color with neutrals (balanced look)
    const boldCount = [top, bottom, shoes].filter(color => this.isBold(color)).length
    if (boldCount === 1) {
      score += 10
    }

    // Penalty: Too many bold colors without harmony
    if (boldCount >= 2) {
      const allPair = this.canPairColors(top, bottom) && 
                     this.canPairColors(top, shoes) && 
                     this.canPairColors(bottom, shoes)
      if (!allPair) {
        score -= 20
      }
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Generate reasoning for why a color combination works (or doesn't)
   */
  static generateColorReasoning(top: string, bottom: string, shoes: string): string[] {
    const reasons: string[] = []

    // Neutral advantages
    if (this.isNeutral(shoes)) {
      reasons.push(`${shoes} shoes work with any color combination`)
    }

    // Color harmony
    if (this.canPairColors(top, bottom)) {
      if (this.isNeutral(top) || this.isNeutral(bottom)) {
        reasons.push(`${top} and ${bottom} create a balanced look`)
      } else {
        reasons.push(`${top} and ${bottom} are complementary colors`)
      }
    }

    // Special combinations
    if (this.isBold(top) && this.isBold(bottom) && this.isNeutral(shoes)) {
      reasons.push(`Neutral shoes balance the bold top and bottom`)
    }

    // All neutrals
    const neutralCount = [top, bottom, shoes].filter(color => this.isNeutral(color)).length
    if (neutralCount === 3) {
      reasons.push(`All neutral colors create a classic, timeless look`)
    }

    // Warning for bad combinations
    if (!this.canPairColors(top, bottom)) {
      reasons.push(`⚠️ ${top} and ${bottom} may clash`)
    }

    return reasons
  }

  /**
   * Get suggested shoe colors for a top/bottom combination
   */
  static suggestShoeColors(top: string, bottom: string): string[] {
    // If both top and bottom are bold, strongly suggest neutrals
    if (this.isBold(top) && this.isBold(bottom)) {
      return ['black', 'white', 'gray', 'brown']
    }

    // General good shoe options
    const suggestions = new Set<string>()
    
    // Always suggest neutrals
    NEUTRALS.forEach(neutral => suggestions.add(neutral))
    
    // Add colors that pair well with both top and bottom
    for (const color of [...NEUTRALS, ...BOLD_COLORS]) {
      if (this.canPairColors(color, top) && this.canPairColors(color, bottom)) {
        suggestions.add(color)
      }
    }

    return Array.from(suggestions)
  }
}