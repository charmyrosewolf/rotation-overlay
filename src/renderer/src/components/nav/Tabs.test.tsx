import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Tabs } from './Tabs'

const standard = { id: 'standard', label: 'Standard' }
const practice = { id: 'qingxiao-practice', label: 'Qingxiao practice' }
const items = [standard, practice]

describe('Tabs', () => {
  it('renders one labelled button per item, in order', () => {
    render(<Tabs items={items} activeId="standard" onSelect={() => {}} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Standard',
      'Qingxiao practice'
    ])
  })

  it('calls onSelect with the id of the clicked tab', async () => {
    const onSelect = vi.fn()
    render(<Tabs items={items} activeId="standard" onSelect={onSelect} />)
    await userEvent.click(screen.getByRole('button', { name: 'Qingxiao practice' }))
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('qingxiao-practice')
  })

  it('presses the active tab and only that one', () => {
    const { rerender } = render(<Tabs items={items} activeId="standard" onSelect={() => {}} />)
    const pressed = () => screen.getAllByRole('button').map((b) => b.getAttribute('aria-pressed'))
    expect(pressed()).toEqual(['true', 'false'])
    rerender(<Tabs items={items} activeId="qingxiao-practice" onSelect={() => {}} />)
    expect(pressed()).toEqual(['false', 'true'])
  })

  it('styles the active tab as active and only that one', () => {
    render(<Tabs items={items} activeId="qingxiao-practice" onSelect={() => {}} />)
    const [first, second] = screen.getAllByRole('button')
    expect(first?.className).not.toContain('active')
    expect(second?.className).toContain('active')
  })

  it('is a plain row of buttons by default, not a navigation landmark', () => {
    const { container } = render(<Tabs items={items} activeId="standard" onSelect={() => {}} />)
    expect(container.firstElementChild?.tagName).toBe('DIV')
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('is a navigation landmark when asked to be a nav', () => {
    render(<Tabs items={items} activeId="standard" onSelect={() => {}} as="nav" />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})
