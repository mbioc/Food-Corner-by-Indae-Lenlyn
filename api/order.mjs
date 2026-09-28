// Vercel entry for the order email function; the logic lives in site/netlify/functions/order.mjs
// so Netlify and Vercel share one implementation. Needs the same env vars (see site/README.md).
import handler from '../site/netlify/functions/order.mjs'

export const POST = (request) => handler(request)
