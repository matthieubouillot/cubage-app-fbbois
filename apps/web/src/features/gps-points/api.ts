import { api } from "../../lib/api";
import { isOnline } from "../../lib/offlineDb";

export interface GPSPoint {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  notes?: string;
  order: number;
  chantierId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGPSPointInput {
  latitude: number;
  longitude: number;
  name?: string;
  notes?: string;
  order: number;
  qualityGroupId: string;
}

export interface UpdateGPSPointInput {
  latitude?: number;
  longitude?: number;
  name?: string;
  notes?: string;
  order?: number;
}

export async function fetchGPSPoints(chantierId: string, qualityGroupId?: string): Promise<GPSPoint[]> {
  // En mode hors ligne, retourner un tableau vide pour éviter l'erreur ERR_INTERNET_DISCONNECTED
  if (!isOnline()) {
    console.warn('Mode hors ligne: impossible de récupérer les points GPS');
    return [];
  }
  
  try {
    if (qualityGroupId) {
      return await api<GPSPoint[]>(`/gps-points/quality-group/${qualityGroupId}`);
    }
    return await api<GPSPoint[]>(`/gps-points/${chantierId}`);
  } catch (error: any) {
    // Si erreur de connexion, retourner un tableau vide au lieu de propager l'erreur
    if (!navigator.onLine || error.message?.includes('Failed to fetch') || error.message?.includes('network')) {
      console.warn('Erreur réseau lors de la récupération des points GPS:', error);
      return [];
    }
    throw error;
  }
}

export async function createGPSPoint(chantierId: string, input: CreateGPSPointInput): Promise<GPSPoint> {
  return await api<GPSPoint>(`/gps-points/${chantierId}`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateGPSPoint(id: string, input: UpdateGPSPointInput): Promise<GPSPoint> {
  return await api<GPSPoint>(`/gps-points/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
}

export async function deleteGPSPoint(id: string): Promise<void> {
  await api<void>(`/gps-points/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderGPSPoints(chantierId: string, pointIds: string[]): Promise<GPSPoint[]> {
  return await api<GPSPoint[]>(`/gps-points/${chantierId}/reorder`, {
    method: 'POST',
    body: JSON.stringify({ pointIds }),
  });
}
