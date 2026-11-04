import { app, BrowserWindow, ipcMain } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { IPC } from '../shared/ipc'
import { WINDOW_SIZE } from '../shared/window'
import { listRotations, watchRotations } from './rotations'
import { nextFullSize, type Size } from './windowSize'

let stopWatching: (() => void) | undefined

function createWindow(): void {
  const win = new BrowserWindow({
    ...WINDOW_SIZE,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    alwaysOnTop: true,
    maximizable: false, // double-clicking the drag bar would otherwise maximise
    webPreferences: {
      preload: join(import.meta.dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  win.setAlwaysOnTop(true, 'screen-saver') // stays over borderless games

  let full: Size = [0, 0]
  ipcMain.on(IPC.collapse, (_e, height: number) => {
    const [w, h] = win.getSize()
    if (w === undefined || h === undefined) return
    full = nextFullSize(full, [w, h])
    win.setSize(full[0], height)
  })
  ipcMain.on(IPC.expand, () => {
    if (full[0]) win.setSize(full[0], full[1])
  })

  const dir = join(app.getAppPath(), 'rotations')
  ipcMain.handle(IPC.rotationsList, () => listRotations(dir))
  // make the dir first: watching a missing one is a silent no-op, so a dir created later would
  // never be watched. A failure here leaves the list static.
  try {
    mkdirSync(dir, { recursive: true })
    stopWatching = watchRotations(dir, (files) => win.webContents.send(IPC.rotationsChanged, files))
  } catch (e) {
    console.error(`rotation watch off for ${dir}:`, e)
  }

  // electron-vite sets this under `dev` only; a build loads its own html
  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) void win.loadURL(devUrl)
  else void win.loadFile(join(import.meta.dirname, '../renderer/index.html'))
}

void app.whenReady().then(createWindow)
app.on('window-all-closed', () => {
  stopWatching?.()
  app.quit()
})
