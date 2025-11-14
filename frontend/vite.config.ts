/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import { visualizer } from 'rollup-plugin-visualizer'
import type { PluginOption } from 'vite'

const analyzeBundle = process.env.ANALYZE === 'true'

const plugins: PluginOption[] = [react()]

if (analyzeBundle) {
  plugins.push(
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      gzipSize: true,
      brotliSize: true,
    }),
  )
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  server: {
    port: 5173,
    host: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
})
