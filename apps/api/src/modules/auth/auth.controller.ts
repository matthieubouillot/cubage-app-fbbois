import { Request, Response } from "express";
import { validateUser } from "./auth.service";
import { signToken } from "../../middlewares/auth";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: "Email et mot de passe requis" });

  const user = await validateUser(email, password);
  if (!user) return res.status(400).json({ error: "Identifiants invalides" });

  const token = signToken({ userId: user.id, role: user.role as any });
  return res.json({ token, user });
}