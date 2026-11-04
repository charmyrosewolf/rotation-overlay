import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CollapsedBar } from './CollapsedBar'

const text = (el: React.ReactElement) => render(el).container.textContent

describe('CollapsedBar', () => {
  it('shows the team label alone, with no separator', () => {
    const shown = text(<CollapsedBar teamLabel="Cartethyia" />)
    expect(shown).toBe('Cartethyia')
    expect(shown).not.toContain(' · ')
  })

  it('appends the variant label after a middle dot', () => {
    expect(text(<CollapsedBar teamLabel="Cartethyia" variantLabel="Quick swap" />)).toBe(
      'Cartethyia · Quick swap'
    )
  })
})
