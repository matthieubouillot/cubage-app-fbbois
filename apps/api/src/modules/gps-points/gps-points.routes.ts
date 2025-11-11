import { Router } from "express";
import {
  getGPSPoints,
  getGPSPointsByQualityGroupController,
  createGPSPointController,
  updateGPSPointController,
  deleteGPSPointController,
  reorderGPSPointsController,
} from "./gps-points.controller";

const router = Router();

// GET /api/gps-points/quality-group/:qualityGroupId - Récupérer tous les points GPS d'un quality group
router.get("/quality-group/:qualityGroupId", getGPSPointsByQualityGroupController);

// GET /api/gps-points/:chantierId - Récupérer tous les points GPS d'un chantier
router.get("/:chantierId", getGPSPoints);

// POST /api/gps-points/:chantierId - Créer un nouveau point GPS
router.post("/:chantierId", createGPSPointController);

// PUT /api/gps-points/:id - Mettre à jour un point GPS
router.put("/:id", updateGPSPointController);

// DELETE /api/gps-points/:id - Supprimer un point GPS
router.delete("/:id", deleteGPSPointController);

// POST /api/gps-points/:chantierId/reorder - Réordonner les points GPS
router.post("/:chantierId/reorder", reorderGPSPointsController);

export default router;
