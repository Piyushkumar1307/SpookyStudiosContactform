import nodemailer from 'nodemailer'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(4000),
})

function envBool(name: string, defaultValue: boolean) {
  const raw = process.env[name]
  if (raw == null) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

function mustEnv(name: string) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

function parseAllowedOrigins() {
  const raw = (process.env.ALLOWED_ORIGINS ?? '').trim()
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isOriginAllowed(origin: string | null) {
  const allowed = parseAllowedOrigins()
  if (allowed.length === 0) return true // if not set, allow all (dev-friendly)
  if (!origin) return false
  return allowed.includes(origin)
}

function createTransport() {
  const host = mustEnv('SMTP_HOST')
  const port = Number(mustEnv('SMTP_PORT'))
  const user = mustEnv('SMTP_USER')
  const pass = mustEnv('SMTP_PASS')

  const secure = port === 465

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  })
}

function setCors(res: any, origin: string | null) {
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: any, res: any) {
  const origin = (req.headers?.origin as string | undefined) ?? null
  setCors(res, origin)

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }))
    return
  }

  if (!isOriginAllowed(origin)) {
    res.statusCode = 403
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: 'Forbidden origin' }))
    return
  }

  const parsed = ContactSchema.safeParse(req.body)
  if (!parsed.success) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(
      JSON.stringify({
        ok: false,
        error: 'Invalid form data',
        issues: parsed.error.issues,
      }),
    )
    return
  }

  const { name, email, message } = parsed.data

  try {
    const transport = createTransport()

    const from = mustEnv('SMTP_FROM') // e.g. "Vipprafest <no-reply@yourdomain>"
    const to = mustEnv('SMTP_TO') // where you want to receive leads

    const subject = `New website enquiry — ${name}`

    await transport.sendMail({
      from,
      to,
      replyTo: email,
      subject,
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        '',
        message,
        '',
        `Sent from: ${origin ?? 'unknown origin'}`,
      ].join('\n'),
    })

    const autoReplyEnabled = envBool('AUTO_REPLY_ENABLED', true)
    if (autoReplyEnabled) {
      const autoSubject =
        process.env.AUTO_REPLY_SUBJECT?.trim() ||
        'We received your message — Vipprafest'
      const autoBody =
        process.env.AUTO_REPLY_BODY?.trim() ||
        [
          `Hi ${name},`,
          '',
          `Thanks for contacting. We have received your message and will respond within one business day.`,
          '',
          'Your message:',
          message,
          ''
        ].join('\n')

      await transport.sendMail({
        from,
        to: email,
        subject: autoSubject,
        text: autoBody,
      })
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: true }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: msg }))
  }
}

