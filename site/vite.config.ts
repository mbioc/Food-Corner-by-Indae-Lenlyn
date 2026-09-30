import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { Readable } from 'node:stream'
import { defineConfig, loadEnv, type Plugin } from 'vite'

/** Dev only: serve the Vercel functions in ../api so `npm run dev` runs the full stack. */
function localApi(): Plugin {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()
        const file = resolve(process.cwd(), '..', `${url.pathname.slice(1)}.mjs`)
        if (!existsSync(file)) return next()
        const mod = await server.ssrLoadModule(file)
        const handler = mod[req.method ?? 'GET']
        if (!handler) {
          res.statusCode = 405
          return res.end('Method not allowed')
        }
        const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
        // Node needs duplex: 'half' for streamed request bodies.
        const init = { method: req.method, headers: req.headers as Record<string, string>, body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined, duplex: 'half' }
        const request = new Request(url, init as RequestInit)
        const response: Response = await handler(request)
        res.statusCode = response.status
        response.headers.forEach((v, k) => res.setHeader(k, v))
        res.end(Buffer.from(await response.arrayBuffer()))
      })
    },
  }
}

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; Vercel and local dev serve from /.
  base: process.env.GITHUB_PAGES ? '/Food-Corner-by-Indae-Lenlyn/' : '/',
  plugins: [react(), tailwindcss(), localApi()],
  server: { fs: { allow: ['..'] } },
})
