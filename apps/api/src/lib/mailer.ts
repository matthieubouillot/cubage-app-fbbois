import { Resend } from "resend";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@votre-domaine.com";
const FROM_NAME = process.env.MAIL_FROM_NAME ?? "Gestion de Cubage";

/**
 * Client Resend
 */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Envoi générique d'email
 */
export async function sendMail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = params;

  if (!resend) {
    return;
  }

  await resend.emails.send({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });
}