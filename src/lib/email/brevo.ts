type SendEmailParams = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailFailureReason =
  | "missing_api_key"
  | "invalid_api_key"
  | "sender_not_allowed"
  | "api_error";

export type SendEmailResult =
  | { ok: true }
  | {
      ok: false;
      reason: SendEmailFailureReason;
      error: string;
      status?: number;
    };

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export function getBrevoEmailFailureMessage(result: Extract<SendEmailResult, { ok: false }>): string {
  switch (result.reason) {
    case "missing_api_key":
      return "Email is not configured. Add BREVO_API_KEY in Vercel (Brevo → Settings → SMTP & API → API Keys — not the SMTP key used in Supabase).";
    case "invalid_api_key":
      return "Brevo rejected the API key. Create a new v3 API key in Brevo and update BREVO_API_KEY in Vercel, then redeploy.";
    case "sender_not_allowed":
      return `Brevo rejected the sender address. Verify ${process.env.BREVO_SENDER_EMAIL ?? "noreply@waddlesocial.com"} in Brevo → Senders, Domains & dedicated IPs.`;
    default:
      return "Brevo could not send the email. Check Brevo → Transactional → Email logs for details.";
  }
}

export async function sendBrevoEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY?.trim();
  if (!apiKey) {
    console.warn("BREVO_API_KEY is not set; skipping transactional email.");
    return {
      ok: false,
      reason: "missing_api_key",
      error: "BREVO_API_KEY is not set.",
    };
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

    if (response.status === 401 || response.status === 403) {
      return {
        ok: false,
        reason: "invalid_api_key",
        error: "Invalid Brevo API key.",
        status: response.status,
      };
    }

    const lowerBody = body.toLowerCase();
    if (
      response.status === 400 &&
      (lowerBody.includes("sender") ||
        lowerBody.includes("not verified") ||
        lowerBody.includes("not authorised"))
    ) {
      return {
        ok: false,
        reason: "sender_not_allowed",
        error: "Sender address is not allowed by Brevo.",
        status: response.status,
      };
    }

    return {
      ok: false,
      reason: "api_error",
      error: "Brevo API request failed.",
      status: response.status,
    };
  }

  return { ok: true };
}
