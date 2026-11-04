import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ActionChip } from './ActionChip'

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
    expect(screen.getByText('Forte').className).toContain('heavy')
  })

  it('carries the small class when small is set, and only then', () => {
    const chip = { type: 'basic', label: 'Basic' } as const
    const { rerender } = render(<ActionChip chip={chip} showKeys={false} small />)
    expect(screen.getByText('Basic').className).toContain('small')
    rerender(<ActionChip chip={chip} showKeys={false} />)
    expect(screen.getByText('Basic').className).not.toContain('small')
  })
})
