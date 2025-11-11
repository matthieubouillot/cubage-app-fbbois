import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import { createChantier, listChantiers, getChantierById, deleteChantier, updateChantier, getChantierFiche, saveChantierFiche } from "./chantiers.controller";

const router = Router();

// Liste (filtrée selon rôle)
router.get("/", authenticate, listChantiers);

// Création (superviseur uniquement)
router.post("/", authenticate, authorize("SUPERVISEUR"), createChantier);

// Fiche chantier (doit être avant /:id pour éviter les conflits de route)
router.get("/:id/fiche", authenticate, getChantierFiche);
router.put("/:id/fiche", authenticate, authorize("SUPERVISEUR"), saveChantierFiche);

// Détail (accès contrôlé par rôle/assignment)
router.get("/:id", authenticate, getChantierById);

router.put("/:id", authenticate, authorize("SUPERVISEUR"), updateChantier); 

// Suppression (superviseur uniquement)
router.delete("/:id",authenticate,authorize("SUPERVISEUR"),deleteChantier);

export default router;