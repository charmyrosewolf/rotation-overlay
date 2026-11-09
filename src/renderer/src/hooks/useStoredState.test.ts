import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isBoolean, isString, isStringRecord, useStoredState } from './useStoredState'

type Opacity = { bg: number; on: boolean }
const isOpacity = (v: unknown): v is Opacity =>
  typeof v === 'object' &&
  v !== null &&
  'bg' in v &&
  typeof v.bg === 'number' &&
  'on' in v &&
  typeof v.on === 'boolean'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('useStoredState', () => {
  it('returns the default on first read', () => {
    const { result } = renderHook(() => useStoredState('team', 'a', isString))
    expect(result.current[0]).toBe('a')
  })

  it('set persists, and a re-mount reads it back', () => {
    const first = renderHook(() => useStoredState('team', 'a', isString))
    act(() => first.result.current[1]('b'))
    expect(first.result.current[0]).toBe('b')
    first.unmount()

    const second = renderHook(() => useStoredState('team', 'a', isString))
    expect(second.result.current[0]).toBe('b')
  })

  it('round-trips non-string values as JSON', () => {
    const initial: Opacity = { bg: 0.4, on: false }
    const first = renderHook(() => useStoredState('opacity', initial, isOpacity))
    act(() => first.result.current[1]({ bg: 0.75, on: true }))
    expect(localStorage.getItem('opacity')).toBe('{"bg":0.75,"on":true}')
    first.unmount()

    const second = renderHook(() => useStoredState('opacity', initial, isOpacity))
    expect(second.result.current[0]).toEqual({ bg: 0.75, on: true })
  })

  it('junk JSON in storage gives the default', () => {
    localStorage.setItem('team', '{not json')
    const { result } = renderHook(() => useStoredState('team', 'a', isString))
    expect(result.current[0]).toBe('a')
  })

  // valid JSON of the wrong type: it would otherwise be returned as a T it is not
  describe('a stored value that fails the guard gives the default', () => {
    const readStored = <T>(stored: string, initial: T, isValid: (v: unknown) => v is T) => {
      localStorage.setItem('key', stored)
      return renderHook(() => useStoredState('key', initial, isValid)).result.current[0]
    }

    it('a number where a string is wanted', () => {
      expect(readStored('5', 'a', isString)).toBe('a')
    })

    it('null where a string is wanted', () => {
      expect(readStored('null', 'a', isString)).toBe('a')
    })

    it('a string where a boolean is wanted', () => {
      expect(readStored('"yes"', false, isBoolean)).toBe(false)
    })

    it('an object missing a field', () => {
      const initial: Opacity = { bg: 0.4, on: false }
      expect(readStored('{"bg":0.5}', initial, isOpacity)).toEqual(initial)
    })
  })

  it('a localStorage that throws gives the default, and set still updates state', () => {
    const denied = () => {
      throw new DOMException('storage blocked', 'SecurityError')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(denied)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(denied)

    const { result } = renderHook(() => useStoredState('team', 'a', isString))
    expect(result.current[0]).toBe('a')

    expect(() => act(() => result.current[1]('b'))).not.toThrow()
    expect(result.current[0]).toBe('b')
  })
})

describe('isStringRecord', () => {
  it('accepts an empty object and an object of strings', () => {
    expect(isStringRecord({})).toBe(true)
    expect(isStringRecord({ a: 'b' })).toBe(true)
  })

  it.each([
    ['an array', []],
    ['null', null],
    ['a string', 'x'],
    ['an object with a non-string value', { a: 1 }]
  ])('rejects %s', (_, v) => {
    expect(isStringRecord(v)).toBe(false)
  })
})
