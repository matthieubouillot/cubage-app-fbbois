import { Router } from "express";
import { authenticate } from "../../middlewares/auth";
import {
  createSaisie,
  listSaisies,
  getSaisiesStats,
  updateSaisie,
  deleteSaisie,
} from "./saisies.controller";

const router = Router();

router.get("/", authenticate, listSaisies);
router.post("/", authenticate, createSaisie);
router.patch("/:id", authenticate, updateSaisie);
router.delete("/:id", authenticate, deleteSaisie);
router.get("/stats", authenticate, getSaisiesStats);
export default router;
