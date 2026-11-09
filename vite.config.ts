import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    // Only these public build settings are exposed. Keep existing hosting
    // settings working while allowing Vite's naming convention.
    define: {
      'import.meta.env.VITE_GAME_NAME': JSON.stringify(
        env.VITE_GAME_NAME || env.REACT_APP_GAME_NAME || 'Qwordle',
      ),
      'import.meta.env.VITE_GOOGLE_MEASUREMENT_ID': JSON.stringify(
        env.VITE_GOOGLE_MEASUREMENT_ID ||
          env.REACT_APP_GOOGLE_MEASUREMENT_ID ||
          '',
      ),
      'import.meta.env.VITE_MICROSOFT_CLARITY_TAG_ID': JSON.stringify(
        env.VITE_MICROSOFT_CLARITY_TAG_ID ||
          env.REACT_APP_MICROSOFT_CLARITY_TAG_ID ||
          '',
      ),
      'import.meta.env.VITE_PLAUSIBLE_DOMAIN': JSON.stringify(
        env.VITE_PLAUSIBLE_DOMAIN || env.REACT_APP_PLAUSIBLE_DOMAIN || '',
      ),
    },
    build: { outDir: 'build', sourcemap: false },
    test: {
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    },
  }
})
