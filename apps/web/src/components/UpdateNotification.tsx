import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function UpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Vérifier s'il y a une nouvelle version du Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(registration => {
        // Vérifier les mises à jour toutes les 30 secondes
        setInterval(() => {
          registration.update();
        }, 30000);

        // Détecter quand un nouveau SW est en attente
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Une nouvelle version est disponible
                setShowUpdate(true);
              }
            });
          }
        });
      });

      // Détecter quand le SW prend le contrôle (après un refresh)
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration && registration.waiting) {
          // Dire au nouveau SW de prendre le contrôle immédiatement
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-slide-up">
      <div className="bg-blue-600 text-white rounded-lg shadow-lg p-4 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-semibold mb-1">Nouvelle version disponible</p>
          <p className="text-sm text-blue-100 mb-3">
            Une mise à jour de l'application est prête à être installée.
          </p>
          <button
            onClick={handleUpdate}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors"
          >
            Mettre à jour maintenant
          </button>
        </div>
      </div>
    </div>
  );
}

