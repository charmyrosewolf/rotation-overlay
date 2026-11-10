import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Team } from '../../data/loadRotations'
import type { Unit, Variant } from '../../data/schema'
import { TeamView } from './TeamView'
import { marked } from './UnitCard.css'

const unit = (name: string): Unit => ({
  icon: '🌀',
  name,
  steps: [[{ type: 'skill', label: `${name} skill`, key: 'E' }]]
})

const standard: Variant = {
  id: 'standard',
  label: 'Standard',
  units: [unit('One'), unit('Two'), unit('Three')],
  tips: ['**a** b', 'c']
}
const practice: Variant = {
  id: 'qingxiao-practice',
  label: 'Qingxiao practice',
  units: [unit('Four'), unit('Five')],
  tips: []
}
const soloStandard: Variant = { id: 'standard', label: 'Standard', units: [unit('One')] }

const team: Team = {
  id: 'wuwa/mornye',
  game: 'wuwa',
  label: 'Mornye',
  variants: [standard, practice]
}

const solo: Team = { id: 'wuwa/solo', game: 'wuwa', label: 'Solo', variants: [soloStandard] }
const onSolo = { team: solo, variant: soloStandard }

type Props = Parameters<typeof TeamView>[0]
const props = (over: Partial<Props> = {}): Props => ({
  team,
  variant: standard,
  onSelectVariant: () => {},
  showKeys: false,
  ...over
})

const cards = (c: HTMLElement) => Array.from(c.querySelectorAll('section'))
const markedFlags = (c: HTMLElement) => cards(c).map((s) => s.classList.contains(marked))
const clickUnit = (name: string) =>
  userEvent.click(screen.getByRole('heading', { name: `🌀 ${name}` }))
const tipsEl = (c: HTMLElement) => c.querySelector('[class*="tips"]')

describe('TeamView variants', () => {
  // one variant leaves nothing to switch between
  it('draws no variant tab for a single-variant team', () => {
    const { container } = render(<TeamView {...props(onSolo)} />)
    expect(screen.queryByRole('button', { name: 'Standard' })).not.toBeInTheDocument()
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    // the unit cards are all there is: no tab row in front of them
    expect(container.firstElementChild?.firstElementChild?.tagName).toBe('SECTION')
  })

  it('draws a tab per variant and reports the clicked variant id', async () => {
    const onSelectVariant = vi.fn()
    render(<TeamView {...props({ onSelectVariant })} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Standard',
      'Qingxiao practice'
    ])
    await userEvent.click(screen.getByRole('button', { name: 'Qingxiao practice' }))
    expect(onSelectVariant).toHaveBeenCalledExactlyOnceWith('qingxiao-practice')
  })

  it("shows the active variant's units, in order", () => {
    const { container, rerender } = render(<TeamView {...props()} />)
    const names = () => screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(names()).toEqual(['🌀 One', '🌀 Two', '🌀 Three'])
    expect(cards(container)).toHaveLength(3)
    rerender(<TeamView {...props({ variant: practice })} />)
    expect(names()).toEqual(['🌀 Four', '🌀 Five'])
  })

  it('presses the tab of the variant it is given', () => {
    render(<TeamView {...props({ variant: practice })} />)
    expect(screen.getByRole('button', { name: 'Qingxiao practice' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    expect(screen.getByRole('button', { name: 'Standard' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })
})

describe('TeamView tips', () => {
  it('renders the active variant tips as one line', () => {
    const { container } = render(<TeamView {...props()} />)
    expect(tipsEl(container)?.textContent).toBe('a b · c')
  })

  it('draws the tips after the last unit', () => {
    const { container } = render(<TeamView {...props()} />)
    const last = cards(container).at(-1)!
    expect(last.compareDocumentPosition(tipsEl(container)!)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
  })

  it('renders no tips element for an empty tips array', () => {
    const { container } = render(<TeamView {...props({ variant: practice })} />)
    expect(tipsEl(container)).toBeNull()
  })

  it('renders no tips element when the variant has no tips', () => {
    const { container } = render(<TeamView {...props(onSolo)} />)
    expect(tipsEl(container)).toBeNull()
  })
})

describe('TeamView showKeys', () => {
  it('passes showKeys down to the chips', () => {
    const { rerender } = render(<TeamView {...props({ showKeys: true })} />)
    expect(screen.getAllByText('E')).toHaveLength(3)
    rerender(<TeamView {...props({ showKeys: false })} />)
    expect(screen.queryByText('E')).not.toBeInTheDocument()
  })
})

describe('TeamView marking', () => {
  it('marks nothing at first', () => {
    const { container } = render(<TeamView {...props()} />)
    expect(markedFlags(container)).toEqual([false, false, false])
  })

  it('marks the clicked unit and moves the mark when another is clicked', async () => {
    const { container } = render(<TeamView {...props()} />)
    await clickUnit('Two')
    expect(markedFlags(container)).toEqual([false, true, false])
    await clickUnit('Three')
    expect(markedFlags(container)).toEqual([false, false, true])
  })

  it('keeps the mark when the marked unit is clicked again', async () => {
    const { container } = render(<TeamView {...props()} />)
    await clickUnit('Two')
    await clickUnit('Two')
    expect(markedFlags(container)).toEqual([false, true, false])
  })

  it('clears the mark when the variant changes, and it stays gone on return', async () => {
    const { container, rerender } = render(<TeamView {...props()} />)
    await clickUnit('Two')
    expect(markedFlags(container)).toEqual([false, true, false])
    rerender(<TeamView {...props({ variant: practice })} />)
    expect(markedFlags(container)).toEqual([false, false])
    rerender(<TeamView {...props()} />)
    expect(markedFlags(container)).toEqual([false, false, false])
  })

  it('clears the mark when the team changes', async () => {
    const { container, rerender } = render(<TeamView {...props()} />)
    await clickUnit('Two')
    expect(markedFlags(container)).toEqual([false, true, false])
    rerender(<TeamView {...props({ team: { ...team, id: 'wuwa/other' } })} />)
    expect(markedFlags(container)).toEqual([false, false, false])
  })
})
