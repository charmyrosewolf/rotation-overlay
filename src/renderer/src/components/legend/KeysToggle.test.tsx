import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { KeysToggle } from './KeysToggle'

describe('KeysToggle', () => {
  it('is a checkbox labelled "keys" that mirrors the showKeys prop', () => {
    const { rerender } = render(<KeysToggle showKeys={false} onChange={() => {}} />)
    expect(screen.getByRole('checkbox', { name: 'keys' })).not.toBeChecked()
    rerender(<KeysToggle showKeys onChange={() => {}} />)
    expect(screen.getByRole('checkbox', { name: 'keys' })).toBeChecked()
  })

  it('reports the new state on click', async () => {
    const onChange = vi.fn()
    const { rerender } = render(<KeysToggle showKeys={false} onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'keys' }))
    expect(onChange).toHaveBeenLastCalledWith(true)
    rerender(<KeysToggle showKeys onChange={onChange} />)
    await userEvent.click(screen.getByRole('checkbox', { name: 'keys' }))
    expect(onChange).toHaveBeenLastCalledWith(false)
  })
})
