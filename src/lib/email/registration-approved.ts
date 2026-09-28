import { sendBrevoEmail, type SendEmailResult } from "@/lib/email/brevo";

export async function sendRegistrationApprovedEmail({
  to,
  recipientName,
  competitionName,
  competitionUrl,
}: {
  to: string;
  recipientName: string;
  competitionName: string;
  competitionUrl: string;
}): Promise<SendEmailResult> {
  const subject = `Your Jack & Jill registration was approved — ${competitionName}`;
  const greeting = recipientName.trim() || "there";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      <p>Hi ${escapeHtml(greeting)},</p>
      <p>
        Your registration for <strong>${escapeHtml(competitionName)}</strong> has been approved.
      </p>
      <p>
        To confirm your spot, please complete payment on the event page. Your competitor pass
        includes access to the social pass for the day.
      </p>
      <p style="margin: 28px 0;">
        <a href="${competitionUrl}"
           style="display: inline-block; background: #8115d7; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 600;">
          Complete payment to finalize registration
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">
        Or copy this link into your browser:<br />
        <a href="${competitionUrl}">${competitionUrl}</a>
      </p>
      <p style="font-size: 14px; color: #555;">See you on the floor!<br />Waddle Social</p>
    </div>
  `.trim();

  const text = [
    `Hi ${greeting},`,
    "",
    `Your registration for ${competitionName} has been approved.`,
    "",
    "To confirm your spot, please complete payment on the event page. Your competitor pass includes access to the social pass for the day.",
    "",
    `Complete payment here: ${competitionUrl}`,
    "",
    "See you on the floor!",
    "Waddle Social",
  ].join("\n");

  return sendBrevoEmail({ to, subject, html, text });
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
