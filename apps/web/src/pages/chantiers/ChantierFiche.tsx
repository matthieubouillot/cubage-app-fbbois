import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { fetchChantier, type ChantierDetail, fetchChantiers, type ChantierListItem, getChantierFiche, saveChantierFiche, type ChantierFicheData } from "../../features/chantiers/api";
import { listSaisies, type SaisieRow } from "../../features/saisies/api";
import { listUsers, type UserDTO } from "../../features/users/api";
import MobileBack from "../../components/MobileBack";

type TableRow = {
  scierie: string;
  lot: string; // Premier lot trouvé ou vide
  volume: number;
  entrepriseIds: string[]; // IDs des entreprises associées à cette scierie
};

type EntrepriseAbattageRow = {
  entrepriseId: string;
  entrepriseName: string;
  cubage: number; // Volume total de l'entreprise
  volAbattuPercent: number; // Pourcentage du volume total
  volAbattu: number; // Volume abattu (même que cubage pour l'instant)
  aFacturer: number;
  facture: number;
  solde: number;
};

type EntrepriseDebardageRow = {
  entrepriseId: string;
  entrepriseName: string;
  repartition: number; // Pourcentage du volume total
  volumeTotal: number;
  aFacturer: number;
  facture: number;
  solde: number;
};

type EntrepriseScierieData = {
  entrepriseId: string;
  entrepriseName: string;
  scierie: string;
  volumes: {
    abattage: number;
    debardage: number;
  };
};

type EntrepriseData = {
  entrepriseId: string;
  entrepriseName: string;
  scieries: EntrepriseScierieData[]; // Une entrée par scierie
  compteurGlobal: {
    anteriorite: number;
    ceChantier: number;
    solde: number;
  };
};

export default function ChantierFiche() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<ChantierDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [entrepriseAbattageData, setEntrepriseAbattageData] = useState<EntrepriseAbattageRow[]>([]);
  const [loadingEntrepriseAbattage, setLoadingEntrepriseAbattage] = useState(true);
  const [entrepriseDebardageData, setEntrepriseDebardageData] = useState<EntrepriseDebardageRow[]>([]);
  const [loadingEntrepriseDebardage, setLoadingEntrepriseDebardage] = useState(true);
  const [entrepriseData, setEntrepriseData] = useState<EntrepriseData[]>([]);
  const [loadingEntreprises, setLoadingEntreprises] = useState(true);
  const [users, setUsers] = useState<UserDTO[]>([]);
  // État pour les valeurs saisies manuellement dans "A facturer" (clé: entrepriseId_scierie)
  const [aFacturerValues, setAFacturerValues] = useState<Record<string, { abattage: string; debardage: string }>>({});
  // État pour les frais de gestion (clé: index de la ligne dans tableData)
  const [fraisGestionValues, setFraisGestionValues] = useState<Record<number, string>>({});
  // État pour le volume modifiable de la scierie "Moulin" (clé: index de la ligne dans tableData)
  const [volumeMoulinValues, setVolumeMoulinValues] = useState<Record<number, string>>({});
  // État pour les cases à cocher de facturation (clé: index de la ligne dans tableData)
  const [facturationValues, setFacturationValues] = useState<Record<number, boolean>>({});
  // État pour les prix UHT
  const [prixUHT, setPrixUHT] = useState<{ aba: string; deb: string }>({ aba: "", deb: "" });
  // État pour les antériorités par entreprise (clé: entrepriseId, valeur: { abattage: number, debardage: number })
  const [anteriorites, setAnteriorites] = useState<Record<string, { abattage: number; debardage: number }>>({});
  // État pour suivre si les données sont en cours de sauvegarde
  const [saving, setSaving] = useState(false);
  // Flag pour éviter de sauvegarder pendant le chargement initial
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Charger les données de la fiche chantier
  useEffect(() => {
    if (!id) return;

    async function loadFicheData() {
      if (!id) return;
      try {
        setIsInitialLoad(true);
        const ficheData = await getChantierFiche(id);
        if (ficheData) {
          setAFacturerValues(ficheData.aFacturerValues || {});
          // Convertir les clés numériques en nombres pour fraisGestionValues
          const fraisGestion: Record<number, string> = {};
          Object.keys(ficheData.fraisGestionValues || {}).forEach((key) => {
            const value = ficheData.fraisGestionValues[Number(key)];
            if (value !== undefined) {
              fraisGestion[Number(key)] = value;
            }
          });
          setFraisGestionValues(fraisGestion);
          setPrixUHT(ficheData.prixUHT || { aba: "", deb: "" });
          // Convertir les clés numériques en nombres pour volumeMoulinValues
          const volumeMoulin: Record<number, string> = {};
          Object.keys(ficheData.volumeMoulinValues || {}).forEach((key) => {
            const value = ficheData.volumeMoulinValues![Number(key)];
            if (value !== undefined) {
              volumeMoulin[Number(key)] = value;
            }
          });
          setVolumeMoulinValues(volumeMoulin);
          // Convertir les clés numériques en nombres pour facturationValues
          const facturation: Record<number, boolean> = {};
          if (ficheData.facturationValues) {
            Object.keys(ficheData.facturationValues).forEach((key) => {
              const value = ficheData.facturationValues![key];
              if (value !== undefined && value !== null) {
                const numKey = Number(key);
                if (!isNaN(numKey)) {
                  facturation[numKey] = Boolean(value);
                }
              }
            });
          }
          setFacturationValues(facturation);
        } else {
          // Initialiser avec des valeurs vides si la fiche n'existe pas encore
          setAFacturerValues({});
          setFraisGestionValues({});
          setPrixUHT({ aba: "", deb: "" });
          setVolumeMoulinValues({});
        }
      } catch (e) {
        console.error("Erreur lors du chargement de la fiche chantier:", e);
        // Initialiser avec des valeurs vides en cas d'erreur
        setAFacturerValues({});
        setFraisGestionValues({});
        setPrixUHT({ aba: "", deb: "" });
        setVolumeMoulinValues({});
      } finally {
        // Attendre un peu avant de permettre la sauvegarde pour éviter de sauvegarder les valeurs initiales
        setTimeout(() => {
          setIsInitialLoad(false);
        }, 500);
      }
    }

    loadFicheData();
  }, [id]);

  // Fonction pour sauvegarder les données de la fiche chantier
  const saveFicheData = useCallback(async () => {
    if (!id || isInitialLoad) return;

    try {
      setSaving(true);
      // Convertir les clés numériques en strings pour fraisGestionValues
      const fraisGestion: Record<string, string> = {};
      Object.keys(fraisGestionValues).forEach((key) => {
        fraisGestion[key] = fraisGestionValues[Number(key)];
      });

      // Convertir les clés numériques en strings pour volumeMoulinValues
      const volumeMoulin: Record<string, string> = {};
      Object.keys(volumeMoulinValues).forEach((key) => {
        volumeMoulin[key] = volumeMoulinValues[Number(key)];
      });

      // Convertir les clés numériques en strings pour facturationValues
      const facturation: Record<string, boolean> = {};
      Object.keys(facturationValues).forEach((key) => {
        facturation[key] = facturationValues[Number(key)];
      });

      await saveChantierFiche(id, {
        aFacturerValues: aFacturerValues || {},
        fraisGestionValues: fraisGestion,
        prixUHT: prixUHT || { aba: "", deb: "" },
        volumeMoulinValues: volumeMoulin,
        facturationValues: facturation,
      });
    } catch (e) {
      console.error("Erreur lors de la sauvegarde de la fiche chantier:", e);
    } finally {
      setSaving(false);
    }
    }, [id, aFacturerValues, fraisGestionValues, prixUHT, volumeMoulinValues, facturationValues, isInitialLoad]);

  // Sauvegarder automatiquement avec debounce (après 1 seconde d'inactivité)
  useEffect(() => {
    if (!id || isInitialLoad) return;

    const timeoutId = setTimeout(() => {
      saveFicheData();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [id, aFacturerValues, fraisGestionValues, prixUHT, volumeMoulinValues, facturationValues, saveFicheData, isInitialLoad]);

  // Charger les antériorités depuis les chantiers précédents
  useEffect(() => {
    if (!id || !data || !users.length || entrepriseData.length === 0) return;

    async function loadAnteriorites() {
      try {
        // Charger tous les chantiers
        const allChantiers = await fetchChantiers();
        
        // Trier par date de création (du plus récent au plus ancien)
        const sortedChantiers = [...allChantiers].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        // Trouver l'index du chantier actuel
        const currentIndex = sortedChantiers.findIndex((c) => c.id === id);
        if (currentIndex === -1) return;

        // Prendre les chantiers précédents (avant le chantier actuel)
        const previousChantiers = sortedChantiers.slice(currentIndex + 1);

        // Créer un map pour accéder rapidement aux entreprises des utilisateurs
        const userToCompanyMap = new Map<string, { id: string; name: string } | null>();
        users.forEach((user) => {
          if (user.company) {
            userToCompanyMap.set(user.id, {
              id: user.company.id,
              name: user.company.name,
            });
          } else {
            userToCompanyMap.set(user.id, null);
          }
        });

        // Map pour stocker les dernières antériorités trouvées par entreprise
        const anterioritesMap = new Map<string, { abattage: number; debardage: number }>();

        // Pour chaque entreprise du chantier actuel
        for (const entreprise of entrepriseData) {
          // Chercher dans les chantiers précédents
          for (const prevChantier of previousChantiers) {
            // Charger les détails du chantier précédent
            const prevChantierDetail = await fetchChantier(prevChantier.id);
            
            // Charger les saisies du chantier précédent
            const prevSaisies: SaisieRow[] = [];
            for (const qg of prevChantierDetail.qualityGroups || []) {
              const saisies = await listSaisies(prevChantier.id, qg.id);
              prevSaisies.push(...saisies);
            }

            // Vérifier si cette entreprise apparaît dans ce chantier précédent
            let entrepriseFound = false;
            let abattageVolume = 0;
            let debardageVolume = 0;

            for (const saisie of prevSaisies) {
              // Pour l'abattage
              if (saisie.user?.id) {
                const userCompany = userToCompanyMap.get(saisie.user.id);
                if (userCompany?.id === entreprise.entrepriseId) {
                  entrepriseFound = true;
                  abattageVolume += Number(saisie.volumeCalc) || 0;
                }
              }
              // Pour le débardage
              if (saisie.debardeur?.id) {
                const debardeurCompany = userToCompanyMap.get(saisie.debardeur.id);
                if (debardeurCompany?.id === entreprise.entrepriseId) {
                  entrepriseFound = true;
                  debardageVolume += Number(saisie.volumeCalc) || 0;
                }
              }
            }

            // Si l'entreprise est trouvée dans ce chantier précédent, calculer les soldes du compteur global
            if (entrepriseFound) {
              // Calculer les volumes pour cette entreprise dans le chantier précédent
              let prevAbattageVolume = 0;
              let prevDebardageVolume = 0;
              
              for (const saisie of prevSaisies) {
                if (saisie.user?.id) {
                  const userCompany = userToCompanyMap.get(saisie.user.id);
                  if (userCompany?.id === entreprise.entrepriseId) {
                    prevAbattageVolume += Number(saisie.volumeCalc) || 0;
                  }
                }
                if (saisie.debardeur?.id) {
                  const debardeurCompany = userToCompanyMap.get(saisie.debardeur.id);
                  if (debardeurCompany?.id === entreprise.entrepriseId) {
                    prevDebardageVolume += Number(saisie.volumeCalc) || 0;
                  }
                }
              }

              // Charger la fiche du chantier précédent pour récupérer les valeurs "A facturer"
              const prevFicheData = await getChantierFiche(prevChantier.id);
              const prevAFacturerValues = prevFicheData?.aFacturerValues || {};

              // Calculer le "Facturé" pour cette entreprise dans le chantier précédent
              // (somme des valeurs "abattage" et "debardage" dans aFacturerValues)
              let prevFactureAbattage = 0;
              let prevFactureDebardage = 0;
              
              Object.keys(prevAFacturerValues).forEach((key) => {
                if (key.startsWith(`${entreprise.entrepriseId}_`)) {
                  const value = prevAFacturerValues[key];
                  if (value) {
                    prevFactureAbattage += parseFloat(value.abattage || "0") || 0;
                    prevFactureDebardage += parseFloat(value.debardage || "0") || 0;
                  }
                }
              });

              // Calculer le solde du compteur global du chantier précédent
              // Solde = A facturer - Facturé = Vol abattu/débardé - Facturé
              const soldeAbattage = prevAbattageVolume - prevFactureAbattage;
              const soldeDebardage = prevDebardageVolume - prevFactureDebardage;

              // Ce solde devient l'antériorité pour le chantier actuel
              anterioritesMap.set(entreprise.entrepriseId, {
                abattage: soldeAbattage, // Solde du compteur global d'abattage du chantier précédent
                debardage: soldeDebardage, // Solde du compteur global de débardage du chantier précédent
              });
              break; // On prend le premier (le plus récent) chantier où l'entreprise apparaît
            }
          }
        }

        // Convertir le Map en objet
        const anterioritesObj: Record<string, { abattage: number; debardage: number }> = {};
        anterioritesMap.forEach((value, key) => {
          anterioritesObj[key] = value;
        });
        setAnteriorites(anterioritesObj);
      } catch (e) {
        console.error("Erreur lors du chargement des antériorités:", e);
      }
    }

    loadAnteriorites();
  }, [id, data, users, entrepriseData]);

  useEffect(() => {
    if (!id) {
      setErr("ID du chantier manquant");
      setLoading(false);
      return;
    }

    async function loadChantier() {
      if (!id) return;
      try {
        setLoading(true);
        setErr(null);
        const chantier = await fetchChantier(id);
        setData(chantier);
      } catch (e: any) {
        setErr(e.message || "Erreur lors du chargement du chantier");
      } finally {
        setLoading(false);
      }
    }

    loadChantier();
  }, [id]);

  // Charger la liste des utilisateurs avec leurs entreprises
  useEffect(() => {
    async function loadUsers() {
      try {
        const usersList = await listUsers();
        setUsers(usersList);
      } catch (e: any) {
        console.error("Erreur lors du chargement des utilisateurs:", e);
      }
    }
    loadUsers();
  }, []);

  // Fonction helper pour obtenir le volume correct d'une scierie (avec volume modifié si Moulin)
  const getVolumeForScierie = useCallback((scierieName: string, originalVolume: number, tableDataIndex?: number): number => {
    const isMoulin = scierieName.toLowerCase().includes("moulin");
    if (isMoulin && tableDataIndex !== undefined && volumeMoulinValues[tableDataIndex]) {
      // Normaliser la valeur (remplacer virgule par point pour le parsing)
      const normalizedValue = volumeMoulinValues[tableDataIndex].replace(',', '.');
      const modified = parseFloat(normalizedValue);
      return !isNaN(modified) ? modified : originalVolume;
    }
    return originalVolume;
  }, [volumeMoulinValues]);

  // Fonction helper pour obtenir le volume correct d'une scierie depuis tableData
  const getVolumeFromTableData = useCallback((scierieName: string): number => {
    const row = tableData.find(r => r.scierie === scierieName);
    if (!row) return 0;
    const index = tableData.findIndex(r => r.scierie === scierieName);
    return getVolumeForScierie(scierieName, row.volume, index);
  }, [tableData, getVolumeForScierie]);

  // Charger les données du tableau pour chaque qualityGroup
  useEffect(() => {
    if (!data || !id || users.length === 0) {
      setLoadingTable(false);
      return;
    }

    async function loadTableData() {
      if (!id || !data) return;
      try {
        setLoadingTable(true);
        const rows: TableRow[] = [];

        // Créer un map pour accéder rapidement aux entreprises des utilisateurs
        const userToCompanyMap = new Map<string, string | null>();
        users.forEach((user) => {
          if (user.company) {
            userToCompanyMap.set(user.id, user.company.id);
          } else {
            userToCompanyMap.set(user.id, null);
          }
        });

        // Map pour regrouper par scierie
        const scierieMap = new Map<string, { volume: number; entrepriseIds: Set<string>; lot: string }>();

        for (const qg of data.qualityGroups || []) {
          // Récupérer toutes les saisies pour ce qualityGroup
          const saisies = await listSaisies(id, qg.id);
          
          // Calculer le volume total
          const volumeTotal = saisies.reduce((sum, s: SaisieRow) => {
            return sum + (Number(s.volumeCalc) || 0);
          }, 0);

          // Récupérer le lot
          const lot = qg.lot || "";
          const scierieName = qg.scieur.name;

          // Collecter les IDs des entreprises associées à cette scierie
          const entrepriseIdsSet = new Set<string>();
          for (const saisie of saisies) {
            // Entreprise du bûcheron (user)
            if (saisie.user?.id) {
              const companyId = userToCompanyMap.get(saisie.user.id);
              if (companyId) {
                entrepriseIdsSet.add(companyId);
              }
            }
            // Entreprise du débardeur
            if (saisie.debardeur?.id) {
              const companyId = userToCompanyMap.get(saisie.debardeur.id);
              if (companyId) {
                entrepriseIdsSet.add(companyId);
              }
            }
          }

          // Regrouper par scierie
          const existing = scierieMap.get(scierieName);
          if (existing) {
            existing.volume += volumeTotal;
            entrepriseIdsSet.forEach(id => existing.entrepriseIds.add(id));
            // Garder le premier lot non vide trouvé
            if (!existing.lot && lot) {
              existing.lot = lot;
            }
          } else {
            scierieMap.set(scierieName, {
              volume: volumeTotal,
              entrepriseIds: new Set(entrepriseIdsSet),
              lot: lot,
            });
          }
        }

        // Convertir le map en tableau
        scierieMap.forEach((data, scierie) => {
          rows.push({
            scierie,
            lot: data.lot,
            volume: data.volume,
            entrepriseIds: Array.from(data.entrepriseIds),
          });
        });

        // Trier les lignes par scierie
        rows.sort((a, b) => a.scierie.localeCompare(b.scierie));

        setTableData(rows);
        
        // Recalculer les données d'entreprise si volumeMoulinValues change
        // (déclenché par le useEffect qui dépend de volumeMoulinValues)
      } catch (e: any) {
        console.error("Erreur lors du chargement des données du tableau:", e);
      } finally {
        setLoadingTable(false);
      }
    }

    loadTableData();
  }, [data, id, users]);

  // Charger les données par entreprise (abattage) - recalculé quand volumeMoulinValues change
  useEffect(() => {
    if (!data || !id || users.length === 0 || tableData.length === 0) {
      setLoadingEntrepriseAbattage(false);
      return;
    }

    async function loadEntrepriseAbattageData() {
      if (!id || !data) return;
      try {
        setLoadingEntrepriseAbattage(true);
        
        // Créer un map pour accéder rapidement aux entreprises des utilisateurs
        const userToCompanyMap = new Map<string, { id: string; name: string } | null>();
        users.forEach((user) => {
          if (user.company) {
            userToCompanyMap.set(user.id, {
              id: user.company.id,
              name: user.company.name,
            });
          } else {
            userToCompanyMap.set(user.id, null);
          }
        });

        // Créer un map scierie -> volume original et modifié
        const scierieOriginalVolumes = new Map<string, number>();
        const scierieModifiedVolumes = new Map<string, number>();
        tableData.forEach((row, idx) => {
          scierieOriginalVolumes.set(row.scierie, row.volume);
          const modified = getVolumeForScierie(row.scierie, row.volume, idx);
          scierieModifiedVolumes.set(row.scierie, modified);
        });

        // Étape 1 : Calculer les volumes originaux par entreprise (sans modification)
        const entrepriseOriginalVolumes = new Map<string, { name: string; volume: number }>();
        const scierieEntrepriseOriginalVolumes = new Map<string, Map<string, number>>(); // scierie -> entrepriseId -> volume

        // Parcourir tous les qualityGroups et leurs saisies pour calculer les volumes originaux
        for (const qg of data.qualityGroups || []) {
          const saisies = await listSaisies(id, qg.id);
          const scierieName = qg.scieur.name;
          
          if (!scierieEntrepriseOriginalVolumes.has(scierieName)) {
            scierieEntrepriseOriginalVolumes.set(scierieName, new Map());
          }
          const entrepriseVolumesForScierie = scierieEntrepriseOriginalVolumes.get(scierieName)!;
          
          for (const saisie of saisies) {
            if (saisie.user?.id) {
              const originalVolume = Number(saisie.volumeCalc) || 0;
              const userCompany = userToCompanyMap.get(saisie.user.id);
              
              if (userCompany) {
                // Volume original par entreprise pour cette scierie
                const existing = entrepriseVolumesForScierie.get(userCompany.id) || 0;
                entrepriseVolumesForScierie.set(userCompany.id, existing + originalVolume);
                
                // Volume total original par entreprise (toutes scieries)
                const entrepriseOriginal = entrepriseOriginalVolumes.get(userCompany.id);
                if (entrepriseOriginal) {
                  entrepriseOriginal.volume += originalVolume;
                } else {
                  entrepriseOriginalVolumes.set(userCompany.id, {
                    name: userCompany.name,
                    volume: originalVolume,
                  });
                }
              }
            }
          }
        }

        // Étape 2 : Appliquer les modifications de volume par scierie (proportionnellement pour Moulin)
        const entrepriseMap = new Map<string, { name: string; volume: number }>();
        
        // Initialiser avec les volumes originaux (toutes scieries)
        entrepriseOriginalVolumes.forEach((info, id) => {
          entrepriseMap.set(id, { ...info });
        });

        // Appliquer les modifications pour Moulin
        for (const [scierieName, entrepriseVolumes] of scierieEntrepriseOriginalVolumes.entries()) {
          const originalScierieVolume = scierieOriginalVolumes.get(scierieName) || 0;
          const modifiedScierieVolume = scierieModifiedVolumes.get(scierieName) || originalScierieVolume;
          const isMoulin = scierieName.toLowerCase().includes("moulin");
          
          if (isMoulin && originalScierieVolume > 0 && modifiedScierieVolume !== originalScierieVolume) {
            // Pour Moulin : redistribuer le nouveau volume total en gardant les proportions par entreprise
            const volumeRatio = modifiedScierieVolume / originalScierieVolume;
            
            entrepriseVolumes.forEach((originalVolume, entrepriseId) => {
              // Garder la proportion, appliquer au nouveau total
              const adjustedVolume = originalVolume * volumeRatio;
              const entrepriseInfo = entrepriseMap.get(entrepriseId);
              
              if (entrepriseInfo) {
                // Volume total ajusté = volume original total - volume original Moulin + volume ajusté Moulin
                const originalMoulinVolume = originalVolume;
                entrepriseInfo.volume = entrepriseInfo.volume - originalMoulinVolume + adjustedVolume;
              }
            });
          }
        }
        
        // Calculer le volume total final
        let totalVolume = 0;
        entrepriseMap.forEach((info) => {
          totalVolume += info.volume;
        });

        // Convertir en tableau avec pourcentages
        const rows: EntrepriseAbattageRow[] = Array.from(entrepriseMap.entries()).map(([id, data]) => ({
          entrepriseId: id,
          entrepriseName: data.name,
          cubage: data.volume,
          volAbattuPercent: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
          volAbattu: data.volume,
          aFacturer: 0, // À remplir plus tard
          facture: 0, // À remplir plus tard
          solde: 0, // À remplir plus tard
        }));

        // Trier par nom
        rows.sort((a, b) => a.entrepriseName.localeCompare(b.entrepriseName));

        setEntrepriseAbattageData(rows);
      } catch (e: any) {
        console.error("Erreur lors du chargement des données des entreprises (abattage):", e);
      } finally {
        setLoadingEntrepriseAbattage(false);
      }
    }

    loadEntrepriseAbattageData();
  }, [data, id, users, tableData, getVolumeForScierie]);

  // Charger les données par entreprise (débardage) - recalculé quand volumeMoulinValues change
  useEffect(() => {
    if (!data || !id || users.length === 0 || tableData.length === 0) {
      setLoadingEntrepriseDebardage(false);
      return;
    }

    async function loadEntrepriseDebardageData() {
      if (!id || !data) return;
      try {
        setLoadingEntrepriseDebardage(true);
        
        // Créer un map pour accéder rapidement aux entreprises des utilisateurs
        const userToCompanyMap = new Map<string, { id: string; name: string } | null>();
        users.forEach((user) => {
          if (user.company) {
            userToCompanyMap.set(user.id, {
              id: user.company.id,
              name: user.company.name,
            });
          } else {
            userToCompanyMap.set(user.id, null);
          }
        });

        // Créer un map scierie -> volume original et modifié
        const scierieOriginalVolumes = new Map<string, number>();
        const scierieModifiedVolumes = new Map<string, number>();
        tableData.forEach((row, idx) => {
          scierieOriginalVolumes.set(row.scierie, row.volume);
          const modified = getVolumeForScierie(row.scierie, row.volume, idx);
          scierieModifiedVolumes.set(row.scierie, modified);
        });

        // Étape 1 : Calculer les volumes originaux par entreprise (sans modification)
        const entrepriseOriginalVolumes = new Map<string, { name: string; volume: number }>();
        const scierieEntrepriseOriginalVolumes = new Map<string, Map<string, number>>(); // scierie -> entrepriseId -> volume

        // Parcourir tous les qualityGroups et leurs saisies pour calculer les volumes originaux
        for (const qg of data.qualityGroups || []) {
          const saisies = await listSaisies(id, qg.id);
          const scierieName = qg.scieur.name;
          
          if (!scierieEntrepriseOriginalVolumes.has(scierieName)) {
            scierieEntrepriseOriginalVolumes.set(scierieName, new Map());
          }
          const entrepriseVolumesForScierie = scierieEntrepriseOriginalVolumes.get(scierieName)!;
          
          for (const saisie of saisies) {
            if (saisie.debardeur?.id) {
              const originalVolume = Number(saisie.volumeCalc) || 0;
              const debardeurCompany = userToCompanyMap.get(saisie.debardeur.id);
              
              if (debardeurCompany) {
                // Volume original par entreprise pour cette scierie
                const existing = entrepriseVolumesForScierie.get(debardeurCompany.id) || 0;
                entrepriseVolumesForScierie.set(debardeurCompany.id, existing + originalVolume);
                
                // Volume total original par entreprise (toutes scieries)
                const entrepriseOriginal = entrepriseOriginalVolumes.get(debardeurCompany.id);
                if (entrepriseOriginal) {
                  entrepriseOriginal.volume += originalVolume;
                } else {
                  entrepriseOriginalVolumes.set(debardeurCompany.id, {
                    name: debardeurCompany.name,
                    volume: originalVolume,
                  });
                }
              }
            }
          }
        }

        // Étape 2 : Appliquer les modifications de volume par scierie (proportionnellement pour Moulin)
        const entrepriseMap = new Map<string, { name: string; volume: number }>();
        
        // Initialiser avec les volumes originaux (toutes scieries)
        entrepriseOriginalVolumes.forEach((info, id) => {
          entrepriseMap.set(id, { ...info });
        });

        // Appliquer les modifications pour Moulin
        for (const [scierieName, entrepriseVolumes] of scierieEntrepriseOriginalVolumes.entries()) {
          const originalScierieVolume = scierieOriginalVolumes.get(scierieName) || 0;
          const modifiedScierieVolume = scierieModifiedVolumes.get(scierieName) || originalScierieVolume;
          const isMoulin = scierieName.toLowerCase().includes("moulin");
          
          if (isMoulin && originalScierieVolume > 0 && modifiedScierieVolume !== originalScierieVolume) {
            // Pour Moulin : redistribuer le nouveau volume total en gardant les proportions par entreprise
            const volumeRatio = modifiedScierieVolume / originalScierieVolume;
            
            entrepriseVolumes.forEach((originalVolume, entrepriseId) => {
              // Garder la proportion, appliquer au nouveau total
              const adjustedVolume = originalVolume * volumeRatio;
              const entrepriseInfo = entrepriseMap.get(entrepriseId);
              
              if (entrepriseInfo) {
                // Volume total ajusté = volume original total - volume original Moulin + volume ajusté Moulin
                const originalMoulinVolume = originalVolume;
                entrepriseInfo.volume = entrepriseInfo.volume - originalMoulinVolume + adjustedVolume;
              }
            });
          }
        }
        
        // Calculer le volume total final
        let totalVolume = 0;
        entrepriseMap.forEach((info) => {
          totalVolume += info.volume;
        });

        // Convertir en tableau avec pourcentages
        const rows: EntrepriseDebardageRow[] = Array.from(entrepriseMap.entries()).map(([id, data]) => ({
          entrepriseId: id,
          entrepriseName: data.name,
          repartition: totalVolume > 0 ? (data.volume / totalVolume) * 100 : 0,
          volumeTotal: data.volume,
          aFacturer: 0, // À remplir plus tard
          facture: 0, // À remplir plus tard
          solde: 0, // À remplir plus tard
        }));

        // Trier par nom
        rows.sort((a, b) => a.entrepriseName.localeCompare(b.entrepriseName));

        setEntrepriseDebardageData(rows);
      } catch (e: any) {
        console.error("Erreur lors du chargement des données des entreprises (débardage):", e);
      } finally {
        setLoadingEntrepriseDebardage(false);
      }
    }

    loadEntrepriseDebardageData();
  }, [data, id, users, tableData, getVolumeForScierie]);

  // Charger les données par entreprise - recalculé quand volumeMoulinValues change
  useEffect(() => {
    if (!data || !id || users.length === 0 || tableData.length === 0) {
      setLoadingEntreprises(false);
      return;
    }

    async function loadEntrepriseData() {
      if (!id || !data) return;
      try {
        setLoadingEntreprises(true);
        
        // Créer un map pour accéder rapidement aux entreprises des utilisateurs
        const userToCompanyMap = new Map<string, { id: string; name: string } | null>();
        users.forEach((user) => {
          if (user.company) {
            userToCompanyMap.set(user.id, {
              id: user.company.id,
              name: user.company.name,
            });
          } else {
            userToCompanyMap.set(user.id, null);
          }
        });

        // Créer un map scierie -> volume original pour calculer le ratio de modification
        const scierieOriginalVolumes = new Map<string, number>();
        const scierieModifiedVolumes = new Map<string, number>();
        tableData.forEach((row, idx) => {
          scierieOriginalVolumes.set(row.scierie, row.volume);
          const modified = getVolumeForScierie(row.scierie, row.volume, idx);
          scierieModifiedVolumes.set(row.scierie, modified);
        });

        // Map pour regrouper par entreprise et scierie uniquement (clé: entrepriseId_scierie)
        const entrepriseScierieMap = new Map<string, EntrepriseScierieData>();
        // Map pour stocker les noms d'entreprise et calculer les totaux
        const entrepriseInfoMap = new Map<string, { name: string; totalAbattage: number; totalDebardage: number }>();

        // Étape 1 : Calculer les volumes originaux par entreprise et scierie (sans modification)
        const entrepriseScierieOriginalMap = new Map<string, { entrepriseId: string; entrepriseName: string; scierie: string; abattage: number; debardage: number }>(); // key: entrepriseId_scierie
        
        // Parcourir tous les qualityGroups et leurs saisies pour calculer les volumes originaux
        for (const qg of data.qualityGroups || []) {
          const saisies = await listSaisies(id, qg.id);
          const scierieName = qg.scieur.name;
          
          for (const saisie of saisies) {
            const originalVolume = Number(saisie.volumeCalc) || 0;
            
            // Volume abattage (utilisateur qui a fait la saisie)
            if (saisie.user?.id) {
              const userCompany = userToCompanyMap.get(saisie.user.id);
              if (userCompany) {
                const key = `${userCompany.id}_${scierieName}`;
                const existing = entrepriseScierieOriginalMap.get(key);
                if (existing) {
                  existing.abattage += originalVolume;
                } else {
                  entrepriseScierieOriginalMap.set(key, {
                    entrepriseId: userCompany.id,
                    entrepriseName: userCompany.name,
                    scierie: scierieName,
                    abattage: originalVolume,
                    debardage: 0,
                  });
                }
              }
            }
            
            // Volume débardage (débardeur associé)
            if (saisie.debardeur?.id) {
              const debardeurCompany = userToCompanyMap.get(saisie.debardeur.id);
              if (debardeurCompany) {
                const key = `${debardeurCompany.id}_${scierieName}`;
                const existing = entrepriseScierieOriginalMap.get(key);
                if (existing) {
                  existing.debardage += originalVolume;
                } else {
                  entrepriseScierieOriginalMap.set(key, {
                    entrepriseId: debardeurCompany.id,
                    entrepriseName: debardeurCompany.name,
                    scierie: scierieName,
                    abattage: 0,
                    debardage: originalVolume,
                  });
                }
              }
            }
          }
        }

        // Étape 2 : Appliquer les modifications pour Moulin (redistribuer proportionnellement)
        entrepriseScierieOriginalMap.forEach((originalData, key) => {
          const isMoulin = originalData.scierie.toLowerCase().includes("moulin");
          const originalScierieVolume = scierieOriginalVolumes.get(originalData.scierie) || 0;
          const modifiedScierieVolume = scierieModifiedVolumes.get(originalData.scierie) || originalScierieVolume;
          
          let adjustedVolumes = {
            abattage: originalData.abattage,
            debardage: originalData.debardage,
          };
          
          if (isMoulin && originalScierieVolume > 0 && modifiedScierieVolume !== originalScierieVolume) {
            // Pour Moulin : redistribuer proportionnellement
            const volumeRatio = modifiedScierieVolume / originalScierieVolume;
            adjustedVolumes = {
              abattage: originalData.abattage * volumeRatio,
              debardage: originalData.debardage * volumeRatio,
            };
          }
          
          // Ajouter au map final
          const finalKey = `${originalData.entrepriseId}_${originalData.scierie}`;
          const existing = entrepriseScierieMap.get(finalKey);
          if (existing) {
            existing.volumes.abattage += adjustedVolumes.abattage;
            existing.volumes.debardage += adjustedVolumes.debardage;
          } else {
            entrepriseScierieMap.set(finalKey, {
              entrepriseId: originalData.entrepriseId,
              entrepriseName: originalData.entrepriseName,
              scierie: originalData.scierie,
              volumes: adjustedVolumes,
            });
          }
          
          // Mettre à jour les totaux de l'entreprise
          const entrepriseInfo = entrepriseInfoMap.get(originalData.entrepriseId);
          if (entrepriseInfo) {
            entrepriseInfo.totalAbattage += adjustedVolumes.abattage;
            entrepriseInfo.totalDebardage += adjustedVolumes.debardage;
          } else {
            entrepriseInfoMap.set(originalData.entrepriseId, {
              name: originalData.entrepriseName,
              totalAbattage: adjustedVolumes.abattage,
              totalDebardage: adjustedVolumes.debardage,
            });
          }
        });

        // Grouper les scieries par entreprise
        const entrepriseScieriesMap = new Map<string, EntrepriseScierieData[]>();
        entrepriseScierieMap.forEach((scierieData) => {
          const existing = entrepriseScieriesMap.get(scierieData.entrepriseId);
          if (existing) {
            existing.push(scierieData);
          } else {
            entrepriseScieriesMap.set(scierieData.entrepriseId, [scierieData]);
          }
        });

        // Convertir en tableau et trier les scieries par nom (même ordre que dans le tableau "Répartition de la coupe par scierie")
        const rows: EntrepriseData[] = Array.from(entrepriseInfoMap.entries()).map(([entrepriseId, info]) => {
          const scieries = entrepriseScieriesMap.get(entrepriseId) || [];
          // Trier les scieries par nom
          scieries.sort((a, b) => a.scierie.localeCompare(b.scierie));
          
          return {
            entrepriseId,
            entrepriseName: info.name,
            scieries,
            compteurGlobal: {
              anteriorite: 0, // À remplir plus tard
              ceChantier: info.totalAbattage + info.totalDebardage, // Volume total du chantier
              solde: 0, // À remplir plus tard
            },
          };
        });

        // Trier par nom d'entreprise
        rows.sort((a, b) => a.entrepriseName.localeCompare(b.entrepriseName));

        setEntrepriseData(rows);
        
        // Initialiser les valeurs "A facturer" avec des chaînes vides pour la saisie manuelle (clé: entrepriseId_scierie)
        // Mais préserver les valeurs existantes si elles sont déjà chargées
        // Migration: convertir les anciennes clés (entrepriseId_scierie_produit) vers les nouvelles (entrepriseId_scierie)
        setAFacturerValues((prev) => {
          const initialValues: Record<string, { abattage: string; debardage: string }> = {};
          
          // D'abord, préserver toutes les valeurs existantes avec les nouvelles clés (entrepriseId_scierie)
          Object.keys(prev).forEach((key) => {
            const parts = key.split('_');
            // Si la clé a exactement 2 parties (entrepriseId_scierie), c'est une nouvelle clé, on la préserve
            if (parts.length === 2) {
              const existingValue = prev[key];
              if (existingValue && (existingValue.abattage || existingValue.debardage)) {
                initialValues[key] = {
                  abattage: existingValue.abattage || "",
                  debardage: existingValue.debardage || "",
                };
              }
            }
          });
          
          // Migrer les anciennes valeurs en les regroupant par entrepriseId_scierie
          const migratedValues = new Map<string, { abattage: number; debardage: number }>();
          Object.keys(prev).forEach((oldKey) => {
            const parts = oldKey.split('_');
            if (parts.length >= 3) {
              const entrepriseId = parts[0];
              const scierie = parts.slice(1, -1).join('_'); // Gérer les scieries avec underscores
              const newKey = `${entrepriseId}_${scierie}`;
              
              // Ne migrer que si la nouvelle clé n'existe pas déjà dans initialValues
              if (!initialValues[newKey]) {
                const oldValue = prev[oldKey];
                const existing = migratedValues.get(newKey);
                if (existing) {
                  existing.abattage += parseFloat(oldValue?.abattage || "0") || 0;
                  existing.debardage += parseFloat(oldValue?.debardage || "0") || 0;
                } else {
                  migratedValues.set(newKey, {
                    abattage: parseFloat(oldValue?.abattage || "0") || 0,
                    debardage: parseFloat(oldValue?.debardage || "0") || 0,
                  });
                }
              }
            }
          });
          
          // Convertir les valeurs migrées en chaînes (seulement si elles n'existent pas déjà)
          migratedValues.forEach((value, key) => {
            if (!initialValues[key]) {
              initialValues[key] = {
                abattage: value.abattage > 0 ? value.abattage.toFixed(3) : "",
                debardage: value.debardage > 0 ? value.debardage.toFixed(3) : "",
              };
            }
          });
          
          // Initialiser les nouvelles clés si elles n'existent pas
          rows.forEach((row) => {
            row.scieries.forEach((scierieData) => {
              const key = `${row.entrepriseId}_${scierieData.scierie}`;
              // Ne pas écraser si la valeur existe déjà
              if (!initialValues[key]) {
                initialValues[key] = {
                  abattage: "",
                  debardage: "",
                };
              } else {
                // S'assurer que les deux propriétés existent
                initialValues[key] = {
                  abattage: initialValues[key].abattage || "",
                  debardage: initialValues[key].debardage || "",
                };
              }
            });
          });
          return initialValues;
        });
      } catch (e: any) {
        console.error("Erreur lors du chargement des données par entreprise:", e);
      } finally {
        setLoadingEntreprises(false);
      }
    }

    loadEntrepriseData();
  }, [data, id, users, tableData, getVolumeForScierie]);

  // Fonction pour exporter la fiche en PDF
  const handleExportPDF = useCallback(() => {
    if (!data) return;
    
    // Date de fin = date du jour
    const dateFin = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Date de création formatée
    const dateCreation = new Date(data.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    
    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      console.error('Impossible d\'ouvrir une nouvelle fenêtre pour l\'impression');
      return;
    }
    
    // Générer le HTML de la fiche
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Fiche chantier ${data.numeroCoupe}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              color: #333;
            }
            h1 {
              text-align: center;
              font-size: 24px;
              margin-bottom: 30px;
            }
            h2 {
              font-size: 18px;
              margin-top: 20px;
              margin-bottom: 10px;
              text-align: center;
            }
            h3 {
              font-size: 16px;
              margin-top: 15px;
              margin-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 12px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-size: 11px;
              color: #666;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .info-value {
              font-size: 14px;
              font-weight: 500;
            }
            @media print {
              body {
                padding: 10px;
                margin: 0;
              }
              @page {
                margin: 10mm;
                @bottom-right {
                  content: counter(page) "/" counter(pages);
                  font-size: 10px;
                  color: #666;
                }
              }
            }
          </style>
        </head>
        <body>
          <h1>Fiche chantier ${data.numeroCoupe}</h1>
          
          <div class="info-grid">
            ${data.client ? `
              <div class="info-item">
                <div class="info-label">Client</div>
                <div class="info-value">${data.client.firstName} ${data.client.lastName}</div>
              </div>
            ` : ''}
            ${data.property?.commune ? `
              <div class="info-item">
                <div class="info-label">Commune</div>
                <div class="info-value">${data.property.commune}</div>
              </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Date de création</div>
              <div class="info-value">${dateCreation}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de fin de chantier</div>
              <div class="info-value">${dateFin}</div>
            </div>
          </div>
          
          ${prixUHT.aba || prixUHT.deb ? `
            <table style="width: auto; margin: 0 auto;">
              <thead>
                <tr>
                  <th></th>
                  <th>Aba</th>
                  <th>Deb</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Prix UHT (€)</td>
                  <td>${prixUHT.aba || "0.00"}</td>
                  <td>${prixUHT.deb || "0.00"}</td>
                </tr>
              </tbody>
            </table>
          ` : ''}
          
          ${tableData.length > 0 ? `
            <h2>Répartition de la coupe par scierie</h2>
            <table>
              <thead>
                <tr>
                  <th>Scierie</th>
                  <th>N° de lot</th>
                  <th>Vol. (m³)</th>
                  <th>Fact. Aba. (m³)</th>
                  <th>Fact. Deb. (m³)</th>
                  <th>R. Aba. (m³)</th>
                  <th>R. Deb. (m³)</th>
                  <th>Frais de gestion</th>
                </tr>
              </thead>
              <tbody>
                ${tableData.map((row, idx) => {
                  let factureAba = 0;
                  let factureDeb = 0;
                  // Pour chaque entreprise, récupérer la valeur pour cette scierie
                  for (const entrepriseId of row.entrepriseIds) {
                    const key = `${entrepriseId}_${row.scierie}`;
                    const values = aFacturerValues[key];
                    if (values) {
                      factureAba += parseFloat(values.abattage || "0") || 0;
                      factureDeb += parseFloat(values.debardage || "0") || 0;
                    }
                  }
                  // Utiliser le volume modifié pour "Moulin", sinon le volume original
                  const isMoulin = row.scierie.toLowerCase().includes("moulin");
                  let volumeValue = row.volume;
                  if (isMoulin && volumeMoulinValues[idx]) {
                    // Normaliser la valeur (remplacer virgule par point pour le parsing)
                    const normalizedValue = volumeMoulinValues[idx].replace(',', '.');
                    const parsed = parseFloat(normalizedValue);
                    if (!isNaN(parsed)) {
                      volumeValue = parsed;
                    }
                  }
                  const resteAba = Math.max(0, volumeValue - factureAba);
                  const resteDeb = Math.max(0, volumeValue - factureDeb);
                  const fraisGestion = fraisGestionValues[idx] || "0.00";
                  return `
                    <tr>
                      <td>${row.scierie}</td>
                      <td>${row.lot || "0"}</td>
                      <td>${volumeValue.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${factureAba.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${factureDeb.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${resteAba.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${resteDeb.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${fraisGestion}</td>
                    </tr>
                  `;
                }).join('')}
                ${tableData.length > 0 ? `
                  <tr>
                    <td></td>
                    <td></td>
                    <td style="font-weight: bold;">${(() => {
                      let total = 0;
                      tableData.forEach((row, idx) => {
                        const isMoulin = row.scierie.toLowerCase().includes("moulin");
                        let volumeValue = row.volume;
                        if (isMoulin && volumeMoulinValues[idx]) {
                          const normalizedValue = volumeMoulinValues[idx].replace(',', '.');
                          const parsed = parseFloat(normalizedValue);
                          if (!isNaN(parsed)) {
                            volumeValue = parsed;
                          }
                        }
                        total += volumeValue;
                      });
                      return total.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                    })()}</td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          ` : ''}
          
          ${entrepriseAbattageData.length > 0 ? `
            <h2>Abattage : répartition du volume par entreprise</h2>
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Vol. abattu (m³)</th>
                  <th>Vol. abattu (%)</th>
                  <th>A facturer (m³)</th>
                  <th>Facturé (m³)</th>
                  <th>Solde (m³)</th>
                </tr>
              </thead>
              <tbody>
                ${entrepriseAbattageData.map((row) => {
                  let facture = 0;
                  Object.keys(aFacturerValues).forEach((key) => {
                    if (key.startsWith(`${row.entrepriseId}_`)) {
                      facture += parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                    }
                  });
                  const aFacturer = row.cubage;
                  const solde = aFacturer - facture;
                  return `
                    <tr>
                      <td>${row.entrepriseName}</td>
                      <td>${row.cubage.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${row.volAbattuPercent.toFixed(2)}%</td>
                      <td>${aFacturer.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${facture.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${entrepriseDebardageData.length > 0 ? `
            <h2>Débardage : répartition du volume par entreprise</h2>
            <table>
              <thead>
                <tr>
                  <th>Entreprise</th>
                  <th>Vol. débardé (m³)</th>
                  <th>Vol. débardé (%)</th>
                  <th>A facturer (m³)</th>
                  <th>Facturé (m³)</th>
                  <th>Solde (m³)</th>
                </tr>
              </thead>
              <tbody>
                ${entrepriseDebardageData.map((row) => {
                  let facture = 0;
                  Object.keys(aFacturerValues).forEach((key) => {
                    if (key.startsWith(`${row.entrepriseId}_`)) {
                      facture += parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                    }
                  });
                  const aFacturer = row.volumeTotal;
                  const solde = aFacturer - facture;
                  return `
                    <tr>
                      <td>${row.entrepriseName}</td>
                      <td>${row.volumeTotal.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${row.repartition.toFixed(2)}%</td>
                      <td>${aFacturer.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${facture.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                      <td>${solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          ` : ''}
          
          ${entrepriseData.map((entreprise) => `
            <h2>${entreprise.entrepriseName}</h2>
            <h3 style="text-align: center;">A facturer</h3>
            <table>
              <thead>
                <tr>
                  <th>Scierie</th>
                  <th>Abattage (m³)</th>
                  <th>Débardage (m³)</th>
                </tr>
              </thead>
              <tbody>
                ${entreprise.scieries.map((scierieData) => {
                  const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                  return `
                    <tr>
                      <td>${scierieData.scierie}</td>
                      <td>${aFacturerValues[key]?.abattage || "0.000"}</td>
                      <td>${aFacturerValues[key]?.debardage || "0.000"}</td>
                    </tr>
                  `;
                }).join('')}
                ${entreprise.scieries.length > 0 ? `
                  <tr>
                    <td></td>
                    <td style="font-weight: bold;">${entreprise.scieries.reduce((sum, scierieData) => {
                      const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                      return sum + (parseFloat(aFacturerValues[key]?.abattage || "0") || 0);
                    }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                    <td style="font-weight: bold;">${entreprise.scieries.reduce((sum, scierieData) => {
                      const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                      return sum + (parseFloat(aFacturerValues[key]?.debardage || "0") || 0);
                    }, 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
            
            <h3 style="text-align: center;">Compteur global</h3>
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Antériorité (m³)</th>
                  <th>Ce chantier (m³)</th>
                  <th>Solde (m³)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Abattage</td>
                  <td>${(anteriorites[entreprise.entrepriseId]?.abattage || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  <td>${entrepriseAbattageData.find(r => r.entrepriseId === entreprise.entrepriseId) ? (() => {
                    const row = entrepriseAbattageData.find(r => r.entrepriseId === entreprise.entrepriseId)!;
                    let facture = 0;
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${entreprise.entrepriseId}_`)) {
                        facture += parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                      }
                    });
                    const solde = row.cubage - facture;
                    return solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                  })() : "0,000"}</td>
                  <td>${(() => {
                    const anteriorite = anteriorites[entreprise.entrepriseId]?.abattage || 0;
                    const row = entrepriseAbattageData.find(r => r.entrepriseId === entreprise.entrepriseId);
                    if (!row) return "0,000";
                    let facture = 0;
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${entreprise.entrepriseId}_`)) {
                        facture += parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                      }
                    });
                    const ceChantier = row.cubage - facture;
                    const solde = anteriorite + ceChantier;
                    return solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                  })()}</td>
                </tr>
                <tr>
                  <td>Débardage</td>
                  <td>${(anteriorites[entreprise.entrepriseId]?.debardage || 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  <td>${entrepriseDebardageData.find(r => r.entrepriseId === entreprise.entrepriseId) ? (() => {
                    const row = entrepriseDebardageData.find(r => r.entrepriseId === entreprise.entrepriseId)!;
                    let facture = 0;
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${entreprise.entrepriseId}_`)) {
                        facture += parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                      }
                    });
                    const solde = row.volumeTotal - facture;
                    return solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                  })() : "0,000"}</td>
                  <td>${(() => {
                    const anteriorite = anteriorites[entreprise.entrepriseId]?.debardage || 0;
                    const row = entrepriseDebardageData.find(r => r.entrepriseId === entreprise.entrepriseId);
                    if (!row) return "0,000";
                    let facture = 0;
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${entreprise.entrepriseId}_`)) {
                        facture += parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                      }
                    });
                    const ceChantier = row.volumeTotal - facture;
                    const solde = anteriorite + ceChantier;
                    return solde.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
                  })()}</td>
                </tr>
              </tbody>
            </table>
          `).join('')}
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Attendre que le contenu soit chargé
    printWindow.onload = () => {
      // Forcer le recalcul du contenu
      printWindow.document.body.style.display = 'none';
      printWindow.document.body.offsetHeight; // Trigger reflow
      printWindow.document.body.style.display = '';
      
      // Imprimer
      printWindow.print();
      
      // Fermer la fenêtre après impression
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
  }, [data, tableData, entrepriseData, entrepriseAbattageData, entrepriseDebardageData, aFacturerValues, fraisGestionValues, anteriorites]);

  if (loading) {
    return (
      <div className="px-4 py-6">
        <MobileBack fallback={id ? `/chantiers/${id}` : "/chantiers"} variant="fixed" className="md:block" />
        <div className="text-center text-gray-600">Chargement de la fiche chantier...</div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div className="px-4 py-6">
        <MobileBack fallback={id ? `/chantiers/${id}` : "/chantiers"} variant="fixed" className="md:block" />
        <div className="text-center text-red-600">{err || "Chantier introuvable"}</div>
      </div>
    );
  }

  // Date de fin = date du jour
  const dateFin = new Date().toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // Date de création formatée
  const dateCreation = new Date(data.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto">
      <MobileBack fallback={id ? `/chantiers/${id}` : "/chantiers"} variant="fixed" className="md:block" />
      
      {/* Titre centré avec bouton PDF */}
      <header className="text-center py-8">
        <h1 className="text-2xl md:text-3xl font-semibold mb-4">
          Fiche chantier {data.numeroCoupe}
        </h1>
        <button
          onClick={handleExportPDF}
          className="inline-flex items-center justify-center rounded-full text-red-600 px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition"
          aria-label="Exporter la fiche en PDF"
          title="Exporter la fiche en PDF"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
            <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 16v-5h2.2a2.5 2.5 0 0 1 0 5H8Z" stroke="currentColor" strokeWidth="2"/>
            <path d="M13 11h2.2a2 2 0 1 1 0 4H13v-4Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </header>

      {/* Section regroupée : Infos générales, Répartition de la coupe par scierie, Abattage et Débardage */}
      <div className="bg-white rounded-xl border shadow-sm p-6 mb-6">
        {/* Infos générales */}
        <h2 className="text-lg font-semibold mb-4 text-center">Infos générales</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {/* Client */}
          {data.client && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Client</div>
              <div className="font-medium text-base">
                {data.client.firstName} {data.client.lastName}
              </div>
            </div>
          )}

          {/* Commune */}
          {data.property?.commune && (
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Commune</div>
              <div className="font-medium text-base">{data.property.commune}</div>
            </div>
          )}

          {/* Date de création */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de création</div>
            <div className="font-medium text-base">{dateCreation}</div>
          </div>

          {/* Date de fin */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date de fin de chantier</div>
            <div className="font-medium text-base">{dateFin}</div>
          </div>
        </div>

        {/* Mini tableau Prix UHT */}
        <div className="mt-4 flex justify-center mb-6">
          <table className="border border-gray-200 rounded">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-1 px-2 font-medium text-gray-700 text-xs"></th>
                <th className="text-center py-1 px-2 font-medium text-gray-700 text-xs">Aba</th>
                <th className="text-center py-1 px-2 font-medium text-gray-700 text-xs">Deb</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-1 px-2 text-xs text-gray-500 uppercase tracking-wide">Prix UHT (€)</td>
                <td className="py-1 px-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={prixUHT.aba}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      setPrixUHT((prev) => ({ ...prev, aba: value }));
                    }}
                    placeholder="0.00"
                    className="w-16 text-right tabular-nums border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </td>
                <td className="py-1 px-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={prixUHT.deb}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      setPrixUHT((prev) => ({ ...prev, deb: value }));
                    }}
                    placeholder="0.00"
                    className="w-16 text-right tabular-nums border rounded px-1 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Répartition par scierie */}
        <div className="overflow-hidden mt-6">
        <h2 className="text-lg font-semibold mb-4 text-center">Répartition de la coupe par scierie</h2>
        
        {/* Tableau */}
        <div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">Scierie</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">N° de lot</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">Vol. (m³)</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">Fact. Aba. (m³)</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">Fact. Deb. (m³)</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">R. Aba. (m³)</th>
                <th className="text-center py-2 px-2 font-medium text-gray-700 text-xs whitespace-nowrap">R. Deb. (m³)</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 text-xs whitespace-nowrap">Frais de gestion</th>
                <th className="text-center py-2 px-1 font-medium text-gray-700 text-xs whitespace-nowrap">Facturation</th>
              </tr>
            </thead>
            <tbody>
              {loadingTable ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500 text-sm">
                    Chargement...
                  </td>
                </tr>
              ) : tableData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-4 text-center text-gray-500 text-sm">
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                tableData.map((row, index) => {
                  // Calculer les sommes pour cette ligne (cette scierie)
                  // On doit sommer toutes les valeurs pour cette scierie, tous produits confondus
                  let factureAba = 0;
                  let factureDeb = 0;
                  
                  // Pour chaque entreprise associée à cette scierie, récupérer toutes les valeurs pour cette scierie
                  // (tous produits confondus)
                  for (const entrepriseId of row.entrepriseIds) {
                  // Récupérer la valeur pour cette scierie
                  const key = `${entrepriseId}_${row.scierie}`;
                  const values = aFacturerValues[key];
                  if (values) {
                    factureAba += parseFloat(values.abattage || "0") || 0;
                    factureDeb += parseFloat(values.debardage || "0") || 0;
                  }
                  }

                  // Utiliser le volume modifié pour "Moulin", sinon le volume original
                  const isMoulin = row.scierie.toLowerCase().includes("moulin");
                  let volumeValue = row.volume;
                  if (isMoulin && volumeMoulinValues[index]) {
                    // Normaliser la valeur (remplacer virgule par point pour le parsing)
                    const normalizedValue = volumeMoulinValues[index].replace(',', '.');
                    const parsed = parseFloat(normalizedValue);
                    if (!isNaN(parsed)) {
                      volumeValue = parsed;
                    }
                  }

                  // Calculer les restes avec le volume (modifié ou original)
                  const resteAba = Math.max(0, volumeValue - factureAba);
                  const resteDeb = Math.max(0, volumeValue - factureDeb);

                  return (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="py-2 px-3">{row.scierie}</td>
                      <td className="py-2 px-3">{row.lot || "0"}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {isMoulin ? (
                          <input
                            type="text"
                            value={volumeMoulinValues[index] !== undefined 
                              ? volumeMoulinValues[index] 
                              : row.volume.toLocaleString("fr-FR", {
                                  minimumFractionDigits: 3,
                                  maximumFractionDigits: 3,
                                })
                            }
                            onChange={(e) => {
                              setVolumeMoulinValues((prev) => ({ ...prev, [index]: e.target.value }));
                            }}
                            onBlur={() => {
                              // Sauvegarder automatiquement quand on quitte le champ
                              saveFicheData();
                            }}
                            className="w-24 text-right tabular-nums border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                            placeholder={row.volume.toLocaleString("fr-FR", {
                              minimumFractionDigits: 3,
                              maximumFractionDigits: 3,
                            })}
                          />
                        ) : (
                          volumeValue.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })
                        )}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {factureAba.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {factureDeb.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {resteAba.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {resteDeb.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-1">
                        <input
                          type="text"
                          value={fraisGestionValues[index] || ""}
                          onChange={(e) => {
                            setFraisGestionValues((prev) => ({ ...prev, [index]: e.target.value }));
                          }}
                          placeholder="0.00"
                          className="w-16 text-right tabular-nums border rounded px-1 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-black/20"
                        />
                      </td>
                      <td className="py-2 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={facturationValues[index] || false}
                          onChange={async (e) => {
                            const newValue = e.target.checked;
                            const updated = { ...facturationValues, [index]: newValue };
                            setFacturationValues(updated);
                            // Sauvegarder immédiatement
                            if (!isInitialLoad && id) {
                              try {
                                setSaving(true);
                                // Convertir les clés numériques en strings pour l'API
                                const facturation: Record<string, boolean> = {};
                                // Utiliser Object.keys pour obtenir toutes les clés (qui seront des strings)
                                Object.keys(updated).forEach((keyStr) => {
                                  const numKey = Number(keyStr);
                                  if (!isNaN(numKey) && updated[numKey] !== undefined) {
                                    facturation[keyStr] = updated[numKey];
                                  }
                                });
                                const fraisGestion: Record<string, string> = {};
                                Object.keys(fraisGestionValues).forEach((key) => {
                                  fraisGestion[key] = fraisGestionValues[Number(key)];
                                });
                                const volumeMoulin: Record<string, string> = {};
                                Object.keys(volumeMoulinValues).forEach((key) => {
                                  volumeMoulin[key] = volumeMoulinValues[Number(key)];
                                });
                                const saved = await saveChantierFiche(id, {
                                  aFacturerValues: aFacturerValues || {},
                                  fraisGestionValues: fraisGestion,
                                  prixUHT: prixUHT || { aba: "", deb: "" },
                                  volumeMoulinValues: volumeMoulin,
                                  facturationValues: facturation,
                                });
                                // Recharger les données sauvegardées pour s'assurer de la cohérence
                                if (saved.facturationValues) {
                                  const reloaded: Record<number, boolean> = {};
                                  Object.keys(saved.facturationValues).forEach((key) => {
                                    const numKey = Number(key);
                                    if (!isNaN(numKey)) {
                                      reloaded[numKey] = Boolean(saved.facturationValues![key]);
                                    }
                                  });
                                  setFacturationValues(reloaded);
                                }
                              } catch (error) {
                                console.error("Erreur lors de la sauvegarde de la facturation:", error);
                              } finally {
                                setSaving(false);
                              }
                            }
                          }}
                          className="h-4 w-4 accent-black cursor-pointer"
                          title="Facturation effectuée"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
              {/* Ligne de total */}
              {!loadingTable && tableData.length > 0 && (
                <tr className="border-b border-gray-100">
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold">
                    {tableData.reduce((sum, row, idx) => {
                      const isMoulin = row.scierie.toLowerCase().includes("moulin");
                      let volumeValue = row.volume;
                      if (isMoulin && volumeMoulinValues[idx]) {
                        // Normaliser la valeur (remplacer virgule par point pour le parsing)
                        const normalizedValue = volumeMoulinValues[idx].replace(',', '.');
                        const parsed = parseFloat(normalizedValue);
                        if (!isNaN(parsed)) {
                          volumeValue = parsed;
                        }
                      }
                      return sum + volumeValue;
                    }, 0).toLocaleString("fr-FR", {
                      minimumFractionDigits: 3,
                      maximumFractionDigits: 3,
                    })}
                  </td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-3"></td>
                  <td className="py-2 px-1"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Répartition par entreprise (abattage) */}
        <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-center">Abattage : répartition du volume par entreprise</h2>
        
        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Entreprise</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Vol. abattu (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Vol. abattu (%)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">A facturer (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Facturé (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Solde (m³)</th>
              </tr>
            </thead>
            <tbody>
              {loadingEntrepriseAbattage ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 text-sm">
                    Chargement...
                  </td>
                </tr>
              ) : entrepriseAbattageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 text-sm">
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                entrepriseAbattageData.map((row) => {
                  // Calculer la somme des valeurs "abattage" saisies pour toutes les scieries/produits de cette entreprise
                  let facture = 0;
                  Object.keys(aFacturerValues).forEach((key) => {
                    if (key.startsWith(`${row.entrepriseId}_`)) {
                      const value = parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                      facture += value;
                    }
                  });

                  // A facturer = Vol abattu (m³)
                  const aFacturer = row.cubage;
                  // Solde = A facturer - Facturé
                  const solde = aFacturer - facture;

                  return (
                    <tr key={row.entrepriseId} className="border-b border-gray-100">
                      <td className="py-2 px-3">{row.entrepriseName}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {row.cubage.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {row.volAbattuPercent.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {aFacturer.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {facture.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {solde.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Répartition par entreprise (débardage) */}
        <div className="mt-6">
        <h2 className="text-lg font-semibold mb-4 text-center">Débardage : répartition du volume par entreprise</h2>
        
        {/* Tableau */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 font-medium text-gray-700">Entreprise</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Vol. débardé (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Vol. débardé (%)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">A facturer (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Facturé (m³)</th>
                <th className="text-right py-2 px-3 font-medium text-gray-700">Solde (m³)</th>
              </tr>
            </thead>
            <tbody>
              {loadingEntrepriseDebardage ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 text-sm">
                    Chargement...
                  </td>
                </tr>
              ) : entrepriseDebardageData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-500 text-sm">
                    Aucune donnée
                  </td>
                </tr>
              ) : (
                entrepriseDebardageData.map((row) => {
                  // Calculer la somme des valeurs "debardage" saisies pour toutes les scieries/produits de cette entreprise
                  let facture = 0;
                  Object.keys(aFacturerValues).forEach((key) => {
                    if (key.startsWith(`${row.entrepriseId}_`)) {
                      const value = parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                      facture += value;
                    }
                  });

                  // A facturer = Vol débardé (m³)
                  const aFacturer = row.volumeTotal;
                  // Solde = A facturer - Facturé
                  const solde = aFacturer - facture;

                  return (
                    <tr key={row.entrepriseId} className="border-b border-gray-100">
                      <td className="py-2 px-3">{row.entrepriseName}</td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {row.volumeTotal.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {row.repartition.toFixed(2)}%
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {aFacturer.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {facture.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
                        {solde.toLocaleString("fr-FR", {
                          minimumFractionDigits: 3,
                          maximumFractionDigits: 3,
                        })}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        </div>
      </div>

      {/* Répartition par entreprise */}
      {loadingEntreprises ? (
        <div className="bg-white rounded-xl border shadow-sm p-6 mt-6">
          <div className="text-center text-gray-500 text-sm">Chargement des données par entreprise...</div>
        </div>
      ) : entrepriseData.length > 0 && entrepriseData.map((entreprise) => (
        <div key={entreprise.entrepriseId} className="bg-white rounded-xl border shadow-sm p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4 text-center">{entreprise.entrepriseName}</h2>
          
          {/* Sous-titre A FACTURER */}
          <h3 className="text-base font-semibold mb-3 mt-6 text-center">A facturer</h3>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Scierie</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Abattage (m³)</th>
                  <th className="text-center py-2 px-3 font-medium text-gray-700">Débardage (m³)</th>
                </tr>
              </thead>
              <tbody>
                {entreprise.scieries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-gray-500 text-sm">
                      Aucune scierie
                    </td>
                  </tr>
                ) : (
                  entreprise.scieries.map((scierieData) => {
                    const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                    const hasAbattage = scierieData.volumes.abattage > 0;
                    const hasDebardage = scierieData.volumes.debardage > 0;
                    
                    return (
                      <tr key={key} className="border-b border-gray-100">
                        <td className="py-2 px-3">{scierieData.scierie}</td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={aFacturerValues[key]?.abattage || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                              setAFacturerValues((prev) => ({
                                ...prev,
                                [key]: {
                                  abattage: value,
                                  debardage: prev[key]?.debardage || "",
                                },
                              }));
                            }}
                            onBlur={() => {
                              // Sauvegarder automatiquement quand on quitte le champ
                              saveFicheData();
                            }}
                            disabled={!hasAbattage}
                            placeholder="0.000"
                            className={`w-20 text-right tabular-nums border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-black/20 ${
                              !hasAbattage ? "bg-gray-100 cursor-not-allowed opacity-50" : ""
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={aFacturerValues[key]?.debardage || ""}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                              setAFacturerValues((prev) => ({
                                ...prev,
                                [key]: {
                                  abattage: prev[key]?.abattage || "",
                                  debardage: value,
                                },
                              }));
                            }}
                            onBlur={() => {
                              // Sauvegarder automatiquement quand on quitte le champ
                              saveFicheData();
                            }}
                            disabled={!hasDebardage}
                            placeholder="0.000"
                            className={`w-20 text-right tabular-nums border rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-2 focus:ring-black/20 ${
                              !hasDebardage ? "bg-gray-100 cursor-not-allowed opacity-50" : ""
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
                {/* Ligne de total */}
                {entreprise.scieries.length > 0 && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 px-3"></td>
                    <td className="py-2 px-3 text-center tabular-nums font-semibold">
                      {entreprise.scieries.reduce((sum, scierieData) => {
                        const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                        const value = parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                        return sum + value;
                      }, 0).toLocaleString("fr-FR", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums font-semibold">
                      {entreprise.scieries.reduce((sum, scierieData) => {
                        const key = `${entreprise.entrepriseId}_${scierieData.scierie}`;
                        const value = parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                        return sum + value;
                      }, 0).toLocaleString("fr-FR", {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Sous-titre COMPTEUR GLOBAL */}
          <h3 className="text-base font-semibold mb-3 text-center">Compteur global</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3 font-medium text-gray-700">Type</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Antériorité (m³)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Ce chantier (m³)</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-700">Solde (m³)</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  // Trouver la ligne correspondante dans entrepriseAbattageData pour cette entreprise
                  const abattageRow = entrepriseAbattageData.find((row) => row.entrepriseId === entreprise.entrepriseId);
                  // Calculer le solde pour l'abattage
                  let factureAbattage = 0;
                  if (abattageRow) {
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${abattageRow.entrepriseId}_`)) {
                        const value = parseFloat(aFacturerValues[key]?.abattage || "0") || 0;
                        factureAbattage += value;
                      }
                    });
                  }
                  const soldeAbattage = abattageRow ? abattageRow.cubage - factureAbattage : 0;
                  const anterioriteAbattage = anteriorites[entreprise.entrepriseId]?.abattage || 0;
                  const soldeTotalAbattage = anterioriteAbattage + soldeAbattage;

                  // Trouver la ligne correspondante dans entrepriseDebardageData pour cette entreprise
                  const debardageRow = entrepriseDebardageData.find((row) => row.entrepriseId === entreprise.entrepriseId);
                  // Calculer le solde pour le débardage
                  let factureDebardage = 0;
                  if (debardageRow) {
                    Object.keys(aFacturerValues).forEach((key) => {
                      if (key.startsWith(`${debardageRow.entrepriseId}_`)) {
                        const value = parseFloat(aFacturerValues[key]?.debardage || "0") || 0;
                        factureDebardage += value;
                      }
                    });
                  }
                  const soldeDebardage = debardageRow ? debardageRow.volumeTotal - factureDebardage : 0;
                  const anterioriteDebardage = anteriorites[entreprise.entrepriseId]?.debardage || 0;
                  const soldeTotalDebardage = anterioriteDebardage + soldeDebardage;

                  return (
                    <>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3">Abattage</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {anterioriteAbattage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {soldeAbattage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {soldeTotalAbattage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                      </tr>
                      <tr className="border-b border-gray-100">
                        <td className="py-2 px-3">Débardage</td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {anterioriteDebardage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {soldeDebardage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                        <td className="py-2 px-3 text-right tabular-nums">
                          {soldeTotalDebardage.toLocaleString("fr-FR", {
                            minimumFractionDigits: 3,
                            maximumFractionDigits: 3,
                          })}
                        </td>
                      </tr>
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

