import type { OverlayApi } from '../../preload/api'

// Absent in a plain browser; the app keys its Electron-only UI off that.
declare global {
  interface Window {
    overlay?: OverlayApi
  }
}
