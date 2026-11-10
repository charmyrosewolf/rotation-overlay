import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Note } from './Note'
import { block } from './Note.css'

describe('Note', () => {
  it('shows the text as an inline note by default', () => {
    render(<Note text="then wait" />)
    expect(screen.getByText('then wait')).toBeInTheDocument()
    expect(screen.getByText('then wait')).not.toHaveClass(block)
  })

  it('carries the block class when block is set', () => {
    render(<Note text="repeat from Mornye" block />)
    expect(screen.getByText('repeat from Mornye')).toHaveClass(block)
  })

  it('keeps markup in the text literal, no HTML injection', () => {
    const { container } = render(<Note text="x <i>y</i>" />)
    expect(container.querySelector('i')).toBeNull()
    expect(container.textContent).toBe('x <i>y</i>')
  })

  it('keeps markup literal in a block note too', () => {
    const { container } = render(<Note text="x <i>y</i>" block />)
    expect(container.querySelector('i')).toBeNull()
    expect(container.textContent).toBe('x <i>y</i>')
  })
})
