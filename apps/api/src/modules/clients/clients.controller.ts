import { Request, Response } from "express";
import {
  getClientsService,
  getClientByIdService,
  createClientService,
  updateClientService,
  deleteClientService,
  type CreateClientPayload,
  type UpdateClientPayload,
} from "./clients.service";

export async function listClients(req: Request, res: Response) {
  try {
    const clients = await getClientsService();
    return res.json(clients);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}

export async function getClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const client = await getClientByIdService(id);
    
    if (!client) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    
    return res.json(client);
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}

export async function createClient(req: Request, res: Response) {
  try {
    const payload = req.body as CreateClientPayload;
    const client = await createClientService(payload);
    return res.status(201).json(client);
  } catch (error: any) {
    return res.status(400).json({ error: error.message || "Erreur de validation" });
  }
}

export async function updateClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const payload = req.body as UpdateClientPayload;
    const client = await updateClientService(id, payload);
    return res.json(client);
  } catch (error: any) {
    if (error.message.includes("non trouvé")) {
      return res.status(404).json({ error: error.message });
    }
    return res.status(400).json({ error: error.message || "Erreur de validation" });
  }
}

export async function deleteClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteClientService(id);
    return res.json({ ok: true });
  } catch (error: any) {
    if (error.message.includes("non trouvé")) {
      return res.status(404).json({ error: error.message });
    }
    if (error.message.includes("chantiers associés")) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message || "Erreur serveur" });
  }
}
