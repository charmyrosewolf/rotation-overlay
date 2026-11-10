import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Node-side tests opt out of jsdom per file: // @vitest-environment node
export default defineConfig({
  plugins: [vanillaExtractPlugin(), react()],
  test: {
    environment: 'jsdom',
    globalSetup: ['./vitest.global-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts']
  }
})
