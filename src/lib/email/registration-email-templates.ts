export const REGISTRATION_EMAIL_PLACEHOLDERS = [
  { token: "{{name}}", description: "Participant name" },
  { token: "{{competitionName}}", description: "Event name" },
  { token: "{{competitionUrl}}", description: "Link to the event page" },
] as const;

export const DEFAULT_APPROVAL_EMAIL_SUBJECT =
  "Your Jack & Jill registration was approved — {{competitionName}}";

export const DEFAULT_APPROVAL_EMAIL_BODY = `Your registration for {{competitionName}} has been approved.

To confirm your spot, please complete payment on the event page. Your competitor pass includes access to the social pass for the day.

See you on the floor!
Waddle Social`;

export const DEFAULT_REJECTION_EMAIL_SUBJECT =
  "Update on your Jack & Jill application — {{competitionName}}";

export const DEFAULT_REJECTION_EMAIL_BODY = `Thank you for applying to {{competitionName}}. After reviewing your application, we are unable to approve your registration for this Jack & Jill at this time.

If you have questions, you can reply to this email or visit the event page.`;

export type RegistrationEmailTemplateVars = {
  name: string;
  competitionName: string;
  competitionUrl: string;
};

export function resolveRegistrationEmailSubject(
  template: string | null | undefined,
  fallback: string,
  vars: RegistrationEmailTemplateVars
): string {
  const source = template?.trim() || fallback;
  return renderRegistrationEmailTemplate(source, vars);
}

export function resolveRegistrationEmailBody(
  template: string | null | undefined,
  fallback: string,
  vars: RegistrationEmailTemplateVars
): string {
  const source = template?.trim() || fallback;
  return renderRegistrationEmailTemplate(source, vars);
}

export function renderRegistrationEmailTemplate(
  template: string,
  vars: RegistrationEmailTemplateVars
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in vars) {
      return vars[key as keyof RegistrationEmailTemplateVars];
    }
    return match;
  });
}

export function emailBodyToHtmlParagraphs(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("\n      ");
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function paymentButtonHtml(competitionUrl: string): string {
  return `<p style="margin: 28px 0;">
        <a href="${competitionUrl}"
           style="display: inline-block; background: #8115d7; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 600;">
          Complete payment to finalize registration
        </a>
      </p>
      <p style="font-size: 14px; color: #555;">
        Or copy this link into your browser:<br />
        <a href="${competitionUrl}">${competitionUrl}</a>
      </p>`;
}

export function eventPageButtonHtml(competitionUrl: string): string {
  return `<p style="margin: 28px 0;">
        <a href="${competitionUrl}"
           style="display: inline-block; background: #8115d7; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 10px; font-weight: 600;">
          View event page
        </a>
      </p>`;
}
