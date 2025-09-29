import type { Request, Response } from "express";
import { z } from "zod";
import {
  getUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  deleteUserService,
  type Role,
} from "./users.service";

const RoleEnum = z.enum(["BUCHERON", "SUPERVISEUR"]);
const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
const phoneRegex = /^[0-9+().\s-]{6,20}$/;

const CreateSchema = z.object({
  firstName: z.string().regex(nameRegex),
  lastName: z.string().regex(nameRegex),
  role: RoleEnum,
  email: z.string().email(),
  phone: z.string().regex(phoneRegex),
  numStart: z.number().int().nonnegative(),
  numEnd: z.number().int().nonnegative(),
  password: z.string().min(6), // obligatoire
});

// Pour édition, tout est requis (email exclu)
const UpdateSchema = z.object({
  firstName: z.string().regex(nameRegex),
  lastName: z.string().regex(nameRegex),
  role: RoleEnum,
  phone: z.string().regex(phoneRegex),
  numStart: z.number().int().nonnegative(),
  numEnd: z.number().int().nonnegative(),
});

/** Helper autorisation SUPERVISEUR */
function requireSupervisor(
  req: Request,
  res: Response,
): { ok: boolean; role?: Role } {
  const u = (req as any).user as { role: Role } | undefined;
  if (!u || u.role !== "SUPERVISEUR") {
    res.status(403).json({ error: "Accès refusé" });
    return { ok: false };
  }
  return { ok: true, role: u.role };
}

/** GET /users (plus de filtre par rôle) */
export async function getUsers(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;
  try {
    const roleParam = (req.query.role as string | undefined)?.toUpperCase();
    const role = roleParam === "BUCHERON" || roleParam === "SUPERVISEUR" ? (roleParam as Role) : undefined;
    const users = await getUsersService(role);
    res.json(users);
  } catch (e: any) {
    res
      .status(500)
      .json({
        error: e.message || "Erreur lors de la récupération des utilisateurs",
      });
  }
}

/** GET /users/:id */
export async function getUserById(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user)
      return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch (e: any) {
    res
      .status(500)
      .json({
        error: e.message || "Erreur lors de la récupération de l'utilisateur",
      });
  }
}

/** POST /users */
export async function createUser(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  const parse = CreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Champs invalides", details: parse.error.flatten() });
  }

  try {
    const out = await createUserService(parse.data);
    res.status(201).json(out);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("chevauche")) {
      return res
        .status(409)
        .json({ error: "Plage num. déjà utilisée (chevauchement)" });
    }
    if (msg.includes("unique") && msg.includes("email")) {
      return res.status(409).json({ error: "Email déjà utilisé" });
    }
    res
      .status(400)
      .json({ error: e.message || "Impossible de créer l’utilisateur" });
  }
}

/** PUT /users/:id */
export async function updateUser(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  const parse = UpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Champs invalides", details: parse.error.flatten() });
  }

  try {
    const out = await updateUserService(req.params.id, parse.data);
    res.json(out);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("introuvable") || msg.includes("not found")) {
      return res.status(404).json({ error: "Utilisateur introuvable" });
    }
    if (msg.includes("chevauche")) {
      return res
        .status(409)
        .json({ error: "Plage num. déjà utilisée (chevauchement)" });
    }
    res
      .status(400)
      .json({ error: e.message || "Impossible de modifier l’utilisateur" });
  }
}

/** DELETE /users/:id */
export async function deleteUser(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  try {
    const out = await deleteUserService(req.params.id);
    res.json(out);
  } catch (e: any) {
    res
      .status(400)
      .json({ error: e.message || "Impossible de supprimer l’utilisateur" });
  }
}
