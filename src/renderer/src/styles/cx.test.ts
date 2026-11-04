import { describe, expect, it } from 'vitest'
import { cx } from './cx'

describe('cx', () => {
  it('joins class names with a single space, in order', () => {
    expect(cx('a', 'b', 'c')).toBe('a b c')
  })

  it.each([false, null, undefined, ''] as const)('drops %j, with no stray space', (falsy) => {
    expect(cx('a', falsy)).toBe('a')
    expect(cx(falsy, 'a')).toBe('a')
    expect(cx('a', falsy, 'b')).toBe('a b')
  })

  it('is empty when nothing is set', () => {
    expect(cx()).toBe('')
    expect(cx(false, undefined)).toBe('')
  })

  it('takes a condition and a class: the class only when it holds', () => {
    const on = true
    const off = false as boolean
    expect(cx('card', on && 'marked')).toBe('card marked')
    expect(cx('card', off && 'marked')).toBe('card')
  })
})
