// @vitest-environment node
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import type { FSWatcher } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { RawFile } from '../preload/api'
import { listRotations, watchRotations } from './rotations'

// passthrough wrappers: a test can fail watch() outright, reach the watcher it made,
// or stall a list after its read (to resolve it out of order)
const hooks = vi.hoisted(() => ({
  watchError: undefined as Error | undefined,
  watchers: [] as FSWatcher[],
  afterRead: undefined as (() => Promise<void>) | undefined
}))
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>()
  const watch = ((...args: Parameters<typeof actual.watch>) => {
    if (hooks.watchError) throw hooks.watchError
    const watcher = actual.watch(...args)
    hooks.watchers.push(watcher)
    return watcher
  }) as typeof actual.watch
  return { ...actual, watch }
})
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  const readFile = (async (...args: Parameters<typeof actual.readFile>) => {
    const text = await actual.readFile(...args)
    await hooks.afterRead?.()
    return text
  }) as typeof actual.readFile
  return { ...actual, readFile }
})

let dir: string
const stops: Array<() => void> = []
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

async function put(rel: string, text: string): Promise<void> {
  const full = join(dir, rel)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, text)
}

// real fs.watch + real timers; every watcher is closed in afterEach so rm can't hit EBUSY
function watch(debounceMs: number) {
  const calls: RawFile[][] = []
  const waiting: Array<{ n: number; resolve: () => void }> = []
  const stop = watchRotations(
    dir,
    (files) => {
      calls.push(files)
      for (const w of waiting) if (calls.length >= w.n) w.resolve()
    },
    debounceMs
  )
  stops.push(stop)
  // resolves once the nth call has landed
  const nth = (n: number) =>
    new Promise<void>((resolve) => (calls.length >= n ? resolve() : waiting.push({ n, resolve })))
  return { calls, nth, stop }
}

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'rotations-'))
})

afterEach(async () => {
  vi.restoreAllMocks()
  hooks.watchError = undefined
  hooks.afterRead = undefined
  hooks.watchers.length = 0
  for (const stop of stops.splice(0)) stop()
  await rm(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 })
})

describe('listRotations', () => {
  it('lists nested *.json with forward-slash ids, sorted, text verbatim', async () => {
    const wuwa = '{"a":1}\r\n  é — ✓\n'
    await put('wuwa/a.json', wuwa)
    await put('hsr/b.json', '{"b":2}')
    await put('notes.txt', 'not a rotation')
    expect(await listRotations(dir)).toEqual([
      { file: 'hsr/b.json', text: '{"b":2}' },
      { file: 'wuwa/a.json', text: wuwa }
    ])
  })

  it('sorts by file id, not by the order the directory walk returns', async () => {
    // a recursive readdir lists top-level entries before nested ones
    await put('z.json', 'z')
    await put('a/x.json', 'x')
    const files = (await listRotations(dir)).map((f) => f.file)
    expect(files).toEqual(['a/x.json', 'z.json'])
  })

  it('returns [] for a missing dir', async () => {
    await expect(listRotations(join(dir, 'nope'))).resolves.toEqual([])
  })
})

describe('watchRotations', () => {
  it('collapses a burst of writes into one call with the final text', async () => {
    await put('wuwa/a.json', 'seed')
    const w = watch(120)
    for (let i = 1; i <= 5; i++) await put('wuwa/a.json', `v${i}`)
    await w.nth(1)
    await sleep(350) // a second call, if any, lands in here
    expect(w.calls).toHaveLength(1)
    expect(w.calls[0]).toEqual([{ file: 'wuwa/a.json', text: 'v5' }])
  }, 10_000)

  it('fires again for a later burst, carrying the newer text', async () => {
    await put('wuwa/a.json', 'seed')
    const w = watch(80)
    await put('wuwa/a.json', 'first')
    await w.nth(1)
    await put('wuwa/a.json', 'second')
    await Promise.race([w.nth(2), sleep(2000)]) // bounded, so a dead watcher fails the assert
    expect(w.calls.map((files) => files[0]?.text)).toEqual(['first', 'second'])
  }, 10_000)

  it('returns a no-op stop for a missing dir', () => {
    let stop: (() => void) | undefined
    expect(() => {
      stop = watchRotations(join(dir, 'nope'), () => {})
    }).not.toThrow()
    expect(typeof stop).toBe('function')
    expect(() => stop?.()).not.toThrow()
  })

  it('rethrows a watch failure that is not a missing dir', () => {
    hooks.watchError = Object.assign(new Error('denied'), { code: 'EACCES' })
    expect(() => watchRotations(dir, () => {})).toThrow('denied')
  })

  it('closes the watcher and logs when it reports an error', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    watch(40)
    expect(hooks.watchers).toHaveLength(1)
    const watcher = hooks.watchers[0]!
    const close = vi.spyOn(watcher, 'close')
    // an EventEmitter with no 'error' listener throws on emit
    expect(() => watcher.emit('error', new Error('boom'))).not.toThrow()
    expect(log).toHaveBeenCalledTimes(1)
    expect(close).toHaveBeenCalled()
  })

  it('a watcher error drops a call that is already waiting on the debounce', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    await put('wuwa/a.json', 'seed')
    const w = watch(250)
    await put('wuwa/a.json', 'pending')
    await sleep(60) // the event has armed the timer, which is far from due
    expect(hooks.watchers).toHaveLength(1)
    hooks.watchers[0]!.emit('error', new Error('boom'))
    await sleep(450)
    expect(w.calls).toEqual([])
  }, 10_000)

  it('logs a failed list and pushes nothing', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await mkdir(join(dir, 'bad.json')) // listed as a file, but readFile on a dir rejects
    const w = watch(40)
    await put('wuwa/a.json', 'x')
    await vi.waitFor(() => expect(log).toHaveBeenCalled(), 2000)
    await sleep(100)
    expect(w.calls).toEqual([])
  }, 10_000)

  it('pushes only the latest list when an earlier one resolves late', async () => {
    await put('wuwa/a.json', 'seed')
    const w = watch(40)
    let release!: () => void
    const held = new Promise<void>((resolve) => (release = resolve))
    let stalled!: () => void
    const firstStalled = new Promise<void>((resolve) => (stalled = resolve))
    // the first list reads 'old', then stalls before it returns
    hooks.afterRead = async () => {
      hooks.afterRead = undefined
      stalled()
      await held
    }
    await put('wuwa/a.json', 'old')
    await firstStalled
    await put('wuwa/a.json', 'new')
    await w.nth(1)
    release() // the stale list resolves now, after the newer one pushed
    await sleep(100)
    expect(w.calls).toEqual([[{ file: 'wuwa/a.json', text: 'new' }]])
  }, 10_000)

  it('fires nothing for a write after stop()', async () => {
    await put('wuwa/a.json', 'seed')
    const w = watch(40)
    w.stop()
    await put('wuwa/a.json', 'after')
    await sleep(300)
    expect(w.calls).toEqual([])
  }, 10_000)

  it('stop() drops a call that is already waiting on the debounce', async () => {
    await put('wuwa/a.json', 'seed')
    const w = watch(250)
    await put('wuwa/a.json', 'pending')
    await sleep(60) // the event has armed the timer, which is far from due
    w.stop()
    await sleep(450)
    expect(w.calls).toEqual([])
  }, 10_000)
})
