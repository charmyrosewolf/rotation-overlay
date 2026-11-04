import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Legend } from './Legend'

describe('Legend', () => {
  it('lists the seven chip labels in order', () => {
    const { container } = render(<Legend />)
    const chips = Array.from(container.firstElementChild?.children ?? [])
    expect(chips.map((c) => c.textContent)).toEqual([
      'Basic', 'Skill', 'Echo', 'Lib', 'Heavy/Forte', 'Intro/Outro', 'Move'
    ])
  })

  it('colours each label by its own type', () => {
    const { container } = render(<Legend />)
    const chips = Array.from(container.firstElementChild?.children ?? [])
    const types = ['basic', 'skill', 'echo', 'lib', 'heavy', 'io', 'move']
    types.forEach((t, i) => expect(chips[i]?.className).toContain(t))
  })

  it('draws every chip small', () => {
    const { container } = render(<Legend />)
    const chips = Array.from(container.firstElementChild?.children ?? [])
    expect(chips).toHaveLength(7)
    chips.forEach((c) => expect(c.className).toContain('small'))
  })

  it('draws no key badges', () => {
    const { container } = render(<Legend />)
    const chips = Array.from(container.firstElementChild?.children ?? [])
    chips.forEach((c) => expect(c.childElementCount).toBe(0))
  })
})
