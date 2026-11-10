import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ELEMENTS } from '../../data/games'
import type { Unit } from '../../data/schema'
import { block } from './Note.css'
import { UnitCard } from './UnitCard'
import { card as cardClass, edge, marked } from './UnitCard.css'

const unit: Unit = {
  icon: '🌀',
  name: 'Chisa — opener',
  summary: 'cut, ult, snip, forte',
  steps: [
    [{ type: 'skill', label: 'Skill', key: 'E' }],
    [{ type: 'heavy', label: 'Forte' }, { note: 'then' }, { type: 'basic', label: 'Basic' }],
    [{ type: 'lib', label: 'Liberation' }]
  ],
  note: 'repeat from Mornye'
}

const bare: Unit = { icon: '🍃', name: 'Denia', steps: [[{ type: 'move', label: 'Dash' }]] }

type Props = Parameters<typeof UnitCard>[0]
const props = (over: Partial<Props> = {}): Props => ({
  unit,
  showKeys: false,
  marked: false,
  onClick: () => {},
  ...over
})
const mount = (over: Partial<Props> = {}) => render(<UnitCard {...props(over)} />)

const card = (c: HTMLElement) => c.firstElementChild as HTMLElement

describe('UnitCard', () => {
  it('numbers the rows 1..n in order', () => {
    mount()
    const rows = screen.getAllByRole('listitem')
    expect(rows.map((r) => r.firstElementChild?.textContent)).toEqual(['1', '2', '3'])
    expect(rows.map((r) => r.children[1]?.textContent)).toEqual(['Skill', 'Forte', 'Liberation'])
  })

  it('puts icon and name in the h2 with the summary small beside it', () => {
    mount()
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2.textContent).toContain('🌀 Chisa — opener')
    expect(within(h2).getByText('cut, ult, snip, forte').tagName).toBe('SMALL')
  })

  it('ends with the unit note as a block note', () => {
    const { container } = mount()
    const note = screen.getByText('repeat from Mornye')
    expect(note).toHaveClass(block)
    expect(card(container).lastElementChild).toBe(note)
  })

  it('draws no summary and no trailing note for a unit without them', () => {
    const { container } = mount({ unit: bare })
    const h2 = screen.getByRole('heading', { level: 2 })
    expect(h2.textContent).toBe('🍃 Denia')
    expect(h2.querySelectorAll('small')).toHaveLength(0)
    // h2 + the rows, nothing after
    expect(card(container).children).toHaveLength(2)
  })

  it('adds the marked class when marked, and only then', () => {
    const { container, rerender } = mount({ marked: true })
    expect(card(container)).toHaveClass(marked)
    rerender(<UnitCard {...props({ marked: false })} />)
    expect(card(container)).not.toHaveClass(marked)
  })

  // the no-whitespace check catches the unmarked flag leaking in as "card false"; with no
  // element on the unit this is also the guard that an element-less card looks like it always did
  it('has only the card class when neither marked nor given an element', () => {
    expect(unit).not.toHaveProperty('element')
    const { container } = mount()
    expect(card(container)).toHaveClass(cardClass)
    expect(card(container)).not.toHaveClass(marked)
    for (const e of ELEMENTS) expect(card(container), e).not.toHaveClass(edge[e])
    expect(card(container).className).not.toMatch(/\s/)
  })

  it('adds its element class when the unit has an element', () => {
    const { container } = mount({ unit: { ...bare, element: 'cryo' } })
    expect(card(container)).toHaveClass(edge.cryo)
  })

  it('has a class for every element', () => {
    for (const element of ELEMENTS) {
      const { container, unmount } = mount({ unit: { ...bare, element } })
      expect(card(container), element).toHaveClass(edge[element])
      unmount()
    }
  })

  it('keeps marked on a tinted card', () => {
    const { container } = mount({ unit: { ...bare, element: 'hydro' }, marked: true })
    expect(card(container)).toHaveClass(marked)
    expect(card(container)).toHaveClass(edge.hydro)
  })

  it('calls onClick once when the card is clicked, chips included', async () => {
    const onClick = vi.fn()
    mount({ onClick })
    await userEvent.click(screen.getByText('Liberation'))
    expect(onClick).toHaveBeenCalledTimes(1)
    await userEvent.click(screen.getByRole('heading', { level: 2 }))
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('passes showKeys down to the chips', () => {
    const { rerender } = mount({ showKeys: true })
    expect(screen.getByText('E')).toBeInTheDocument()
    rerender(<UnitCard {...props({ showKeys: false })} />)
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })
})
