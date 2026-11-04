// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { nextFullSize } from './windowSize'

describe('nextFullSize', () => {
  it('takes the live size the first time', () => {
    expect(nextFullSize([0, 0], [300, 760])).toEqual([300, 760])
  })

  // 150 % scaling: getSize() reads 1 px over what was set
  it('keeps the stored size when the live one is only 1 px off', () => {
    expect(nextFullSize([300, 760], [301, 761])).toEqual([300, 760])
  })

  it('takes the live size after a real resize', () => {
    expect(nextFullSize([300, 760], [340, 760])).toEqual([340, 760])
  })

  it('takes the live size after the user shrinks the window', () => {
    expect(nextFullSize([300, 760], [260, 760])).toEqual([260, 760])
  })

  it('treats 2 px as a resize', () => {
    expect(nextFullSize([300, 760], [300, 762])).toEqual([300, 762])
  })
})
