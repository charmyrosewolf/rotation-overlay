import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ChipType } from '../../data/games'
import { chip as chipStyle } from '../rotation/ActionChip.css'
import { Legend } from './Legend'

const variant = chipStyle.classNames.variants
const chipsOf = (container: HTMLElement) => Array.from(container.firstElementChild?.children ?? [])
const labelsOf = (container: HTMLElement) =>
  chipsOf(container).map((c) => c.firstChild?.textContent)
// the badge, if any, is the chip's only element and comes after the label
const badgesOf = (container: HTMLElement) =>
  chipsOf(container).map((c) => (c.lastChild === c.lastElementChild ? c.lastElementChild : null))

describe('Legend', () => {
  it('lists the eight chip labels in order', () => {
    const { container } = render(<Legend game="wuwa" />)
    expect(labelsOf(container)).toEqual([
      'Basic', 'Skill', 'Echo', 'Lib', 'Heavy', 'Forte', 'Intro/Outro', 'Move'
    ])
  })

  it('colours each label by its own type', () => {
    const { container } = render(<Legend game="wuwa" />)
    const chips = chipsOf(container)
    const types: ChipType[] = ['basic', 'skill', 'echo', 'lib', 'heavy', 'forte', 'io', 'move']
    types.forEach((t, i) => expect(chips[i]).toHaveClass(variant.type[t]))
  })

  it('draws every chip small', () => {
    const { container } = render(<Legend game="wuwa" />)
    const chips = chipsOf(container)
    expect(chips).toHaveLength(8)
    chips.forEach((c) => expect(c).toHaveClass(variant.small.true))
  })

  it('puts each Genshin default key right of its label', () => {
    const { container } = render(<Legend game="genshin" />)
    expect(badgesOf(container).map((b) => b?.textContent ?? null)).toEqual([
      'LMB', 'hold LMB', 'LMB (airborne)', 'E', 'Q', null, null
    ])
  })

  it('puts each WuWa default key right of its label', () => {
    const { container } = render(<Legend game="wuwa" />)
    expect(badgesOf(container).map((b) => b?.textContent ?? null)).toEqual([
      'LMB', 'E', 'Q', 'R', 'hold LMB', 'E', 'auto', 'Shift · Space'
    ])
  })

  it('draws no key badge on Genshin swap or move', () => {
    const { container } = render(<Legend game="genshin" />)
    chipsOf(container).slice(5).forEach((c) => expect(c.childElementCount).toBe(0))
  })

  it('titles a WuWa chip with its full name', () => {
    const { container } = render(<Legend game="wuwa" />)
    expect(chipsOf(container)[3]?.getAttribute('title')).toBe('Resonance Liberation')
  })

  it('lists the seven Genshin labels in order, coloured by type', () => {
    const { container } = render(<Legend game="genshin" />)
    const chips = chipsOf(container)
    expect(labelsOf(container)).toEqual([
      'Normal', 'Charged', 'Plunge', 'Skill', 'Burst', 'Swap', 'Move'
    ])
    const types: ChipType[] = ['normal', 'charged', 'plunge', 'skill', 'burst', 'swap', 'move']
    types.forEach((t, i) => expect(chips[i]).toHaveClass(variant.type[t]))
  })

  it('gives each Genshin chip its hover title', () => {
    const { container } = render(<Legend game="genshin" />)
    expect(chipsOf(container).map((c) => c.getAttribute('title'))).toEqual([
      'Normal Attack',
      'Charged Attack',
      'Plunging Attack',
      'Elemental Skill',
      'Elemental Burst',
      'Swap character',
      'Dash / Jump / Drift'
    ])
  })

  it('shows no WuWa label in a Genshin legend', () => {
    const { container } = render(<Legend game="genshin" />)
    const labels = labelsOf(container)
    expect(labels).toHaveLength(7)
    for (const wuwaOnly of ['Lib', 'Echo', 'Intro/Outro']) expect(labels).not.toContain(wuwaOnly)
  })

  it('renders an empty legend for a game with no registry entry', () => {
    const { container } = render(<Legend game="hsr" />)
    expect(container.firstElementChild?.childElementCount).toBe(0)
  })
})
