import { z } from 'zod'
import { envBool, mustEnv, sendTextMail } from '../lib/mail.js'

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(10).max(4000),
  subject: z.string().trim().max(200).optional(),
})

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
  if (allowed.length === 0) return true
  if (!origin) return false
  return allowed.includes(origin)
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

  const { name, email, message, subject: subjectField } = parsed.data
  const subject = subjectField?.trim() || `New website enquiry — ${name}`

  try {
    const to = mustEnv('SMTP_TO')

    await sendTextMail({
      to,
      subject: `[spookystudios] ${subject}`,
      replyTo: email,
      text: [
        `New message from spookystudios contact form`,
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
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
        'We received your message — spookystudios'
      const autoBody =
        process.env.AUTO_REPLY_BODY?.trim() ||
        [
          `Hi ${name},`,
          '',
          `Thanks for contacting spookystudios. We received your message and will reply within one business day.`,
          '',
          'Your message:',
          message,
          '',
        ].join('\n')

      await sendTextMail({
        to: email,
        subject: autoSubject,
        text: autoBody,
      })
    }

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: true, detail: 'Thanks — we received your message and will reply soon.' }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('contact error:', err)
    res.statusCode = 502
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: false, error: msg }))
  }
}
