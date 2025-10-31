import { useState, useEffect } from 'react';

const DEBARDEUR_STORAGE_KEY = 'selectedDebardeur';
const DEBARDEUR_DATE_KEY = 'selectedDebardeurDate';

export function useDebardeurSelection() {
  const [selectedDebardeur, setSelectedDebardeur] = useState<{
    id: string;
    firstName: string;
    lastName: string;
  } | null>(null);

  // Charger le débardeur sélectionné au montage du composant
  useEffect(() => {
    const storedDebardeur = localStorage.getItem(DEBARDEUR_STORAGE_KEY);
    const storedDate = localStorage.getItem(DEBARDEUR_DATE_KEY);
    const today = new Date().toDateString();

    // Si on a un débardeur stocké et que c'est pour aujourd'hui
    if (storedDebardeur && storedDate === today) {
      try {
        setSelectedDebardeur(JSON.parse(storedDebardeur));
      } catch (error) {
        console.error('Erreur lors du parsing du débardeur stocké:', error);
        // Nettoyer les données corrompues
        localStorage.removeItem(DEBARDEUR_STORAGE_KEY);
        localStorage.removeItem(DEBARDEUR_DATE_KEY);
      }
    } else {
      // Nettoyer les données d'hier
      localStorage.removeItem(DEBARDEUR_STORAGE_KEY);
      localStorage.removeItem(DEBARDEUR_DATE_KEY);
    }
  }, []);

  // Fonction pour sélectionner un débardeur
  const selectDebardeur = (debardeur: { id: string; firstName: string; lastName: string }) => {
    setSelectedDebardeur(debardeur);
    localStorage.setItem(DEBARDEUR_STORAGE_KEY, JSON.stringify(debardeur));
    localStorage.setItem(DEBARDEUR_DATE_KEY, new Date().toDateString());
  };

  // Fonction pour effacer la sélection
  const clearDebardeur = () => {
    setSelectedDebardeur(null);
    localStorage.removeItem(DEBARDEUR_STORAGE_KEY);
    localStorage.removeItem(DEBARDEUR_DATE_KEY);
  };

  return {
    selectedDebardeur,
    selectDebardeur,
    clearDebardeur,
  };
}
