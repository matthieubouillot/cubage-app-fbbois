// apps/api/src/modules/auth/password-reset.service.ts
import { prisma } from "../../prisma";
import crypto from "crypto";
import * as bcrypt from "bcryptjs";
import { sendMail } from "../../lib/mailer";

const RESET_TTL_MINUTES = 60;

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findFirst({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, firstName: true, lastName: true },
  });

  // Toujours "ok" (ne révèle pas si l'email existe)
  if (!user) return { ok: true };

  // Invalider les anciens tokens non utilisés
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = makeToken();
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${
    process.env.WEB_BASE_URL ?? "http://localhost:5173"
  }/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Réinitialisation de votre mot de passe";
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;line-height:1.45">
      <h2 style="margin:0 0 12px">${process.env.MAIL_FROM_NAME ?? "Gestion de Cubage"}</h2>
      <p>Bonjour ${user.firstName ?? ""} ${user.lastName ?? ""},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>
        <a href="${resetUrl}" style="display:inline-block;background:#000;color:#fff;padding:10px 16px;border-radius:999px;text-decoration:none">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expire dans ${RESET_TTL_MINUTES} minutes.</p>
      <p style="color:#6b7280">Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.</p>
    </div>
  `.trim();

  const text =
    `Bonjour ${user.firstName ?? ""} ${user.lastName ?? ""},\n\n` +
    `Pour réinitialiser votre mot de passe (valide ${RESET_TTL_MINUTES} minutes) :\n` +
    `${resetUrl}\n\n` +
    `Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.`;

  try {
    await sendMail({ to: user.email, subject, html, text });
  } catch (err) {
    // On n'échoue pas côté API, on log juste pour suivi
    // eslint-disable-next-line no-console
    console.error("[MAILER] Échec d'envoi du reset password:", err);
  }

  return { ok: true };
}

export async function resetPassword(token: string, newPassword: string) {
  const row = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!row || row.usedAt || row.expiresAt < new Date()) {
    throw new Error("Lien invalide ou expiré.");
  }

  const hash = await bcrypt.hash(newPassword, 10);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: row.userId },
      data: { password: hash },
    });
    await tx.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
  });

  return { ok: true };
}
