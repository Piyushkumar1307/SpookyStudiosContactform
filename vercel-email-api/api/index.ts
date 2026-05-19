export default function handler(req: any, res: any) {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(
    JSON.stringify({
      ok: true,
      service: 'contact-email-api',
      endpoints: {
        contact: {
          method: 'POST',
          path: '/api/contact',
          auth: 'CORS (ALLOWED_ORIGINS)',
        },
        sendMail: {
          method: 'POST',
          path: '/api/send-mail',
          auth: 'Header X-Api-Key: EMAIL_API_SECRET (server-only, OTP)',
        },
      },
    }),
  )
}
