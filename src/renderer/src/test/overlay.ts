import { act } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import type { OverlayApi, RawFile } from '../../../preload/api'

// spelled out: declaration emit (composite) cannot name vitest's inferred mock type
type Installed = {
  overlay: OverlayApi & { collapse: Mock; expand: Mock }
  off: Mock
  push(files: RawFile[]): void
}

// Puts a stub on window.overlay (the test deletes it afterwards). list() is the one given;
// onChange keeps the latest callback and hands it back as push(), and off is its unsubscribe.
export function installOverlay(list: OverlayApi['rotations']['list'] = async () => []): Installed {
  let pushed: (files: RawFile[]) => void = () => {
    throw new Error('not subscribed')
  }
  const off = vi.fn()
  const overlay = {
    collapse: vi.fn(),
    expand: vi.fn(),
    rotations: {
      list,
      onChange: (cb: (files: RawFile[]) => void) => {
        pushed = cb
        return off
      }
    }
  } satisfies OverlayApi
  window.overlay = overlay
  return { overlay, off, push: (files: RawFile[]) => act(() => pushed(files)) }
}
