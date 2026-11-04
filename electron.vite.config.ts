import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {},
  // A sandboxed preload can't be ESM, so this one stays CJS (out/preload/index.cjs)
  preload: { build: { rolldownOptions: { output: { format: 'cjs' } } } },
  renderer: {
    root: 'src/renderer',
    plugins: [react()],
    server: { port: 5175, strictPort: true }
  }
})
