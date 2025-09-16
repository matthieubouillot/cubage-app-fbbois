import type { Request, Response } from "express";
import { getUsersService, getBucheronsService, getUserByIdService } from "./users.service";

/**
 * GET /users?role=BUCHERON|SUPERVISEUR
 * Si ?role est fourni, filtre par rôle.
 */
export async function getUsers(req: Request, res: Response) {
  const role = req.query.role as "BUCHERON" | "SUPERVISEUR" | undefined;
  try {
    const users = await getUsersService(role);
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Erreur lors de la récupération des utilisateurs" });
  }
}

/**
 * GET /users/bucherons
 * Renvoie uniquement les utilisateurs avec le rôle BUCHERON.
 */
export async function getBucherons(_req: Request, res: Response) {
  try {
    const users = await getBucheronsService();
    res.json(users);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Erreur lors de la récupération des bûcherons" });
  }
}

/**
 * GET /users/:id
 * (utile au besoin : lecture d’un utilisateur)
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const user = await getUserByIdService(req.params.id);
    if (!user) return res.status(404).json({ error: "Utilisateur introuvable" });
    res.json(user);
  } catch (e: any) {
    res.status(500).json({ error: e.message || "Erreur lors de la récupération de l'utilisateur" });
  }
}