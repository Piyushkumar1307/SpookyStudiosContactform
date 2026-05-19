import { z } from 'zod'
import { authorizeApiKey, sendTextMail } from '../lib/mail.js'

const SendMailSchema = z.object({
  to: z.string().trim().email().max(160),
  subject: z.string().trim().min(1).max(200),
  text: z.string().trim().min(1).max(8000),
  replyTo: z.string().trim().email().max(160).optional(),
  reply_to: z.string().trim().email().max(160).optional(),
})

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8')

  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }))
    return
  }

  const auth = authorizeApiKey(req)
  if (!auth.ok) {
    res.statusCode = 401
    res.end(JSON.stringify({ ok: false, error: auth.error }))
    return
  }

  const parsed = SendMailSchema.safeParse(req.body)
  if (!parsed.success) {
    res.statusCode = 400
    res.end(
      JSON.stringify({
        ok: false,
        error: 'Invalid payload',
        issues: parsed.error.issues,
      }),
    )
    return
  }

  const { to, subject, text, replyTo, reply_to } = parsed.data

  try {
    await sendTextMail({
      to,
      subject,
      text,
      replyTo: replyTo ?? reply_to,
    })

    res.statusCode = 200
    res.end(JSON.stringify({ ok: true }))
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('send-mail error:', err)
    res.statusCode = 502
    res.end(JSON.stringify({ ok: false, error: msg }))
  }
}
