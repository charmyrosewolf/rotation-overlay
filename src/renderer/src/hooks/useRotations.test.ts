import { act, renderHook } from '@testing-library/react'
import { StrictMode } from 'react'
import { afterEach, describe, expect, inject, it } from 'vitest'
import type { RawFile } from '../../../preload/api'
import { installOverlay } from '../test/overlay'
import { useRotations } from './useRotations'

const team = (name: string): RawFile => ({
  file: `wuwa/${name}.json`,
  text: JSON.stringify({ label: name, variants: [{ id: 'standard', label: 'Standard', units: [] }] })
})

// list() settles when the test says so, and every call is kept (StrictMode makes two, the
// default is the latest)
function stubOverlay() {
  const calls: { resolve(f: RawFile[]): void; reject(e: unknown): void }[] = []
  const settle = (call: number) => {
    const settled = calls[call]
    if (!settled) throw new Error(`no list() call at index ${call}`)
    return settled
  }
  const { off, push } = installOverlay(
    () => new Promise((resolve, reject) => calls.push({ resolve, reject }))
  )
  return {
    off,
    push,
    listCalls: () => calls.length,
    resolve: (f: RawFile[], call = calls.length - 1) => act(async () => settle(call).resolve(f)),
    reject: (e: unknown, call = calls.length - 1) => act(async () => settle(call).reject(e))
  }
}

const ids = (r: { current: ReturnType<typeof useRotations> }) => r.current.ok.map((t) => t.id)

afterEach(() => {
  delete window.overlay
})

describe('useRotations in a browser', () => {
  // the real rotations/ folder through the glob; ids only, the content is edited live.
  // The disk listing comes from vitest.global-setup.ts: the web program has no node types.
  it('reads every shipped file, keyed under rotations/', () => {
    const onDisk = inject('shippedRotationIds')
    expect(onDisk.length).toBeGreaterThan(0) // else the comparison below is vacuous

    const { result } = renderHook(() => useRotations())
    expect(result.current.errors).toEqual([])
    expect(ids(result).toSorted()).toEqual(onDisk)
  })
})

describe('useRotations in the app', () => {
  it('shows nothing until list() resolves, never the bundled copy', () => {
    stubOverlay()
    const { result } = renderHook(() => useRotations())
    expect(result.current).toEqual({ ok: [], errors: [] })
  })

  it('loads what list() resolves', async () => {
    const overlay = stubOverlay()
    const { result } = renderHook(() => useRotations())
    await overlay.resolve([team('a')])
    expect(ids(result)).toEqual(['wuwa/a'])
  })

  it('replaces the list with each pushed change', async () => {
    const overlay = stubOverlay()
    const { result } = renderHook(() => useRotations())
    await overlay.resolve([team('a')])
    overlay.push([team('b'), team('c')])
    expect(ids(result)).toEqual(['wuwa/b', 'wuwa/c'])
  })

  it('drops a list() that resolves after a push, since the push is newer', async () => {
    const overlay = stubOverlay()
    const { result } = renderHook(() => useRotations())
    overlay.push([team('b')])
    await overlay.resolve([team('a')])
    expect(ids(result)).toEqual(['wuwa/b'])
  })

  it('shows a failed list() as a problem instead of a blank page', async () => {
    const overlay = stubOverlay()
    const { result } = renderHook(() => useRotations())
    await overlay.reject(new Error('EBUSY: resource busy'))
    expect(result.current).toEqual({
      ok: [],
      errors: [{ file: 'rotations/', message: 'EBUSY: resource busy' }]
    })
  })

  it('shows a rejection that is not an Error, by its text', async () => {
    const overlay = stubOverlay()
    const { result } = renderHook(() => useRotations())
    await overlay.reject('EBUSY')
    expect(result.current.ok).toEqual([])
    expect(result.current.errors).toEqual([
      { file: 'rotations/', message: expect.stringContaining('EBUSY') }
    ])
  })

  it('unsubscribes on unmount', () => {
    const overlay = stubOverlay()
    const { unmount } = renderHook(() => useRotations())
    expect(overlay.off).not.toHaveBeenCalled()
    unmount()
    expect(overlay.off).toHaveBeenCalledOnce()
  })
})

// StrictMode runs the effect, cleans it up and runs it again. The first run's list() is
// still in flight and its own `pushed` never flips, so only `live` keeps it from winning.
describe('useRotations under StrictMode', () => {
  function mount() {
    const overlay = stubOverlay()
    const hook = renderHook(useRotations, { wrapper: StrictMode })
    expect(overlay.listCalls()).toBe(2) // else there is no stale list() to test
    return { overlay, ...hook }
  }

  it("drops the cleaned-up effect's late list(), so it cannot overwrite a push", async () => {
    const { overlay, result } = mount()
    overlay.push([team('b')])
    await overlay.resolve([team('a')], 0)
    expect(ids(result)).toEqual(['wuwa/b'])
  })

  it("drops the cleaned-up effect's late rejection, so it cannot cover a push", async () => {
    const { overlay, result } = mount()
    overlay.push([team('b')])
    await overlay.reject(new Error('EBUSY: resource busy'), 0)
    expect(ids(result)).toEqual(['wuwa/b'])
    expect(result.current.errors).toEqual([])
  })
})
