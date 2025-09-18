// apps/api/src/lib/mailer.ts
import nodemailer from "nodemailer";

const host = process.env.BREVO_SMTP_HOST!;
const port = Number(process.env.BREVO_SMTP_PORT ?? 587);
const user = process.env.BREVO_SMTP_USER!;
const pass = process.env.BREVO_SMTP_PASS!;
const from = process.env.MAIL_FROM!;
const fromName = process.env.MAIL_FROM_NAME ?? "Gestion de Cubage";

if (!host || !user || !pass || !from) {
  // eslint-disable-next-line no-console
  console.warn("[MAILER] Variables SMTP manquantes (Brevo). Les emails échoueront.");
}

export const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,          // true pour 465, false pour 587
  auth: { user, pass },
});

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const info = await transporter.sendMail({
    from: { name: fromName, address: from },
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return info;
}