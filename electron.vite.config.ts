import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {},
  // A sandboxed preload can't be ESM, so this one stays CJS (out/preload/index.cjs)
  preload: { build: { rolldownOptions: { output: { format: 'cjs' } } } },
  renderer: {
    root: 'src/renderer',
    plugins: [vanillaExtractPlugin(), react()],
    server: { port: 5175, strictPort: true }
  }
})
