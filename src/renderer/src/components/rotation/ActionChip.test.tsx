import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActionChip } from './ActionChip'
import { chip as chipStyle } from './ActionChip.css'

const variant = chipStyle.classNames.variants

describe('ActionChip', () => {
  it('shows the label and its key', () => {
    render(<ActionChip chip={{ type: 'skill', label: 'Skill', key: 'hold E' }} />)
    expect(screen.getByText('Skill')).toBeInTheDocument()
    expect(screen.getByText('hold E')).toBeInTheDocument()
  })

  it('draws no badge for a chip without a key', () => {
    render(<ActionChip chip={{ type: 'move', label: 'Dash' }} />)
    expect(screen.getByText('Dash').childElementCount).toBe(0)
  })

  it('carries a class named for its type', () => {
    render(<ActionChip chip={{ type: 'heavy', label: 'Forte' }} />)
    expect(screen.getByText('Forte')).toHaveClass(variant.type.heavy)
  })

  it.each(['normal', 'charged', 'plunge', 'burst', 'swap'] as const)(
    'carries a class named for the Genshin type %s',
    (type) => {
      render(<ActionChip chip={{ type, label: 'X' }} />)
      expect(screen.getByText('X')).toHaveClass(variant.type[type])
    }
  )

  it('carries the small class when small is set, and only then', () => {
    const chip = { type: 'basic', label: 'Basic' } as const
    const { rerender } = render(<ActionChip chip={chip} small />)
    expect(screen.getByText('Basic')).toHaveClass(variant.small.true)
    rerender(<ActionChip chip={chip} />)
    expect(screen.getByText('Basic')).not.toHaveClass(variant.small.true)
  })
})
