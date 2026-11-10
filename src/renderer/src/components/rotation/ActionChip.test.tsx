import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActionChip } from './ActionChip'
import { chip as chipStyle } from './ActionChip.css'

const variant = chipStyle.classNames.variants

describe('ActionChip', () => {
  it('shows the label, and the key when showKeys is on', () => {
    render(<ActionChip chip={{ type: 'skill', label: 'Skill', key: 'E' }} showKeys />)
    expect(screen.getByText('Skill')).toBeInTheDocument()
    expect(screen.getByText('E')).toBeInTheDocument()
  })

  it('keeps the key out of the DOM when showKeys is off', () => {
    render(<ActionChip chip={{ type: 'skill', label: 'Skill', key: 'E' }} showKeys={false} />)
    expect(screen.getByText('Skill')).toBeInTheDocument()
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })

  it('draws no badge for a chip without a key, even with showKeys on', () => {
    render(<ActionChip chip={{ type: 'move', label: 'Dash' }} showKeys />)
    expect(screen.getByText('Dash').childElementCount).toBe(0)
  })

  it('carries a class named for its type', () => {
    render(<ActionChip chip={{ type: 'heavy', label: 'Forte' }} showKeys={false} />)
    expect(screen.getByText('Forte')).toHaveClass(variant.type.heavy)
  })

  it.each(['normal', 'charged', 'plunge', 'burst', 'swap'] as const)(
    'carries a class named for the Genshin type %s',
    (type) => {
      render(<ActionChip chip={{ type, label: 'X' }} showKeys={false} />)
      expect(screen.getByText('X')).toHaveClass(variant.type[type])
    }
  )

  it('carries the small class when small is set, and only then', () => {
    const chip = { type: 'basic', label: 'Basic' } as const
    const { rerender } = render(<ActionChip chip={chip} showKeys={false} small />)
    expect(screen.getByText('Basic')).toHaveClass(variant.small.true)
    rerender(<ActionChip chip={chip} showKeys={false} />)
    expect(screen.getByText('Basic')).not.toHaveClass(variant.small.true)
  })
})
