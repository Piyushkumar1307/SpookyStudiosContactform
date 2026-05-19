import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

export function envBool(name: string, defaultValue: boolean) {
  const raw = process.env[name]
  if (raw == null) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(raw.toLowerCase())
}

export function mustEnv(name: string) {
  const v = process.env[name]?.trim()
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

export function createTransport(): Transporter {
  const host = mustEnv('SMTP_HOST')
  const port = Number(mustEnv('SMTP_PORT'))
  const user = mustEnv('SMTP_USER')
  const pass = mustEnv('SMTP_PASS').replace(/\s+/g, '')

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendTextMail(opts: {
  to: string
  subject: string
  text: string
  replyTo?: string
}) {
  const transport = createTransport()
  const from = mustEnv('SMTP_FROM')

  await transport.sendMail({
    from,
    to: opts.to,
    replyTo: opts.replyTo,
    subject: opts.subject,
    text: opts.text,
  })
}

export function authorizeApiKey(req: { headers?: Record<string, string | string[] | undefined> }) {
  const expected = process.env.EMAIL_API_SECRET?.trim()
  if (!expected) {
    return { ok: false as const, error: 'EMAIL_API_SECRET not configured on Vercel' }
  }

  const raw =
    (req.headers?.['x-api-key'] as string | undefined) ??
    (req.headers?.authorization as string | undefined) ??
    ''

  const token = raw.startsWith('Bearer ') ? raw.slice(7).trim() : raw.trim()
  if (!token || token !== expected) {
    return { ok: false as const, error: 'Unauthorized' }
  }

  return { ok: true as const }
}
