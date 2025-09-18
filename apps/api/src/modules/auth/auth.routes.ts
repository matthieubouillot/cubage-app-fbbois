import { Router } from "express";
import { login, forgotPassword, applyResetPassword} from "./auth.controller";

const router = Router();
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", applyResetPassword);

export default router;