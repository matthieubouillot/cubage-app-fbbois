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
  qualiteId: z.string().uuid(),
  longueur: z.number().positive(),
  diametre: z.number().positive(),
  annotation: z.string().max(500).optional().nullable(),
});

const UpdateSchema = z.object({
  longueur: z.number().positive(),
  diametre: z.number().positive(),
  annotation: z.string().max(500).optional().nullable(),
});

export async function createSaisie(req: Request, res: Response) {
  try {
    const auth = (req as any).user as {
      userId: string;
      role: "BUCHERON" | "SUPERVISEUR";
    };
    const payload = req.body as {
      chantierId: string;
      qualiteId: string;
      longueur: number;
      diametre: number;
      annotation?: string | null;
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
    role: "BUCHERON" | "SUPERVISEUR";
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
    role: "BUCHERON" | "SUPERVISEUR";
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
    role: "BUCHERON" | "SUPERVISEUR";
  };
  const chantierId = req.query.chantierId as string;
  const qualiteId = req.query.qualiteId as string;

  if (!chantierId || !qualiteId)
    return res.status(400).json({ error: "chantierId et qualiteId requis" });

  try {
    const data = await listSaisiesService(auth, { chantierId, qualiteId });
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Lecture impossible" });
  }
}

export async function getSaisiesStats(req: Request, res: Response) {
  const auth = (req as any).user as {
    userId: string;
    role: "BUCHERON" | "SUPERVISEUR";
  };
  const chantierId = req.query.chantierId as string;
  const qualiteId = req.query.qualiteId as string;
  if (!chantierId || !qualiteId)
    return res.status(400).json({ error: "chantierId et qualiteId requis" });
  try {
    const data = await getSaisiesStatsService(auth, { chantierId, qualiteId });
    res.json(data);
  } catch (e: any) {
    res.status(400).json({ error: e.message || "Stats indisponibles" });
  }
}
