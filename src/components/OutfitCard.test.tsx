import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OutfitCard from './OutfitCard'
import type { OutfitSuggestion } from '../lib/outfitService'
import '../i18n'

import type { ClothingItem } from '../lib/supabase'

const outfit: OutfitSuggestion = {
  id: 'o1',
  score: 88,
  reasoning: ['All neutral colors create a classic, timeless look'],
  items: {
    top: { id: 't1', type: 'top', color: 'blue', image_url: 'top.jpg' } as ClothingItem,
    bottom: { id: 'b1', type: 'bottom', color: 'white', image_url: 'bottom.jpg' } as ClothingItem,
    shoes: { id: 's1', type: 'shoes', color: 'gray', image_url: 'shoes.jpg' } as ClothingItem,
    accessory: { id: 'a1', type: 'accessory', color: 'black', image_url: 'acc.jpg' } as ClothingItem,
  },
}

describe('OutfitCard', () => {
  it('renders score and colors', () => {
    render(<OutfitCard outfit={outfit} onSave={vi.fn()} />)
    expect(screen.getByText(/(Excellent|Отлично)/i)).toBeTruthy()
    expect(screen.getByText(/blue/i)).toBeTruthy()
    expect(screen.getByText(/white/i)).toBeTruthy()
    expect(screen.getByText(/gray/i)).toBeTruthy()
  })

  it('opens modal and accepts custom name input', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<OutfitCard outfit={outfit} onSave={onSave} />)

    const user = userEvent.setup()
    const saveButtons = screen.getAllByText(/(Save Look|Сохранить образ)/i)
    await user.click(saveButtons[0])

    const dialog = await screen.findByRole('dialog')
    const input = within(dialog).getByPlaceholderText(/(Leave empty for auto-generated name|Оставьте пустым для авто-имени)/i)
    await user.type(input, 'My Fit')
    const confirmButton = within(dialog).getByRole('button', { name: /(Save|Сохранить)/i })
    expect(confirmButton).toBeTruthy()
  })
})


