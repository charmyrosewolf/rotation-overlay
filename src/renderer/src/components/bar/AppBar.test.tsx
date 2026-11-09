import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetRootVars, rootVar } from '../../test/rootVars'
import { AppBar } from './AppBar'
import { CollapsedBar } from './CollapsedBar'

const bgSlider = () => screen.getByTitle('background opacity') as HTMLInputElement
const cardSlider = () => screen.getByTitle('card opacity') as HTMLInputElement

function mount(over: Partial<Parameters<typeof AppBar>[0]> = {}) {
  const onToggle = vi.fn()
  const view = render(<AppBar title="Cartethyia" collapsed={false} onToggle={onToggle} {...over} />)
  return { onToggle, ...view }
}

beforeEach(() => localStorage.clear())
afterEach(() => {
  resetRootVars()
  vi.restoreAllMocks()
})

describe('AppBar expanded', () => {
  it('shows the drag handle and both sliders, and no title', () => {
    mount()
    expect(screen.getByText('⠿ drag')).toBeVisible()
    expect(bgSlider()).toBeVisible()
    expect(cardSlider()).toBeVisible()
    expect(screen.queryByText('Cartethyia')).not.toBeInTheDocument()
  })

  it('offers – titled "collapse to a bar"', () => {
    mount()
    const button = screen.getByTitle('collapse to a bar')
    expect(button).toHaveTextContent(/^–$/)
    expect(screen.queryByTitle('expand')).not.toBeInTheDocument()
  })
})

describe('AppBar collapsed', () => {
  it('hides the sliders and shows the title', () => {
    mount({ collapsed: true })
    expect(bgSlider()).not.toBeVisible()
    expect(cardSlider()).not.toBeVisible()
    expect(screen.getByText('Cartethyia')).toBeVisible()
  })

  it('flips the button to ▢ titled "expand"', () => {
    mount({ collapsed: true })
    expect(screen.getByTitle('expand')).toHaveTextContent(/^▢$/)
    expect(screen.queryByTitle('collapse to a bar')).not.toBeInTheDocument()
  })

  it('takes the collapsed bar as its title', () => {
    mount({
      collapsed: true,
      title: <CollapsedBar teamLabel="Cartethyia" variantLabel="Quick swap" />
    })
    expect(screen.getByText('Cartethyia · Quick swap')).toBeVisible()
  })

  it('keeps the sliders mounted, so their value survives a collapse and expand', () => {
    // storage blocked: only live state can carry the value across
    const denied = () => {
      throw new DOMException('storage blocked', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied)

    const { rerender, onToggle } = mount()
    fireEvent.change(bgSlider(), { target: { value: '0.8' } })
    rerender(<AppBar title="Cartethyia" collapsed onToggle={onToggle} />)
    rerender(<AppBar title="Cartethyia" collapsed={false} onToggle={onToggle} />)

    expect(bgSlider().value).toBe('0.8')
    expect(rootVar('--a')).toBe('0.8')
  })
})

describe('AppBar leading slot', () => {
  const back = <button type="button">Back</button>

  it('renders before the drag handle when expanded', () => {
    mount({ leading: back })
    const lead = screen.getByRole('button', { name: 'Back' })
    expect(lead.compareDocumentPosition(screen.getByText('⠿ drag'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('is not in the document while collapsed', () => {
    mount({ collapsed: true, leading: back })
    // hidden: true, or a still-mounted hidden span would pass as absent
    expect(screen.queryByRole('button', { name: 'Back', hidden: true })).not.toBeInTheDocument()
  })
})

describe('AppBar controls', () => {
  it('the toggle button calls onToggle once per click', async () => {
    const { onToggle } = mount()
    await userEvent.click(screen.getByTitle('collapse to a bar'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('✕ titled "close" closes the window', async () => {
    const close = vi.spyOn(window, 'close').mockImplementation(() => {})
    mount()
    expect(screen.getByTitle('close')).toHaveTextContent(/^✕$/)
    await userEvent.click(screen.getByTitle('close'))
    expect(close).toHaveBeenCalledTimes(1)
  })

  it('the sliders start at 0.4 and 0.6 on --a and --c', () => {
    mount()
    expect(bgSlider().value).toBe('0.4')
    expect(cardSlider().value).toBe('0.6')
    expect(rootVar('--a')).toBe('0.4')
    expect(rootVar('--c')).toBe('0.6')
  })

  it('each slider moves its own var and storage key', () => {
    mount()
    fireEvent.change(cardSlider(), { target: { value: '0.9' } })
    expect(rootVar('--c')).toBe('0.9')
    expect(localStorage.getItem('cardAlpha')).toBe('0.9')
    expect(rootVar('--a')).toBe('0.4')
    expect(localStorage.getItem('bgAlpha')).toBeNull()

    fireEvent.change(bgSlider(), { target: { value: '0.15' } })
    expect(rootVar('--a')).toBe('0.15')
    expect(localStorage.getItem('bgAlpha')).toBe('0.15')
    expect(rootVar('--c')).toBe('0.9')
  })
})
