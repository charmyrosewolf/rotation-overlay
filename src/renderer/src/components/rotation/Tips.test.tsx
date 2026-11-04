import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Tips } from './Tips'

describe('Tips', () => {
  it('joins the tips into one line with " · " and bolds **x**', () => {
    const { container } = render(<Tips tips={['**a** b', 'c']} />)
    expect(container.children).toHaveLength(1)
    expect(container.firstElementChild?.textContent).toBe('a b · c')
    // one line: the only element children are the <b>s, no per-tip wrapper
    const tags = Array.from(container.firstElementChild?.children ?? []).map((el) => el.tagName)
    expect(tags).toEqual(['B'])
    const bolds = container.querySelectorAll('b')
    expect(bolds).toHaveLength(1)
    expect(bolds[0]?.textContent).toBe('a')
  })

  it('bolds each **x** pair on its own, not everything between the outer markers', () => {
    const { container } = render(<Tips tips={['**a** and **b**']} />)
    const bolds = Array.from(container.querySelectorAll('b')).map((b) => b.textContent)
    expect(bolds).toEqual(['a', 'b'])
    expect(container.firstElementChild?.textContent).toBe('a and b')
  })

  it('leaves an unclosed ** as plain text', () => {
    const { container } = render(<Tips tips={['2 ** 3']} />)
    expect(container.querySelector('b')).toBeNull()
    expect(container.firstElementChild?.textContent).toBe('2 ** 3')
  })

  it('keeps markup in the text literal, no HTML injection', () => {
    const { container } = render(<Tips tips={['x <i>y</i> **z**']} />)
    expect(container.querySelector('i')).toBeNull()
    expect(container.firstElementChild?.textContent).toBe('x <i>y</i> z')
  })
})
