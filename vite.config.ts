import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Hosted at https://wednesdaywoe.github.io/SFX-Tool/ — base prefix lets
// Vite generate asset URLs under that subpath. Local dev (`vite`) ignores
// `base` and serves from `/`.
export default defineConfig({
  base: '/SFX-Tool/',
  plugins: [react(), tailwindcss()],
})
