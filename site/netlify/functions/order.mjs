// Emails each order to the owner (with the payment screenshot attached) and a copy to the customer.
// Uses Brevo's free transactional email API (300 emails/day). Set these in Netlify → Site settings → Environment:
//   BREVO_API_KEY   – from brevo.com → SMTP & API → API keys
//   OWNER_EMAIL     – where new orders should arrive
//   SENDER_EMAIL    – a sender address verified in Brevo (can be the same Gmail as OWNER_EMAIL)
//   SENDER_NAME     – optional, defaults to "Food Corner by Indae Lenlyn"

const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

const MAX_PROOF_BYTES = 4 * 1024 * 1024

function page(title, intro, text) {
  return `<!doctype html><html><body style="margin:0;background:#f7f9e6;font-family:Arial,sans-serif;color:#0d150d">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#1f7535;color:#fff;border-radius:16px;padding:20px">
      <p style="margin:0;font-size:14px;opacity:.85">Food Corner by Indae Lenlyn</p>
      <h1 style="margin:6px 0 0;font-size:24px;color:#fae02c">${esc(title)}</h1>
    </div>
    <p style="font-size:15px;line-height:1.5">${intro}</p>
    <pre style="white-space:pre-wrap;background:#fff;border:1px solid #dfe3d0;border-radius:12px;padding:16px;font:14px/1.5 Arial,sans-serif">${esc(text)}</pre>
  </div></body></html>`
}

async function brevo(body) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Brevo ${res.status}: ${await res.text()}`)
}

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })
  const { BREVO_API_KEY, OWNER_EMAIL, SENDER_EMAIL } = process.env
  if (!BREVO_API_KEY || !OWNER_EMAIL || !SENDER_EMAIL) return new Response('Email is not configured yet.', { status: 503 })

  let data
  try {
    data = await req.json()
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  const { orderId, text, form, proof } = data ?? {}
  if (!orderId || !text || !form?.name || !form?.mobile || !proof?.dataUrl) return new Response('Missing order details.', { status: 400 })

  const m = /^data:(image\/[a-z+]+);base64,(.+)$/.exec(proof.dataUrl)
  if (!m) return new Response('Payment screenshot must be an image.', { status: 400 })
  if ((m[2].length * 3) / 4 > MAX_PROOF_BYTES) return new Response('Payment screenshot is too large.', { status: 413 })

  const sender = { email: SENDER_EMAIL, name: process.env.SENDER_NAME || 'Food Corner by Indae Lenlyn' }

  try {
    await brevo({
      sender,
      to: [{ email: OWNER_EMAIL, name: 'Lenlyn' }],
      replyTo: form.email ? { email: form.email, name: form.name } : undefined,
      subject: `New order ${orderId} · ${form.name} · ${form.eventDate}`,
      htmlContent: page(`New order ${orderId}`, `From <b>${esc(form.name)}</b> · <a href="tel:${esc(form.mobile)}">${esc(form.mobile)}</a>. Payment screenshot is attached.`, text),
      textContent: text,
      attachment: [{ name: `${orderId}-payment.jpg`, content: m[2] }],
    })
    if (form.email) {
      await brevo({
        sender,
        to: [{ email: form.email, name: form.name }],
        subject: `We got your order ${orderId} · Food Corner`,
        htmlContent: page(
          `Salamat, ${form.name}!`,
          `We received your order <b>${esc(orderId)}</b>. Lenlyn will check your payment and confirm by text or Messenger. Questions? Call 0951 510 6845.`,
          text,
        ),
        textContent: text,
      })
    }
  } catch (err) {
    console.error(err)
    return new Response('Could not send the email.', { status: 502 })
  }

  return Response.json({ ok: true, orderId })
}
