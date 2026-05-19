# Vercel Contact Email API (Nodemailer)

This folder is a **separate deployable** Vercel serverless API used to send enquiry emails (and optional auto-replies) via SMTP using Nodemailer.

It is meant for the case where your main website is hosted as a **static site** (Hostinger/Netlify/etc.) but you still need a backend for email sending.

## Endpoint

- `POST /api/contact`

Body:

```json
{
  "name": "Your Name",
  "email": "you@example.com",
  "message": "At least 10 characters"
}
```

Response:

```json
{ "ok": true }
```

## Environment variables (set in Vercel Project Settings)

Required:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SMTP_TO`

Optional auto-reply:
- `AUTO_REPLY_ENABLED` (`true`/`false`, default `true`)
- `AUTO_REPLY_SUBJECT`
- `AUTO_REPLY_BODY`

CORS allowlist (recommended):
- `ALLOWED_ORIGINS` (comma-separated)
  - Example: `https://vipprafest.com,https://www.vipprafest.com`

## Local testing (optional)

```bash
cd vercel-email-api
npm install
npx vercel dev
```
## Connect the frontend

In your **frontend** build environment, set:

`VITE_CONTACT_API_URL="https://<your-vercel-project>.vercel.app/api/contact"`

Then rebuild/redeploy the static site.


