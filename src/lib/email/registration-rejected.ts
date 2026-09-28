import { sendBrevoEmail, type SendEmailResult } from "@/lib/email/brevo";
import {
  DEFAULT_REJECTION_EMAIL_BODY,
  DEFAULT_REJECTION_EMAIL_SUBJECT,
  emailBodyToHtmlParagraphs,
  escapeHtml,
  eventPageButtonHtml,
  resolveRegistrationEmailBody,
  resolveRegistrationEmailSubject,
  type RegistrationEmailTemplateVars,
} from "@/lib/email/registration-email-templates";

export async function sendRegistrationRejectedEmail({
  to,
  recipientName,
  competitionName,
  competitionUrl,
  reason,
  subjectTemplate,
  bodyTemplate,
}: {
  to: string;
  recipientName: string;
  competitionName: string;
  competitionUrl: string;
  reason: string;
  subjectTemplate?: string | null;
  bodyTemplate?: string | null;
}): Promise<SendEmailResult> {
  const greeting = recipientName.trim() || "there";
  const trimmedReason = reason.trim();
  const vars: RegistrationEmailTemplateVars = {
    name: greeting,
    competitionName,
    competitionUrl,
  };

  const subject = resolveRegistrationEmailSubject(
    subjectTemplate,
    DEFAULT_REJECTION_EMAIL_SUBJECT,
    vars
  );
  const body = resolveRegistrationEmailBody(
    bodyTemplate,
    DEFAULT_REJECTION_EMAIL_BODY,
    vars
  );

  const reasonHtml = trimmedReason
    ? `<p style="margin: 20px 0; padding: 16px; background: #f5f5f5; border-radius: 8px;">
        <strong>Message from the organizer:</strong><br />
        ${escapeHtml(trimmedReason).replaceAll("\n", "<br />")}
      </p>`
    : "";

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      <p>Hi ${escapeHtml(greeting)},</p>
      ${emailBodyToHtmlParagraphs(body)}
      ${reasonHtml}
      ${eventPageButtonHtml(competitionUrl)}
      <p style="font-size: 14px; color: #555;">Waddle Social</p>
    </div>
  `.trim();

  const text = [
    `Hi ${greeting},`,
    "",
    body,
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
