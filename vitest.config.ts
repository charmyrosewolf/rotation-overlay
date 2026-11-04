import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Node-side tests opt out of jsdom per file: // @vitest-environment node
// css.include: by default vitest swaps every CSS Module for a proxy that answers any key,
// so a renamed or missing class is invisible to the tests. Real modules make styles.x undefined.
export default defineConfig({
  plugins: [react()],
  test: {
    css: { include: /\.module\.css$/ },
    environment: 'jsdom',
    globalSetup: ['./vitest.global-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts']
  }
})
