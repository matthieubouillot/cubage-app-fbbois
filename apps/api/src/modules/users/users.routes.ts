import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "./users.controller";
import { authenticate } from "../../middlewares/auth";

const router = Router();

// Toutes ces routes sont protégées + réservées au SUPERVISEUR (vérifié en controller)
router.use(authenticate);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
