// Script pour vider le cache et forcer la mise à jour
// À exécuter dans la console du navigateur

// Vider le cache du service worker
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name);
      console.log('Cache supprimé:', name);
    });
  });
}

// Désinscrire le service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister();
      console.log('Service Worker désinscrit');
    });
  });
}

// Vider le localStorage
localStorage.clear();
console.log('localStorage vidé');

console.log('Cache vidé ! Rechargez la page.');

