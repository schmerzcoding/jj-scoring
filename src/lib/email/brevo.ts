type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY is not set; skipping transactional email.");
    return { ok: false, error: "Email service is not configured." };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL ?? "noreply@waddlesocial.com";
  const senderName = process.env.BREVO_SENDER_NAME ?? "Waddle Social";

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: text,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error("Brevo email failed:", response.status, body);
    return { ok: false, error: "Could not send email." };
  }

  return { ok: true };
}
