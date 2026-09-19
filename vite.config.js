import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served from https://siljekristiane.github.io/Wings-of-Lunaria/ on GitHub
  // Pages, so built asset URLs need this subpath prefix.
  base: '/Wings-of-Lunaria/',
})
