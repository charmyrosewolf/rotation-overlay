import { watch, type FSWatcher } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, sep } from 'node:path'
import type { RawFile } from '../preload/api'

export async function listRotations(dir: string): Promise<RawFile[]> {
  let entries: string[]
  try {
    entries = await readdir(dir, { recursive: true })
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw e
  }
  // ids use '/' on every OS so a stored selection means the same thing in browser and Electron
  const ids = entries
    .filter((p) => p.endsWith('.json'))
    .map((p) => p.split(sep).join('/'))
    .sort()
  return Promise.all(
    ids.map(async (file) => ({ file, text: await readFile(join(dir, file), 'utf8') }))
  )
}

export function watchRotations(
  dir: string,
  onChange: (files: RawFile[]) => void,
  debounceMs = 150
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let stopped = false
  let latest = 0 // lists can resolve out of order; only the newest call may push
  let watcher: FSWatcher
  try {
    watcher = watch(dir, { recursive: true }, () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        const mine = ++latest
        // a failed read (file caught mid-rename) is retried by the next event
        listRotations(dir).then(
          (files) => {
            if (!stopped && mine === latest) onChange(files)
          },
          (e) => {
            if (!stopped) console.error(`rotation list failed for ${dir}:`, e)
          }
        )
      }, debounceMs)
    })
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return () => {}
    throw e
  }
  watcher.on('error', (e) => {
    console.error(`rotation watcher failed for ${dir}:`, e)
    clearTimeout(timer) // a dead watcher must not push a list armed before it died
    watcher.close()
  })
  return () => {
    stopped = true
    clearTimeout(timer)
    watcher.close()
  }
}
