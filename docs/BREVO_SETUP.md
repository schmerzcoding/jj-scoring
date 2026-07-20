# Brevo + Supabase Email Verification Setup

This app uses **Supabase Auth** for accounts and **Brevo** (formerly Sendinblue) as the SMTP provider for verification emails.

## ⚠️ Important: Enable email confirmation first

If signup sends users **directly to profile setup** without an email, **Confirm email is disabled** in Supabase. No code change will fix this — you must enable it in the dashboard:

1. Supabase → **Authentication** → **Providers** → **Email**
2. Turn **ON** → **Confirm email**
3. Save

After enabling, **new signups** will receive a verification email (once Brevo SMTP is configured below). Existing auto-confirmed users are already active and won't receive a retroactive email.

## 1. Create a Brevo account

1. Sign up at [brevo.com](https://www.brevo.com)
2. Verify your sender domain or at least a single sender email (e.g. `noreply@yourdomain.com`)

## 2. Get Brevo SMTP credentials

1. In Brevo: **Settings → SMTP & API → SMTP**
2. Create an **SMTP key** (not the API key)
3. Note these values:

| Field | Value |
|-------|-------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` (TLS) or `465` (SSL) |
| Username | Your Brevo login email |
| Password | The SMTP key you generated |
| Sender email | A verified sender in Brevo |
| Sender name | e.g. `J&J Scoring` |

## 3. Configure Supabase Auth SMTP

1. Open your project at [supabase.com](https://supabase.com)
2. Go to **Authentication → Providers → Email** and confirm **Confirm email** is **ON**
3. Go to **Project Settings → Authentication → SMTP Settings**
4. Enable **Custom SMTP** and enter:

```
Host: smtp-relay.brevo.com
Port number: 587
Minimum interval between emails: 60 (or as needed)
Username: your-brevo-login@email.com
Password: your-brevo-smtp-key
Sender email: noreply@yourdomain.com  (must be verified in Brevo)
Sender name: J&J Scoring
```

5. Save and send a test email from Supabase if available.

## 4. Configure redirect URLs

In **Authentication → URL Configuration**:

| Setting | Value |
|---------|-------|
| Site URL | `https://jj-scoring-orcin.vercel.app` (production) |
| Redirect URLs | Add both: |
| | `https://jj-scoring-orcin.vercel.app/auth/callback` |
| | `http://localhost:3000/auth/callback` |

The app sends users to `/auth/callback?next=/profile/setup` after they click the verification link.

## 5. Customize the verification email (optional)

In **Authentication → Email Templates → Confirm signup**:

- Subject example: `Confirm your J&J Scoring account`
- Body can use Supabase variables: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`

Make sure the confirmation link uses the redirect URL configured above.

## 6. Run database migration

Execute in Supabase SQL Editor:

```
supabase/migrations/007_extended_profiles.sql
```

This adds profile fields (`bio`, `gender`, `dance_role`, `age`, `profile_completed`).

## 7. User flow

1. **Sign up** → email + password only
2. **Verify email** → user clicks link in Brevo-sent email
3. **Auth callback** → `/auth/callback` creates session
4. **Profile setup** → full name, bio, gender, dance role, age
5. **Browse & register** → user can join competitions

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **Signup skips email, goes to profile setup** | **Confirm email is OFF** in Supabase → Authentication → Providers → Email. Turn it ON, then test with a **new** email address |
| Email not arriving | Check Brevo sender verification; check spam; review Brevo transactional logs |
| `Email rate limit exceeded` | Brevo free tier is higher than Supabase default; custom SMTP fixes this |
| Link redirects to login with error | Add `/auth/callback` to Supabase redirect URLs |
| User stuck on verify page after clicking link | Confirm Site URL matches your deployed domain |
| Existing test users blocked | Migration 007 marks existing profiles as `profile_completed = true` |

## Brevo free tier limits

Brevo free plan includes ~300 emails/day (check current limits on their site). Sufficient for early user testing.

## Security notes

- Never commit SMTP keys to git
- SMTP is configured only in Supabase dashboard, not in `.env.local`
- The app only needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
