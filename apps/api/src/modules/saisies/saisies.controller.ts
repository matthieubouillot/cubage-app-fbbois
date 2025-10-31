import type { Request, Response } from "express";
import { z } from "zod";
import {
  createSaisieService,
  listSaisiesService,
  getSaisiesStatsService,
  updateSaisieService,
  deleteSaisieService,
} from "./saisies.service";

const CreateSchema = z.object({
  chantierId: z.string().uuid(),
  qualityGroupId: z.string().uuid(),
  longueur: z.number().positive(),
  diametre: z.number().positive(),
  annotation: z.string().max(500).optional().nullable(),
  debardeurId: z.string().uuid().optional().nullable(),
});

const UpdateSchema = z.object({
  longueur: z.number().positive(),
  diametre: z.number().positive(),
  annotation: z.string().max(500).optional().nullable(),
  numero: z.number().positive().optional(),
  debardeurId: z.string().uuid().optional().nullable(),
});

export async function createSaisie(req: Request, res: Response) {
  try {
    const auth = (req as any).user as {
      userId: string;
      roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
    };
    const payload = req.body as {
      chantierId: string;
      qualityGroupId: string;
      longueur: number;
      diametre: number;
      annotation?: string | null;
      numero?: number;
    };
    const row = await createSaisieService(auth, payload);
    res.status(201).json(row);
  } catch (e: any) {
    res
      .status(400)
      .json({ error: e.message || "Impossible de créer la saisie" });
  }
}

export async function updateSaisie(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  const parse = UpdateSchema.safeParse(req.body);
  if (!parse.success)
    return res
      .status(400)
      .json({ error: "Champs invalides", details: parse.error.flatten() });

  try {
    const data = await updateSaisieService(auth, req.params.id, parse.data);
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Mise à jour impossible" });
  }
}

export async function deleteSaisie(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  try {
    await deleteSaisieService(auth, req.params.id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Suppression impossible" });
  }
}

export async function listSaisies(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  const chantierId = req.query.chantierId as string;
  const qualityGroupId = req.query.qualityGroupId as string;

  if (!chantierId || !qualityGroupId)
    return res.status(400).json({ error: "chantierId et qualityGroupId requis" });

  try {
    const data = await listSaisiesService(auth, { chantierId, qualityGroupId });
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Lecture impossible" });
  }
}

export async function getSaisiesStats(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  };
  const chantierId = req.query.chantierId as string;
  const qualityGroupId = req.query.qualityGroupId as string;
  const global = req.query.global === "true";
  if (!chantierId || !qualityGroupId)
    return res.status(400).json({ error: "chantierId et qualityGroupId requis" });
  try {
    const data = await getSaisiesStatsService(auth, { chantierId, qualityGroupId, global });
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Stats indisponibles" });
  }
}
