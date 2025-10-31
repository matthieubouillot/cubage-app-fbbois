import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret";

export type Role = "BUCHERON" | "SUPERVISEUR" | "DEBARDEUR";
export type JwtPayload = { userId: string; roles: Role[] };

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: "Token manquant" });

  const token: string = header.split(" ")[1] ?? "";
  if (!token) return res.status(401).json({ error: "Token manquant" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    (req as any).user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Token invalide/expiré" });
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as JwtPayload | undefined;
    if (!u) return res.status(401).json({ error: "Non authentifié" });
    if (!u.roles.some(role => roles.includes(role))) return res.status(403).json({ error: "Accès interdit" });
    next();
  };
}