import { Router } from "express";
import { getEssences } from "./essences.controller";

const router = Router();
router.get("/", getEssences);

export default router;