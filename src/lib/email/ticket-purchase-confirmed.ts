import { sendBrevoEmail, type SendEmailResult } from "@/lib/email/brevo";
import { escapeHtml } from "@/lib/email/registration-email-templates";

export type TicketPurchaseEmailItem = {
  passLabel: string;
  passCode: string;
  ticketUrl: string;
};

export async function sendTicketPurchaseConfirmedEmail({
  to,
  recipientName,
  eventName,
  eventUrl,
  profileTicketsUrl,
  items,
}: {
  to: string;
  recipientName: string;
  eventName: string;
  eventUrl: string;
  profileTicketsUrl: string;
  items: TicketPurchaseEmailItem[];
}): Promise<SendEmailResult> {
  const greeting = recipientName.trim() || "there";
  const passWord = items.length === 1 ? "pass" : "passes";
  const subject = `Your ${passWord} for ${eventName} — Waddle Social`;

  const itemsHtml = items
    .map(
      (item) => `
        <li style="margin: 0 0 12px;">
          <strong>${escapeHtml(item.passLabel)}</strong><br />
          Pass ID: <code style="font-family: monospace;">${escapeHtml(item.passCode)}</code><br />
          <a href="${item.ticketUrl}">View QR code</a>
        </li>
      `
    )
    .join("");

  const itemsText = items
    .map(
      (item) =>
        `- ${item.passLabel}\n  Pass ID: ${item.passCode}\n  QR: ${item.ticketUrl}`
    )
    .join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      <p>Hi ${escapeHtml(greeting)},</p>
      <p>
        Thank you for your purchase. Your ${escapeHtml(passWord)} for
        <strong>${escapeHtml(eventName)}</strong> ${items.length === 1 ? "is" : "are"} confirmed.
      </p>
      <p>
        Show the QR code from your profile at the door. You can also quote your Pass ID
        if staff need to look up your entry.
      </p>
      <ul style="padding-left: 18px; margin: 20px 0;">
        ${itemsHtml}
      </ul>
      <p style="margin: 28px 0;">
        <a href="${profileTicketsUrl}"
           style="display: inline-block; background: #8115d7; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 600;">
          View ${passWord} in my profile
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">
        Event page: <a href="${eventUrl}">${eventUrl}</a>
      </p>
      <p style="font-size: 14px; color: #555;">See you there!<br />Waddle Social</p>
    </div>
  `.trim();

  const text = [
    `Hi ${greeting},`,
    "",
    `Thank you for your purchase. Your ${passWord} for ${eventName} ${items.length === 1 ? "is" : "are"} confirmed.`,
    "",
    "Show the QR code from your profile at the door. You can also quote your Pass ID if staff need to look up your entry.",
    "",
    itemsText,
    "",
    `My profile: ${profileTicketsUrl}`,
    `Event page: ${eventUrl}`,
    "",
    "See you there!",
    "Waddle Social",
  ].join("\n");

  return sendBrevoEmail({ to, subject, html, text });
}
