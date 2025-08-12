import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within, waitForElementToBeRemoved } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OutfitCard from './OutfitCard'

const outfit = {
  id: 'o1',
  score: 88,
  reasoning: ['All neutral colors create a classic, timeless look'],
  items: {
    top: { id: 't1', type: 'top', color: 'blue', image_url: 'top.jpg' } as any,
    bottom: { id: 'b1', type: 'bottom', color: 'white', image_url: 'bottom.jpg' } as any,
    shoes: { id: 's1', type: 'shoes', color: 'gray', image_url: 'shoes.jpg' } as any,
    accessory: { id: 'a1', type: 'accessory', color: 'black', image_url: 'acc.jpg' } as any,
  },
}

describe('OutfitCard', () => {
  it('renders score and colors', () => {
    render(<OutfitCard outfit={outfit as any} onSave={vi.fn()} />)
    expect(screen.getByText(/Excellent/i)).toBeInTheDocument()
    expect(screen.getByText(/blue/i)).toBeInTheDocument()
    expect(screen.getByText(/white/i)).toBeInTheDocument()
    expect(screen.getByText(/gray/i)).toBeInTheDocument()
  })

  it('opens modal and saves with custom name (calls onSave)', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<OutfitCard outfit={outfit as any} onSave={onSave} />)

    const user = userEvent.setup()
    const saveButtons = screen.getAllByText(/Save Look/i)
    await user.click(saveButtons[0])

    const dialog = await screen.findByRole('dialog')
    const input = within(dialog).getByPlaceholderText(/Leave empty for auto-generated name/i)
    await user.type(input, 'My Fit')
    const confirmButton = within(dialog).getByRole('button', { name: /^Save$/ })
    await user.click(confirmButton)

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.any(Object), 'My Fit'))
  })
})


