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
        },
      },
    }),
  )
}

