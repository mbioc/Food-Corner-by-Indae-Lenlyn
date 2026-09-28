import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; Netlify and local dev serve from /.
  base: process.env.GITHUB_PAGES ? '/Food-Corner-by-Indae-Lenlyn/' : '/',
  plugins: [react(), tailwindcss()],
})
