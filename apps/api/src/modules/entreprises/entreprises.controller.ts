import type { Request, Response } from "express";
import { z } from "zod";
import {
  getEntreprisesService,
  getEntrepriseByIdService,
  createEntrepriseService,
  updateEntrepriseService,
  deleteEntrepriseService,
} from "./entreprises.service";

const CreateSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
});

const UpdateSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
});

/** Helper autorisation SUPERVISEUR */
function requireSupervisor(
  req: Request,
  res: Response,
): { ok: boolean } {
  const u = (req as any).user as { roles: string[] } | undefined;
  if (!u || !u.roles.includes("SUPERVISEUR")) {
    res.status(403).json({ error: "Accès refusé" });
    return { ok: false };
  }
  return { ok: true };
}

/** GET /entreprises */
export async function getEntreprises(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;
  try {
    const entreprises = await getEntreprisesService();
    res.json(entreprises);
  } catch (e: any) {
    res
      .status(500)
      .json({
        error: e.message || "Erreur lors de la récupération des entreprises",
      });
  }
}

/** GET /entreprises/:id */
export async function getEntrepriseById(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;
  try {
    const entreprise = await getEntrepriseByIdService(req.params.id);
    if (!entreprise)
      return res.status(404).json({ error: "Entreprise introuvable" });
    res.json(entreprise);
  } catch (e: any) {
    res
      .status(500)
      .json({
        error: e.message || "Erreur lors de la récupération de l'entreprise",
      });
  }
}

/** POST /entreprises */
export async function createEntreprise(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  const parse = CreateSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Champs invalides", details: parse.error.flatten() });
  }

  try {
    const out = await createEntrepriseService(parse.data.name);
    res.status(201).json(out);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("existe déjà") || (msg.includes("unique") && msg.includes("name"))) {
      return res.status(409).json({ error: "Une entreprise avec ce nom existe déjà" });
    }
    res
      .status(400)
      .json({ error: e.message || "Impossible de créer l'entreprise" });
  }
}

/** PUT /entreprises/:id */
export async function updateEntreprise(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  const parse = UpdateSchema.safeParse(req.body);
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: "Champs invalides", details: parse.error.flatten() });
  }

  try {
    const out = await updateEntrepriseService(req.params.id, parse.data.name);
    res.json(out);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("introuvable") || msg.includes("not found")) {
      return res.status(404).json({ error: "Entreprise introuvable" });
    }
    if (msg.includes("existe déjà") || (msg.includes("unique") && msg.includes("name"))) {
      return res.status(409).json({ error: "Une entreprise avec ce nom existe déjà" });
    }
    res
      .status(400)
      .json({ error: e.message || "Impossible de modifier l'entreprise" });
  }
}

/** DELETE /entreprises/:id */
export async function deleteEntreprise(req: Request, res: Response) {
  const gate = requireSupervisor(req, res);
  if (!gate.ok) return;

  try {
    const out = await deleteEntrepriseService(req.params.id);
    res.json(out);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("introuvable")) {
      return res.status(404).json({ error: "Entreprise introuvable" });
    }
    if (msg.includes("utilisateurs")) {
      return res.status(409).json({ error: e.message });
    }
    res
      .status(400)
      .json({ error: e.message || "Impossible de supprimer l'entreprise" });
  }
}

