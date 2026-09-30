// Transactional email through Brevo (free tier: 300/day).

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

export const emailConfigured = () => !!(process.env.BREVO_API_KEY && process.env.SENDER_EMAIL)

export function page(title, introHtml, text) {
  return `<!doctype html><html><body style="margin:0;background:#f7f9e6;font-family:Arial,sans-serif;color:#0d150d">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#1f7535;color:#fff;border-radius:16px;padding:20px">
      <p style="margin:0;font-size:14px;opacity:.85">Food Corner by Indae Lenlyn</p>
      <h1 style="margin:6px 0 0;font-size:24px;color:#fae02c">${esc(title)}</h1>
    </div>
    <p style="font-size:15px;line-height:1.5">${introHtml}</p>
    ${text ? `<pre style="white-space:pre-wrap;background:#fff;border:1px solid #dfe3d0;border-radius:12px;padding:16px;font:14px/1.5 Arial,sans-serif">${esc(text)}</pre>` : ''}
    <p style="font-size:13px;color:#33412f">Questions? Call or text 0951 510 6845.</p>
  </div></body></html>`
}

export { esc }

export async function sendEmail({ to, subject, html, text, replyTo, attachment }) {
  if (!emailConfigured()) return false
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.SENDER_EMAIL, name: process.env.SENDER_NAME || 'Food Corner by Indae Lenlyn' },
      to,
      replyTo,
      subject,
      htmlContent: html,
      textContent: text,
      attachment,
    }),
  })
  if (!res.ok) {
    console.error('Brevo', res.status, await res.text())
    return false
  }
  return true
}
