import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { createChantier, listChantiers, getChantierById } from "./chantiers.controller";

const router = Router();

// Liste (filtrée selon rôle)
router.get("/", authenticate, listChantiers);

// Détail (accès contrôlé par rôle/assignment)
router.get("/:id", authenticate, getChantierById);

// Création (superviseur uniquement)
router.post("/", authenticate, authorize("SUPERVISEUR"), createChantier);

export default router;