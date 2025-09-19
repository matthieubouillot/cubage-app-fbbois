// apps/api/src/lib/mailer.ts
import nodemailer from "nodemailer";

const FROM_EMAIL = process.env.GMAIL_USER!;
const FROM_NAME = process.env.MAIL_FROM_NAME ?? "Gestion de Cubage";

/**
 * Transporter Gmail (compte + mot de passe d'application)
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

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

  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    text,
  });
}
