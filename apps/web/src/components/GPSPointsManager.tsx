import { useState, useEffect, useCallback } from "react";
import { GPSPoint, fetchGPSPoints, createGPSPoint, updateGPSPoint, deleteGPSPoint } from "../features/gps-points/api";
import { Plus, MapPin, Edit2, Trash2, Download } from "lucide-react";
import MapSelector from "./MapSelector";
import MiniMap from "./MiniMap";

interface GPSPointsManagerProps {
  chantierId: string;
  qualityGroupId?: string;
  onPointsCountChange?: (count: number) => void;
  clientAddress?: {
    street?: string;
    postalCode?: string;
    city?: string;
  };
}

export default function GPSPointsManager({ chantierId, qualityGroupId, onPointsCountChange, clientAddress }: GPSPointsManagerProps) {
  const [points, setPoints] = useState<GPSPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPoint, setEditingPoint] = useState<GPSPoint | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 46.2276, lng: 2.2137 }); // Centre de la France
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  
  const buttonKey = qualityGroupId ? `gps_${qualityGroupId}` : 'gps';

  // Fonction pour géocoder l'adresse du client
  const geocodeClientAddress = async () => {
    if (!clientAddress?.city) return;

    try {
      const addressParts = [];
      if (clientAddress.street) addressParts.push(clientAddress.street);
      if (clientAddress.postalCode) addressParts.push(clientAddress.postalCode);
      if (clientAddress.city) addressParts.push(clientAddress.city);
      
      const fullAddress = addressParts.join(', ') + ', France';
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&countrycodes=fr`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setMapCenter({ lat: parseFloat(lat), lng: parseFloat(lon) });
      }
    } catch (error) {
      console.warn('Erreur lors du géocodage de l\'adresse du client:', error);
    }
  };

  useEffect(() => {
    loadPoints();
  }, [chantierId, qualityGroupId]);

  useEffect(() => {
    geocodeClientAddress();
  }, [clientAddress]);

  // Géolocalisation quand le formulaire s'ouvre
  useEffect(() => {
    if (showForm && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => {
          setMapCenter({ lat: 46.2276, lng: 2.2137 });
        },
        { timeout: 3000, enableHighAccuracy: false, maximumAge: 60000 }
      );
    }
  }, [showForm]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const data = await fetchGPSPoints(chantierId, qualityGroupId);
      setPoints(data);
      onPointsCountChange?.(data.length);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des points GPS");
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    setSelectedCoords({ lat, lng });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCoords) {
      setError("Veuillez sélectionner un point sur la carte");
      return;
    }

    try {
      const pointData = {
        latitude: selectedCoords.lat,
        longitude: selectedCoords.lng,
        order: points.length,
      };

      if (editingPoint) {
        await updateGPSPoint(editingPoint.id, pointData);
      } else {
        if (!qualityGroupId) {
          throw new Error("qualityGroupId est requis");
        }
        await createGPSPoint(chantierId, { ...pointData, qualityGroupId });
      }

      await loadPoints();
      resetForm();
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "Erreur lors de la sauvegarde");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce point GPS ?")) return;
    
    try {
      await deleteGPSPoint(id);
      await loadPoints();
    } catch (err: any) {
      console.error("Erreur lors de la suppression du point GPS:", err);
      setError(err.message || "Erreur lors de la suppression");
    }
  };

  const resetForm = () => {
    setEditingPoint(null);
    setShowForm(false);
    setSelectedCoords(null);
  };

  const startEdit = (point: GPSPoint) => {
    setEditingPoint(point);
    setSelectedCoords({ lat: point.latitude, lng: point.longitude });
    setMapCenter({ lat: point.latitude, lng: point.longitude });
    setShowForm(true);
  };

  const openMapSelector = useCallback(() => {
    console.log('openMapSelector called');
    setShowForm(true);
    setSelectedCoords(null);
  }, []);

  const generateLocationPlanHTML = (gpsPoints: GPSPoint[]) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan de Localisation - Chantier ${chantierId}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
            color: #111; 
            margin: 24px; 
            line-height: 1.6;
        }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: 600; margin-bottom: 8px; }
        .subtitle { color: #6b7280; font-size: 14px; }
        .points-list { margin-bottom: 30px; }
        .point { 
            background: #f9fafb; 
            border: 1px solid #e5e7eb; 
            border-radius: 8px; 
            padding: 16px; 
            margin-bottom: 12px; 
        }
        .point-header { 
            font-weight: 600; 
            font-size: 16px; 
            margin-bottom: 8px; 
            color: #1f2937;
        }
        .point-coords { 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
            color: #6b7280; 
            margin-bottom: 4px;
        }
        .map-link { 
            margin-top: 8px; 
        }
        .map-link a { 
            color: #2563eb; 
            text-decoration: none; 
            font-size: 14px; 
        }
        .map-link a:hover { 
            text-decoration: underline; 
        }
        .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            color: #6b7280; 
            font-size: 12px; 
        }
        @media print {
            body { margin: 10mm; }
            .point { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1 class="title">Plan de Localisation</h1>
        <p class="subtitle">Chantier ${chantierId} - Généré le ${dateStr}</p>
    </div>

    <div class="points-list">
        <h2 style="font-size: 18px; margin-bottom: 16px; color: #374151;">Points GPS (${gpsPoints.length})</h2>
        ${gpsPoints.map((point, index) => `
            <div class="point">
                <div class="point-header">
                    Point ${index + 1}
                </div>
                <div class="point-coords">
                    Latitude: ${point.latitude.toFixed(6)}<br>
                    Longitude: ${point.longitude.toFixed(6)}
                </div>
                <div class="map-link">
                    <a href="https://www.google.com/maps?q=${point.latitude},${point.longitude}" target="_blank">
                        Voir sur Google Maps
                    </a>
                </div>
            </div>
        `).join('')}
    </div>

    <div class="footer">
        <p>Document généré automatiquement par l'application Cubage</p>
    </div>
</body>
</html>`;
  };

  const exportLocationPlan = useCallback(() => {
    if (points.length === 0) {
      setError("Aucun point GPS à exporter");
      return;
    }

    const html = generateLocationPlanHTML(points);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `plan-localisation-chantier-${chantierId}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [points, chantierId]);

  // Exposer les fonctions dans window après qu'elles soient définies
  useEffect(() => {
    (window as any)[`gpsAddButton_${buttonKey}`] = openMapSelector;
    (window as any)[`gpsExportButton_${buttonKey}`] = exportLocationPlan;
    
    return () => {
      delete (window as any)[`gpsAddButton_${buttonKey}`];
      delete (window as any)[`gpsExportButton_${buttonKey}`];
    };
  }, [buttonKey, openMapSelector, exportLocationPlan]);

  if (loading) return <div className="text-center py-4">Chargement des points GPS...</div>;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Formulaire de sélection sur carte */}
      {showForm && (
        <div className="bg-white rounded-xl border shadow-sm p-4 max-w-md mx-auto">
          <h4 className="font-semibold mb-3 text-gray-700 text-center">
            {editingPoint ? "Modifier le point GPS" : "Sélectionner un point sur la carte"}
          </h4>
          
          <div className="space-y-4">
            {/* Carte intégrée */}
            <MapSelector
              center={mapCenter}
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedCoords}
            />

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="flex justify-center gap-2">
                <button
                  type="submit"
                  disabled={!selectedCoords}
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-4 py-2 text-sm disabled:bg-gray-800 disabled:cursor-not-allowed"
                >
                  {editingPoint ? "Modifier" : "Ajouter"}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Liste des points (miniatures) */}
      {points.length > 0 && (
        <div className="flex flex-wrap gap-4 justify-center">
          {points.map((point, index) => (
            <div key={point.id} className="flex flex-col items-center">
              <div className="w-32 h-32 relative group">
                <MiniMap
                  latitude={point.latitude}
                  longitude={point.longitude}
                  className="w-full h-full"
                />
                {/* Boutons qui apparaissent au survol uniquement sur la carte */}
                <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => startEdit(point)}
                    className="inline-flex items-center justify-center rounded-full text-black bg-white px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition hover:bg-gray-100"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(point.id)}
                    className="inline-flex items-center justify-center rounded-full text-black bg-white px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition hover:bg-gray-100"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}