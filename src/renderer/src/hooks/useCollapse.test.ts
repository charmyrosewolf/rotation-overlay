import { act, renderHook } from '@testing-library/react'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installOverlay } from '../test/overlay'
import { useCollapse } from './useCollapse'

// main.tsx mounts in StrictMode, so mount effects run twice. reactStrictMode does that here; a
// wrapper component rendering <StrictMode> does not, which 'test harness' pins.
const strict = { reactStrictMode: true }

let overlay: ReturnType<typeof installOverlay>['overlay']

beforeEach(() => {
  localStorage.clear()
  overlay = installOverlay().overlay
})
afterEach(() => {
  delete window.overlay
})

describe('test harness', () => {
  it('StrictMode runs a mount effect twice', () => {
    let runs = 0
    renderHook(() => {
      useEffect(() => {
        runs++
      }, [])
    }, strict)
    expect(runs).toBe(2)
  })
})

describe('useCollapse', () => {
  it('starts expanded and tells the window nothing on mount', () => {
    const { result } = renderHook(() => useCollapse(() => 37.2), strict)
    expect(result.current.collapsed).toBe(false)
    expect(overlay.collapse).not.toHaveBeenCalled()
    expect(overlay.expand).not.toHaveBeenCalled()
  })

  it('toggle collapses once, with the measured height rounded up', () => {
    const measure = vi.fn(() => 37.2)
    const { result } = renderHook(() => useCollapse(measure), strict)

    act(() => result.current.toggle())

    expect(result.current.collapsed).toBe(true)
    expect(overlay.collapse).toHaveBeenCalledTimes(1)
    expect(overlay.collapse).toHaveBeenCalledWith(38)
    expect(overlay.expand).not.toHaveBeenCalled()
  })

  it('toggling again expands once and does not collapse again', () => {
    const { result } = renderHook(() => useCollapse(() => 37.2), strict)

    act(() => result.current.toggle())
    act(() => result.current.toggle())

    expect(result.current.collapsed).toBe(false)
    expect(overlay.expand).toHaveBeenCalledTimes(1)
    expect(overlay.collapse).toHaveBeenCalledTimes(1)
  })

  it('a re-render with a new measure function tells the window nothing more', () => {
    // a fresh arrow per render, so the effect's deps change on every rerender
    const { result, rerender } = renderHook(() => useCollapse(() => 37.2), strict)

    rerender()
    expect(overlay.expand).not.toHaveBeenCalled()

    act(() => result.current.toggle())
    rerender()
    rerender()
    expect(overlay.collapse).toHaveBeenCalledTimes(1)

    act(() => result.current.toggle())
    rerender()
    expect(overlay.expand).toHaveBeenCalledTimes(1)
    expect(overlay.collapse).toHaveBeenCalledTimes(1)
  })

  it('measures after the collapsed render, not at the click', () => {
    const now = { collapsed: false }
    const seen: boolean[] = []
    const { result } = renderHook(() => {
      const c = useCollapse(() => {
        seen.push(now.collapsed)
        return 37.2
      })
      now.collapsed = c.collapsed
      return c
    }, strict)

    act(() => result.current.toggle())

    expect(seen).toEqual([true])
  })

  it('does not store the state: nothing is written and a re-mount starts expanded', () => {
    const first = renderHook(() => useCollapse(() => 37.2), strict)
    act(() => first.result.current.toggle())
    first.unmount()

    expect(localStorage.length).toBe(0)
    const second = renderHook(() => useCollapse(() => 37.2), strict)
    expect(second.result.current.collapsed).toBe(false)
  })

  it('without window.overlay, toggling only flips state', () => {
    delete window.overlay
    const measure = vi.fn(() => 37.2)
    const { result } = renderHook(() => useCollapse(measure), strict)

    expect(() => act(() => result.current.toggle())).not.toThrow()
    expect(result.current.collapsed).toBe(true)
    expect(() => act(() => result.current.toggle())).not.toThrow()
    expect(result.current.collapsed).toBe(false)
  })

  it('expanding without window.overlay only flips state, whatever collapse did', () => {
    const { result } = renderHook(() => useCollapse(() => 37.2), strict)
    act(() => result.current.toggle())
    expect(overlay.collapse).toHaveBeenCalledTimes(1)

    delete window.overlay
    expect(() => act(() => result.current.toggle())).not.toThrow()
    expect(result.current.collapsed).toBe(false)
  })
})
