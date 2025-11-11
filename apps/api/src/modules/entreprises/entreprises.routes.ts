import { Router } from "express";
import {
  getEntreprises,
  getEntrepriseById,
  createEntreprise,
  updateEntreprise,
  deleteEntreprise,
} from "./entreprises.controller";
import { authenticate } from "../../middlewares/auth";

const router = Router();

// Toutes ces routes sont protégées + réservées au SUPERVISEUR (vérifié en controller)
router.use(authenticate);

router.get("/", getEntreprises);
router.get("/:id", getEntrepriseById);
router.post("/", createEntreprise);
router.put("/:id", updateEntreprise);
router.delete("/:id", deleteEntreprise);

export default router;

