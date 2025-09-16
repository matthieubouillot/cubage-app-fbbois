import { Request, Response } from "express";
import { getAllEssences } from "./essences.service";

export async function getEssences(_req: Request, res: Response) {
  try {
    const essences = await getAllEssences();
    res.json(essences);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la récupération des essences" });
  }
}