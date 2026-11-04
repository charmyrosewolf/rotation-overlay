import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { IPC } from '../shared/ipc'
import type { OverlayApi, RawFile } from './api'

const api: OverlayApi = {
  collapse: (height) => ipcRenderer.send(IPC.collapse, height),
  expand: () => ipcRenderer.send(IPC.expand),
  rotations: {
    list: () => ipcRenderer.invoke(IPC.rotationsList),
    onChange(cb) {
      // wrapped so the event object never crosses the bridge, and so off() has a handle
      const listener = (_e: IpcRendererEvent, files: RawFile[]) => cb(files)
      ipcRenderer.on(IPC.rotationsChanged, listener)
      return () => {
        ipcRenderer.removeListener(IPC.rotationsChanged, listener)
      }
    }
  }
}

contextBridge.exposeInMainWorld('overlay', api)
