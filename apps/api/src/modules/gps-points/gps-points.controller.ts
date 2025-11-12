import { Request, Response } from "express";
import {
  getGPSPointsByChantier,
  getGPSPointsByQualityGroup,
  createGPSPoint,
  updateGPSPoint,
  deleteGPSPoint,
  reorderGPSPoints,
} from "./gps-points.service";

export async function getGPSPoints(req: Request, res: Response) {
  try {
    const { chantierId } = req.params;
    const points = await getGPSPointsByChantier(chantierId);
    res.json(points);
  } catch (error: any) {
    console.error("Error fetching GPS points:", error);
    res.status(500).json({ error: error.message || "Erreur lors de la récupération des points GPS" });
  }
}

export async function getGPSPointsByQualityGroupController(req: Request, res: Response) {
  try {
    const { chantierId, qualityGroupId } = req.params;
    const points = await getGPSPointsByQualityGroup(chantierId, qualityGroupId);
    res.json(points);
  } catch (error: any) {
    console.error("Error fetching GPS points by quality group:", error);
    res.status(500).json({ error: error.message || "Erreur lors de la récupération des points GPS" });
  }
}

export async function createGPSPointController(req: Request, res: Response) {
  try {
    const { chantierId } = req.params;
    const { qualityGroupId, ...pointData } = req.body;
    if (!qualityGroupId) {
      return res.status(400).json({ error: "qualityGroupId est requis" });
    }
    const point = await createGPSPoint(chantierId, qualityGroupId, pointData);
    res.status(201).json(point);
  } catch (error: any) {
    console.error("Error creating GPS point:", error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: "Données invalides", details: error.errors });
    } else {
      res.status(500).json({ error: error.message || "Erreur lors de la création du point GPS" });
    }
  }
}

export async function updateGPSPointController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const point = await updateGPSPoint(id, req.body);
    res.json(point);
  } catch (error: any) {
    console.error("Error updating GPS point:", error);
    if (error.name === 'ZodError') {
      res.status(400).json({ error: "Données invalides", details: error.errors });
    } else {
      res.status(500).json({ error: error.message || "Erreur lors de la mise à jour du point GPS" });
    }
  }
}

export async function deleteGPSPointController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteGPSPoint(id);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error("Error deleting GPS point:", error);
    res.status(500).json({ error: error.message || "Erreur lors de la suppression du point GPS" });
  }
}

export async function reorderGPSPointsController(req: Request, res: Response) {
  try {
    const { chantierId } = req.params;
    const { pointIds } = req.body;
    
    if (!Array.isArray(pointIds)) {
      return res.status(400).json({ error: "pointIds doit être un tableau" });
    }
    
    const points = await reorderGPSPoints(chantierId, pointIds);
    res.json(points);
  } catch (error: any) {
    console.error("Error reordering GPS points:", error);
    res.status(500).json({ error: error.message || "Erreur lors du réordonnement des points GPS" });
  }
}
