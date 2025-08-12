import { describe, it, expect } from 'vitest'
import { ColorHarmonyEngine } from './colorRules'

describe('ColorHarmonyEngine', () => {
  it('classifies neutrals and bolds', () => {
    expect(ColorHarmonyEngine.isNeutral('black')).toBe(true)
    expect(ColorHarmonyEngine.isNeutral('navy')).toBe(true)
    expect(ColorHarmonyEngine.isNeutral('red')).toBe(false)

    expect(ColorHarmonyEngine.isBold('red')).toBe(true)
    expect(ColorHarmonyEngine.isBold('green')).toBe(true)
    expect(ColorHarmonyEngine.isBold('white')).toBe(false)
  })

  it('pairs colors: neutrals with anything, same color ok, and specific pairs', () => {
    expect(ColorHarmonyEngine.canPairColors('black', 'red')).toBe(true)
    expect(ColorHarmonyEngine.canPairColors('blue', 'blue')).toBe(true)
    expect(ColorHarmonyEngine.canPairColors('red', 'navy')).toBe(true)
    expect(ColorHarmonyEngine.canPairColors('red', 'green')).toBe(false)
  })

  it('scores combinations with bonuses and penalties', () => {
    const allNeutrals = ColorHarmonyEngine.scoreColorCombination('black', 'gray', 'white')
    expect(allNeutrals).toBeGreaterThanOrEqual(95)

    // Bold top+bottom that DO pair + neutral shoes should be high-scoring
    const harmoniousBold = ColorHarmonyEngine.scoreColorCombination('pink', 'brown', 'black')
    expect(harmoniousBold).toBeGreaterThanOrEqual(80)

    // Clear clash should reduce score
    const clash = ColorHarmonyEngine.scoreColorCombination('red', 'green', 'yellow')
    expect(clash).toBeLessThan(60)
  })

  it('generates reasoning strings aligned with rules', () => {
    const reasons = ColorHarmonyEngine.generateColorReasoning('red', 'blue', 'black')
    expect(reasons.some(r => r.toLowerCase().includes('neutral'))).toBe(true)
  })
})


