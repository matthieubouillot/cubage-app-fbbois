import { Router } from "express";
const router = Router();

// TODO: ajouter routes saisies
router.get("/", (_req, res) => res.json({ message: "Liste des saisies (à implémenter)" }));

export default router;