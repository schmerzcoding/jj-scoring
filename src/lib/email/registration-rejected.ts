import { sendBrevoEmail, type SendEmailResult } from "@/lib/email/brevo";

export async function sendRegistrationRejectedEmail({
  to,
  recipientName,
  competitionName,
  competitionUrl,
  reason,
}: {
  to: string;
  recipientName: string;
  competitionName: string;
  competitionUrl: string;
  reason: string;
}): Promise<SendEmailResult> {
  const subject = `Update on your Jack & Jill application — ${competitionName}`;
  const greeting = recipientName.trim() || "there";
  const trimmedReason = reason.trim();

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      <p>Hi ${escapeHtml(greeting)},</p>
      <p>
        Thank you for applying to <strong>${escapeHtml(competitionName)}</strong>.
        After reviewing your application, we are unable to approve your registration
        for this Jack &amp; Jill at this time.
      </p>
      ${
        trimmedReason
          ? `<p style="margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <strong>Message from the organizer:</strong><br />
        ${escapeHtml(trimmedReason).replaceAll("\n", "<br />")}
      </p>`
          : ""
      }
      <p>
        If you have questions, you can reply to this email or visit the event page.
      </p>
      <p style="margin: 28px 0;">
        <a href="${competitionUrl}"
           style="display: inline-block; background: #8115d7; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 600;">
          View event page
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">Waddle Social</p>
    </div>
  `.trim();

  const text = [
    `Hi ${greeting},`,
    "",
    `Thank you for applying to ${competitionName}. After reviewing your application, we are unable to approve your registration for this Jack & Jill at this time.`,
    "",
    trimmedReason ? `Message from the organizer:\n${trimmedReason}` : "",
    "",
    `Event page: ${competitionUrl}`,
    "",
    "Waddle Social",
  ]
    .filter(Boolean)
    .join("\n");

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
