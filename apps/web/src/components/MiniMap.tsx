import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MiniMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

function MapUpdater({ latitude, longitude }: { latitude: number; longitude: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([latitude, longitude], 15);
  }, [map, latitude, longitude]);
  
  return null;
}

export default function MiniMap({ latitude, longitude, className = "" }: MiniMapProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`bg-gray-200 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-xs">Chargement...</div>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
        zoomControl={false}
        dragging={false}
        touchZoom={false}
        doubleClickZoom={false}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapUpdater latitude={latitude} longitude={longitude} />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}
