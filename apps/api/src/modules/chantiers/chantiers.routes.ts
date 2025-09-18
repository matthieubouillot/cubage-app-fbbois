import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { createChantier, listChantiers, getChantierById, deleteChantier } from "./chantiers.controller";

const router = Router();

// Liste (filtrée selon rôle)
router.get("/", authenticate, listChantiers);

// Détail (accès contrôlé par rôle/assignment)
router.get("/:id", authenticate, getChantierById);

// Création (superviseur uniquement)
router.post("/", authenticate, authorize("SUPERVISEUR"), createChantier);


// Suppression (superviseur uniquement)
router.delete("/:id",authenticate,authorize("SUPERVISEUR"),deleteChantier);

export default router;