import { sendBrevoEmail, type SendEmailResult } from "@/lib/email/brevo";
import {
  DEFAULT_APPROVAL_EMAIL_BODY,
  DEFAULT_APPROVAL_EMAIL_SUBJECT,
  emailBodyToHtmlParagraphs,
  escapeHtml,
  paymentButtonHtml,
  resolveRegistrationEmailBody,
  resolveRegistrationEmailSubject,
  type RegistrationEmailTemplateVars,
} from "@/lib/email/registration-email-templates";

export async function sendRegistrationApprovedEmail({
  to,
  recipientName,
  competitionName,
  competitionUrl,
  subjectTemplate,
  bodyTemplate,
}: {
  to: string;
  recipientName: string;
  competitionName: string;
  competitionUrl: string;
  subjectTemplate?: string | null;
  bodyTemplate?: string | null;
}): Promise<SendEmailResult> {
  const greeting = recipientName.trim() || "there";
  const vars: RegistrationEmailTemplateVars = {
    name: greeting,
    competitionName,
    competitionUrl,
  };

  const subject = resolveRegistrationEmailSubject(
    subjectTemplate,
    DEFAULT_APPROVAL_EMAIL_SUBJECT,
    vars
  );
  const body = resolveRegistrationEmailBody(
    bodyTemplate,
    DEFAULT_APPROVAL_EMAIL_BODY,
    vars
  );

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px;">
      <p>Hi ${escapeHtml(greeting)},</p>
      ${emailBodyToHtmlParagraphs(body)}
      ${paymentButtonHtml(competitionUrl)}
    </div>
  `.trim();

  const text = [
    `Hi ${greeting},`,
    "",
    body,
    "",
    `Complete payment here: ${competitionUrl}`,
  ].join("\n");

  return sendBrevoEmail({ to, subject, html, text });
}
