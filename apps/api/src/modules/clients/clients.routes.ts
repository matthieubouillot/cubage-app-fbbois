import { Router } from "express";
import { authenticate, authorize } from "../../middlewares/auth";
import {
  listClients,
  getClient,
  createClient,
  updateClient,
  deleteClient,
} from "./clients.controller";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Seuls les superviseurs peuvent gérer les clients
router.use(authorize("SUPERVISEUR"));

router.get("/", listClients);
router.get("/:id", getClient);
router.post("/", createClient);
router.put("/:id", updateClient);
router.delete("/:id", deleteClient);

export default router;
