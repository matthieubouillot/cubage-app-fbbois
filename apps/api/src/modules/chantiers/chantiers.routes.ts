import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { createChantier, listChantiers } from "./chantiers.controller";

const router = Router();

// Liste (filtrée selon rôle)
router.get("/", authenticate, listChantiers);

// Création (superviseur uniquement)
router.post("/", authenticate, authorize("SUPERVISEUR"), createChantier);

export default router;