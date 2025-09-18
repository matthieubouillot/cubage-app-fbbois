import type { Request, Response } from "express";
import { z } from "zod";
import {
  createChantierService,
  listChantiersService,
  getChantierByIdService,
  deleteChantierService,
} from "./chantiers.service";

// ✅ Schéma d'entrée : PAS d'essenceIds (elles sont déduites des qualiteIds)
const CreateChantierSchema = z.object({
  referenceLot: z.string().min(1),
  convention: z.string().min(1),
  proprietaire: z.string().min(1),
  proprietaireFirstName: z.string().min(1),
  commune: z.string().min(1),
  lieuDit: z.string().min(1),
  qualiteIds: z.array(z.string().uuid()).min(1, "Choisis au moins une qualité"),
  bucheronIds: z
    .array(z.string().uuid())
    .min(1, "Choisis au moins un bûcheron"),
  section: z
    .string()
    .regex(/^[A-Za-z]{1,2}$/)
    .optional()
    .nullable(),
  parcel: z.string().regex(/^\d+$/).optional().nullable(),
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

export async function listChantiers(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    role: "BUCHERON" | "SUPERVISEUR";
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
    role: "BUCHERON" | "SUPERVISEUR";
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
    role: "BUCHERON" | "SUPERVISEUR";
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
    return res
      .status(500)
      .json({
        error: e.message || "Erreur lors de la suppression du chantier",
      });
  }
}
