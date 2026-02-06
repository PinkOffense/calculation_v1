/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/calculation_v1/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'lcov'],
      include: ['src/utils/**', 'src/components/**', 'src/hooks/**'],
      exclude: [
        'src/test/**',
        'src/**/*.test.*',
        'src/**/index.ts',          // barrel re-exports
        'src/utils/taxCalculator.ts', // backward-compat re-export
        'src/utils/types.ts',        // type-only file (no runtime code)
        'src/components/InputForm.tsx',   // re-export shim
        'src/components/ResultsPanel.tsx', // re-export shim
      ],
      thresholds: {
        branches: 75,
        functions: 65,
        lines: 80,
        statements: 80,
      },
    },
  },
})
