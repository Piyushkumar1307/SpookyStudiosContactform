# Spooky Studios — Vercel contact & email API

Deploy the `vercel-email-api/` folder to Vercel (e.g. [spooky-studios-contactform.vercel.app](https://spooky-studios-contactform.vercel.app)).

## Endpoints

| Route | Used by | Auth |
|-------|---------|------|
| `POST /api/contact` | Browser contact form | `ALLOWED_ORIGINS` (CORS) |
| `POST /api/send-mail` | Render server (OTP emails) | `X-Api-Key: EMAIL_API_SECRET` |

## Vercel environment variables

Required for both endpoints:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TO`
- `EMAIL_API_SECRET` — shared secret for `/api/send-mail`
- `ALLOWED_ORIGINS` — e.g. `https://piyush-store.onrender.com,http://127.0.0.1:8000`

Optional: `AUTO_REPLY_ENABLED`, `AUTO_REPLY_SUBJECT`, `AUTO_REPLY_BODY`

## Render (gesture-backend)

```bash
CONTACT_API_URL=https://spooky-studios-contactform.vercel.app/api/contact
EMAIL_API_SECRET=<same as Vercel>
```

## Deploy

```bash
cd vercel-email-api
npm install
npx vercel --prod
```

## Test send-mail (OTP)

```bash
curl -X POST https://spooky-studios-contactform.vercel.app/api/send-mail \
  -H "Content-Type: application/json" \
  -H "X-Api-Key: YOUR_EMAIL_API_SECRET" \
  -d '{"to":"you@gmail.com","subject":"Your OTP for spookystudios","text":"Your OTP is: 123456\n\nExpires in 10 minutes."}'
```
