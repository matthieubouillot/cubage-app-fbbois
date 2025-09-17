import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import { createSaisie, listSaisies, getSaisiesStats } from "./saisies.controller";

const router = Router();

router.get("/", authenticate, listSaisies);   // ?chantierId=...&qualiteId=...
router.post("/", authenticate, createSaisie); // bûcheron ou superviseur
router.get("/stats", authenticate, getSaisiesStats);

export default router;