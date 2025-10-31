import type { Request, Response } from "express";
import { z } from "zod";
import {
  createChantierService,
  listChantiersService,
  getChantierByIdService,
  deleteChantierService,
  updateChantierService,
} from "./chantiers.service";

const CreateChantierSchema = z.object({
  numeroCoupe: z.string().regex(/^\d+$/, "Uniquement des chiffres").min(1),
  clientId: z.string().uuid("ID client invalide"),
  propertyId: z.string().uuid("ID propriété invalide"),
  qualityGroupIds: z.array(z.string().uuid()).min(1, "Choisis au moins un groupe de qualité"),
  bucheronIds: z.array(z.string().uuid()).min(1, "Choisis au moins un bûcheron"),
  debardeurIds: z.array(z.string().uuid()).min(1, "Choisis au moins un débardeur"),
  lotConventions: z.array(z.object({
    qualityGroupId: z.string().uuid(),
    lot: z.string().regex(/^\d*$/, "Uniquement des chiffres").optional(),
    convention: z.string().regex(/^\d*$/, "Uniquement des chiffres").optional(),
  })).optional(),
});

export async function createChantier(req: Request, res: Response) {
  const parse = CreateChantierSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({
      error: "Champs invalides",
      details: parse.error.flatten(),
    });
  }

  try {
    const chantier = await createChantierService(parse.data);
    return res.status(201).json(chantier);
  } catch (e: any) {
    return res
      .status(400)
      .json({ error: e.message || "Impossible de créer le chantier" });
  }
}

const UpsertChantierSchema = z.object({
  numeroCoupe: z.string().regex(/^\d+$/, "Uniquement des chiffres").min(1).optional(),
  clientId: z.string().uuid("ID client invalide").optional(),
  propertyId: z.string().uuid("ID propriété invalide").optional(),
  qualityGroupIds: z.array(z.string().uuid()).min(1, "Choisis au moins un groupe de qualité").optional(),
  bucheronIds: z.array(z.string().uuid()).min(1, "Choisis au moins un bûcheron").optional(),
  debardeurIds: z.array(z.string().uuid()).min(1, "Choisis au moins un débardeur").optional(),
  lotConventions: z.array(z.object({
    qualityGroupId: z.string().uuid(),
    lot: z.string().regex(/^\d*$/, "Uniquement des chiffres").optional(),
    convention: z.string().regex(/^\d*$/, "Uniquement des chiffres").optional(),
  })).optional(),
});

export async function updateChantier(req: Request, res: Response) {
  const auth = (req as any).user as { userId: string; roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[] };
  const parse = UpsertChantierSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Champs invalides", details: parse.error.flatten() });
  }
  try {
    const updated = await updateChantierService(auth, req.params.id, parse.data);
    return res.json(updated);
  } catch (e: any) {
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("introuvable")) return res.status(404).json({ error: "Chantier introuvable" });
    if (msg.includes("accès refusé")) return res.status(403).json({ error: "Accès refusé" });
    return res.status(500).json({ error: e.message || "Erreur lors de la mise à jour" });
  }
}

export async function listChantiers(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  try {
    const data = await listChantiersService(auth);
    return res.json(data);
  } catch (e: any) {
    return res
      .status(500)
      .json({ error: e.message || "Erreur lors de la liste des chantiers" });
  }
}

export async function getChantierById(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  try {
    const data = await getChantierByIdService(auth, req.params.id);
    if (!data) return res.status(404).json({ error: "Chantier introuvable" });
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({
      error: e.message || "Erreur lors de la récupération du chantier",
    });
  }
}

export async function deleteChantier(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };

  try {
    const result = await deleteChantierService(auth, req.params.id);
    return res.json(result);
  } catch (e: any) {
    // 404 si déjà supprimé ou inexistant
    const msg = (e?.message || "").toLowerCase();
    if (msg.includes("introuvable")) {
      return res.status(404).json({ error: "Chantier introuvable" });
    }
    if (msg.includes("accès refusé")) {
      return res.status(403).json({ error: "Accès refusé" });
    }
    return res.status(500).json({
      error: e.message || "Erreur lors de la suppression du chantier",
    });
  }
}
