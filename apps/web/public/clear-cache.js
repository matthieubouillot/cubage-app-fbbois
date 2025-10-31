// Script pour vider le cache et forcer la mise à jour
// À exécuter dans la console du navigateur

// Vider le cache du service worker
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
    });
  });
}

// Désinscrire le service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
    });
  });
}

// Vider le localStorage
localStorage.clear();


