import { Request, Response } from "express";
import { validateUser } from "./auth.service";
import { signToken } from "../../middlewares/auth";
import { z } from "zod";
import { requestPasswordReset, resetPassword } from "./password.service";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password)
    return res.status(400).json({ error: "Email et mot de passe requis" });

  const user = await validateUser(email, password);
  if (!user) return res.status(400).json({ error: "Identifiants invalides" });

  const token = signToken({ userId: user.id, role: user.role as any });
  return res.json({ token, user });
}

const ForgotSchema = z.object({ email: z.string().email() });
const ResetSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "Au moins 8 caractères"),
});

export async function forgotPassword(req: Request, res: Response) {
  const parse = ForgotSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Email invalide" });

  await requestPasswordReset(parse.data.email);
  return res.json({ ok: true });
}

export async function applyResetPassword(req: Request, res: Response) {
  const parse = ResetSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: "Données invalides" });

  try {
    await resetPassword(parse.data.token, parse.data.password);
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(400).json({ error: e.message || "Lien invalide" });
  }
}
