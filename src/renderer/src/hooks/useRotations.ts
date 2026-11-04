import { useEffect, useState } from 'react'
import type { RawFile } from '../../../preload/api'
import { loadRotations, type Loaded } from '../data/loadRotations'

const EMPTY: Loaded = { ok: [], errors: [] }

// Browser dev only: the app reads the files from disk, so a build carries no copy of them.
// Relative because '/rotations/**' would resolve under the renderer root.
// Vite re-runs this module when a file changes, which is the browser's hot reload.
const bundled: Record<string, string> = import.meta.env.DEV
  ? import.meta.glob<string>('../../../../rotations/**/*.json', {
      query: '?raw',
      import: 'default',
      eager: true
    })
  : {}
let fromBundle: Loaded | undefined
const loadBundle = (): Loaded =>
  (fromBundle ??= loadRotations(
    Object.entries(bundled).map(([path, text]) => ({
      file: path.replace(/^(\.\.\/)*rotations\//, ''),
      text
    }))
  ))

export function useRotations(): Loaded {
  const [loaded, setLoaded] = useState<Loaded>(EMPTY)

  useEffect(() => {
    const overlay = window.overlay
    if (!overlay) return
    let live = true
    let pushed = false // a push is newer than any list() still in flight
    const show = (files: RawFile[]) => setLoaded(loadRotations(files))
    // subscribed first, so a change made while list() runs is not missed
    const off = overlay.rotations.onChange((files) => {
      pushed = true
      show(files)
    })
    overlay.rotations.list().then(
      (files) => {
        if (live && !pushed) show(files)
      },
      (e: unknown) => {
        const message = e instanceof Error ? e.message : String(e)
        if (live && !pushed) setLoaded({ ok: [], errors: [{ file: 'rotations/', message }] })
      }
    )
    return () => {
      live = false
      off()
    }
  }, [])

  return window.overlay ? loaded : loadBundle()
}
