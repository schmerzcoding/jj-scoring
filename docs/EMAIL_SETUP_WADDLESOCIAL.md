# Email setup — Waddle Social (waddlesocial.com)

Guía paso a paso para **confirmación de cuenta** y **restablecimiento de contraseña** con Brevo + Supabase.

---

## Resumen del flujo

| Acción | Email de Supabase | Usuario hace clic → |
|--------|-------------------|---------------------|
| Sign up | Confirm signup | `/auth/callback` → profile setup |
| Forgot password | Reset password | `/auth/callback` → `/reset-password` |

---

## Parte 1 — Brevo (correo saliente)

### 1.1 Autenticar dominio `waddlesocial.com`

1. [app.brevo.com](https://app.brevo.com) → **Senders, Domains & dedicated IPs** → **Domains**
2. **Add a domain** → `waddlesocial.com`
3. Añade los registros DNS que te indique Brevo

> **DNS en Vercel:** como tus nameservers están en Vercel, añade los TXT/CNAME de Brevo en **Vercel → Domains → waddlesocial.com → DNS Records** (no en GoDaddy).

4. Pulsa **Authenticate this email domain** hasta ver ✅ en DKIM y Brevo code

Guía detallada: [BREVO_DOMAIN_SETUP.md](./BREVO_DOMAIN_SETUP.md)

### 1.2 Crear remitente

1. Brevo → **Senders** → **Add a sender**
2. Email: `noreply@waddlesocial.com`
3. Name: `Waddle Social`

### 1.3 Obtener SMTP key

1. Brevo → **Settings → SMTP & API → SMTP**
2. **Generate a new SMTP key** y cópiala (solo se muestra una vez)

| Campo | Valor |
|-------|-------|
| Host | `smtp-relay.brevo.com` |
| Port | `587` |
| Username | Tu email de login de Brevo |
| Password | La SMTP key |
| Sender | `noreply@waddlesocial.com` |

---

## Parte 2 — Supabase

### 2.1 SMTP personalizado

1. Supabase → **Project Settings → Authentication → SMTP Settings**
2. **Enable Custom SMTP**

```
Host: smtp-relay.brevo.com
Port: 587
Username: [tu login de Brevo]
Password: [SMTP key]
Sender email: noreply@waddlesocial.com
Sender name: Waddle Social
```

3. Guarda y envía email de prueba si está disponible

### 2.2 Activar confirmación de email

1. **Authentication → Providers → Email**
2. **Confirm email** → **ON**
3. Guarda

### 2.3 URLs de redirección

**Authentication → URL Configuration:**

| Setting | Valor |
|---------|-------|
| **Site URL** | `https://www.waddlesocial.com` |
| **Redirect URLs** | `https://www.waddlesocial.com/**` |
| | `https://waddlesocial.com/**` |
| | `http://localhost:3000/**` |

### 2.4 Plantillas de email (opcional pero recomendado)

**Authentication → Email Templates**

**Confirm signup:**
- Subject: `Confirm your Waddle Social account`
- Body: incluye `{{ .ConfirmationURL }}`

**Reset password:**
- Subject: `Reset your Waddle Social password`
- Body: incluye `{{ .ConfirmationURL }}`

Los enlaces usarán automáticamente tu Site URL y las Redirect URLs.

---

## Parte 3 — Vercel (activar verificación en la app)

1. Vercel → proyecto **jj-scoring** → **Settings → Environment Variables**
2. Añade o actualiza:

```
NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true
```

3. Aplica a **Production** (y Preview si quieres)
4. **Redeploy** el proyecto (Deployments → ⋯ → Redeploy)

Sin esta variable, la app no bloqueará usuarios sin email verificado aunque Supabase envíe el correo.

---

## Parte 4 — Probar

### Confirmación de cuenta

1. Abre incógnito → `https://www.waddlesocial.com/signup`
2. Registra un **email nuevo**
3. Deberías ir a `/verify-email` (no directo al perfil)
4. Revisa bandeja y spam — remitente `noreply@waddlesocial.com`
5. Clic en el enlace → profile setup → app normal

### Restablecer contraseña

1. `/login` → **Forgot password?**
2. Introduce tu email → **Send reset link**
3. Abre el email → enlace → `/reset-password`
4. Nueva contraseña → login con la nueva

### Logs si falla

- **Brevo** → Transactional → Email logs
- **Supabase** → Authentication → Logs

---

## Problemas frecuentes

| Problema | Solución |
|----------|----------|
| Signup va directo al perfil | `Confirm email` OFF en Supabase, o falta `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` en Vercel |
| No llega el email | Dominio no autenticado en Brevo; revisa spam; SMTP key incorrecta |
| Link abre login con error | Falta `https://www.waddlesocial.com/**` en Redirect URLs |
| Reset password no funciona | Misma Redirect URL; plantilla Reset password activa en Supabase |
| DKIM no verifica | Añade registros en **Vercel DNS**, no GoDaddy |

---

## Checklist final

- [ ] Dominio autenticado en Brevo
- [ ] Sender `noreply@waddlesocial.com`
- [ ] SMTP en Supabase
- [ ] Confirm email ON
- [ ] Site URL + Redirect URLs
- [ ] `NEXT_PUBLIC_REQUIRE_EMAIL_VERIFICATION=true` en Vercel + redeploy
- [ ] Prueba signup con email nuevo
- [ ] Prueba forgot password
