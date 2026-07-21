# Configurar dominio en Brevo (español)

Guía para enviar correos de verificación desde **tu propio dominio** (ej. `noreply@tudominio.com`).

## ⚠️ Importante: no puedes usar `vercel.app`

Direcciones como `noreply@jj-scoring-orcin.vercel.app` **no funcionan** para email, porque no controlas el dominio `vercel.app`. Usa tu dominio: `noreply@waddlesocial.com`.

Necesitas un dominio que **tú poseas**, por ejemplo:
- `jjscoring.com`
- `tudominio.es`
- Un subdominio tuyo: `mail.tudominio.com` (solo el dominio raíz se autentica en Brevo)

Si aún no tienes dominio, compra uno en Namecheap, Cloudflare, GoDaddy, etc. (~10–15 €/año).

---

## Paso 1 — Añadir el dominio en Brevo

1. Entra en [app.brevo.com](https://app.brevo.com)
2. Clic en tu nombre (arriba derecha) → **Senders, Domains & dedicated IPs**
3. Pestaña **Domains** → **Add a domain**
4. Escribe solo el dominio raíz: `tudominio.com` (sin `https://`, sin `www`)
5. Guarda

---

## Paso 2 — Autenticar el dominio (DNS)

Brevo te ofrece dos opciones:

### Opción A — Automática (recomendada)

Si Brevo detecta tu proveedor DNS (Cloudflare, GoDaddy, etc.):
1. Elige **Authenticate the domain automatically**
2. Inicia sesión en tu proveedor DNS desde Brevo
3. Brevo añade los registros por ti
4. Espera unos minutos y pulsa **Authenticate this email domain**

### Opción B — Manual

Elige **Authenticate the domain yourself**. Brevo te mostrará registros similares a estos (los valores exactos son **únicos para tu cuenta** — cópialos del panel):

| Registro | Tipo | Host / Nombre | Para qué sirve |
|----------|------|---------------|----------------|
| **Brevo code** | TXT | `@` o `tudominio.com` | Verifica que eres dueño del dominio |
| **DKIM** | TXT o CNAME | `mail._domainkey` | Firma digital de los correos |
| **DMARC** | TXT | `_dmarc` | Política anti-spoofing |

**No hace falta añadir SPF manualmente** para Brevo en la mayoría de casos; Brevo gestiona el envío internamente. Lo crítico es **DKIM + Brevo code + DMARC**.

### Cómo añadir registros según proveedor

#### Cloudflare
1. Dominio → **DNS** → **Add record**
2. Para TXT en raíz: Name = `@`, Content = valor de Brevo
3. Para DKIM: Name = `mail._domainkey` (Cloudflare añade el dominio solo)
4. Para DMARC: Name = `_dmarc`
5. **Proxy status**: DNS only (nube gris) — no afecta TXT pero evita confusiones

#### Namecheap / GoDaddy / Hostinger
1. Panel del dominio → **Advanced DNS** / **DNS Management**
2. Añade registros **TXT** con los hosts que indica Brevo
3. Si el host es `@`, en algunos paneles se deja vacío o se pone el dominio completo

### Errores comunes

| Problema | Solución |
|----------|----------|
| DKIM no verifica | El host suele ser `mail._domainkey`, no `mail._domainkey.tudominio.com.tudominio.com` (doble dominio) |
| Tarda mucho | DNS puede tardar 5 min–48 h; pulsa **Authenticate this email domain** de nuevo |
| DMARC duplicado | Solo puede haber **un** registro `_dmarc`; fusiona o elimina el viejo |
| Valor no coincide | Copia/pega exacto desde Brevo, sin espacios extra |

---

## Paso 3 — Verificar en Brevo

1. Vuelve a **Domains** en Brevo
2. Clic en **Authenticate this email domain** (o **Check configuration**)
3. Debes ver ✅ verdes en Brevo code, DKIM y DMARC

---

## Paso 4 — Crear remitente (sender)

1. En Brevo → **Senders, Domains & dedicated IPs** → pestaña **Senders**
2. **Add a sender**
3. Email: `noreply@tudominio.com` (o `hello@`, `no-reply@` — debe ser del dominio autenticado)
4. Nombre: `Waddle Social`
5. Brevo puede pedir verificación del buzón; si no tienes buzón real, usa un alias o `noreply` sin inbox (depende del plan — a veces basta con dominio autenticado)

---

## Paso 5 — Conectar con Supabase

1. Supabase → **Project Settings** → **Authentication** → **SMTP Settings**
2. Enable custom SMTP:

```
Host: smtp-relay.brevo.com
Port: 587
Username: [tu email de login de Brevo]
Password: [SMTP key de Brevo — Settings → SMTP & API]
Sender email: noreply@tudominio.com
Sender name: Waddle Social
```

3. **Authentication → Providers → Email** → **Confirm email** = ON
4. **URL Configuration** → Redirect URLs incluyen `/auth/callback`

---

## Paso 6 — Probar

1. Regístrate con un **email nuevo** en la app
2. Deberías recibir el correo desde `noreply@tudominio.com`
3. Revisa spam; en Brevo → **Transactional** → **Logs** ves si se envió

---

## Checklist rápido

- [ ] Dominio propio comprado y acceso al DNS
- [ ] Dominio añadido y autenticado en Brevo (✅ verdes)
- [ ] Sender `noreply@tudominio.com` creado
- [ ] SMTP key de Brevo en Supabase
- [ ] Confirm email activado en Supabase
- [ ] Redirect URL `/auth/callback` en Supabase
- [ ] Prueba con cuenta nueva

---

## ¿Necesitas ayuda con registros concretos?

Dime:
1. Tu dominio (ej. `jjscoring.com`)
2. Dónde gestionas el DNS (Cloudflare, Namecheap, etc.)

Y te indico **exactamente** qué poner en cada campo con los valores que te muestre Brevo.
