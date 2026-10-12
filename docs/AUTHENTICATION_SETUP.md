# Draftline authentication setup

Draftline supports email/password signup with a one-time email verification code and Google sign-in.

## 1. Update the database

The signup flow adds the `EmailVerificationCode` table. After pulling the latest code, run this once against the configured production database:

```bash
npx prisma db push
npx prisma generate
```

For Vercel, run the commands from an online development environment such as GitHub Codespaces, with the production `DATABASE_URL` and `DIRECT_URL` configured. Do not commit database credentials.

## 2. Configure email verification

Create a Resend account and configure a verified sender address. Add these environment variables to your hosting provider:

- `RESEND_API_KEY` — API key from Resend.
- `EMAIL_FROM` — verified sender, for example `Draftline <auth@yourdomain.com>`.

Codes expire after 10 minutes and are limited to five incorrect attempts. A new code can be requested after 60 seconds.

## 3. Configure Google sign-in

In Google Cloud Console, create an OAuth 2.0 Client ID for a Web application. Add your deployed origin as an authorized JavaScript origin, and add this exact redirect URI:

```
https://YOUR-DOMAIN/api/auth/google/callback
```

Set these environment variables in your hosting provider:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_SITE_URL` — the canonical deployed URL, including `https://` and without a trailing slash.
- `AUTH_SECRET` — a cryptographically random secret of at least 32 characters.

After changing environment variables, redeploy the application.

## Important access-control note

Draftline's current CMS authorization model uses the `ADMIN` role for access to the admin studio. The signup endpoints currently create verified new accounts with that role, so anyone who can complete public signup receives CMS admin access. For a production CMS, restrict signup or add an invitation/approval workflow before making this available publicly.
