import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Map, FileText } from "lucide-react";

import {
  fetchChantier,
  type ChantierDetail,
} from "../../features/chantiers/api";
import { fetchGPSPoints } from "../../features/gps-points/api";
import { getSaisiesStats, listSaisies, type SaisieStats, type SaisieRow } from "../../features/saisies/api";
import { getUser, type User, isSuperviseur, canRead } from "../../features/auth/auth";

import ChipTabs from "../../components/ChipTabs";
import StatsTable from "../../components/StatsTable";
import SaisieTab from "./SaisieTab";
import MobileBack from "../../components/MobileBack";
import GPSPointsManager from "../../components/GPSPointsManager";

type Tab = { id: string; label: string; hint?: string };

export default function ChantierDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<ChantierDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState<string | null>(null);
  const [stats, setStats] = useState<SaisieStats | null>(null);
  const [globalStats, setGlobalStats] = useState<SaisieStats | null>(null);
  const [userStats, setUserStats] = useState<SaisieStats | null>(null);
  const [todayUser, setTodayUser] = useState<{
    ltV1: number;
    between: number;
    geV2: number;
    total: number;
  } | null>(null);
  const [perUserTotals, setPerUserTotals] = useState<
    | {
        users: { user: User; values: Record<string, number>; total: number }[];
        columns: { key: string; label: string }[];
        grandTotal: number;
      }
    | null
  >(null);

  // Mobile: cacher totaux/seuils par défaut, mémoriser dans le hash
  const [showStatsMobile, setShowStatsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash.includes("stats=1");
  });
  const [gpsPointsCount, setGpsPointsCount] = useState(0);
  const [hasGpsPoints, setHasGpsPoints] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Tick de mutations (add/edit/delete) pour recharger les stats
  const [mutTick, setMutTick] = useState(0);
  const onMutated = () => setMutTick((t) => t + 1);

  useEffect(() => {
    (async () => {
      try {
        const d = await fetchChantier(id!);
        setData(d);
      } catch (e: any) {
        setErr(e.message || "Erreur");
      }
    })();
  }, [id]);

  useEffect(() => {
    const onReconnected = () => {
      if (id) {
        fetchChantier(id).then(setData).catch(() => {});
      }
    };
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    
    window.addEventListener("cubage:reconnected", onReconnected as any);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    
    return () => {
      window.removeEventListener("cubage:reconnected", onReconnected as any);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [id]);

  const tabs = useMemo<Tab[]>(() => {
    if (!data || !data.qualityGroups) return [];
    return data.qualityGroups.map((qg) => ({
      id: `qg_${qg.id}`,
      label: `${qg.essences.map(e => e.name).join(' + ')} ${qg.qualite.name} ${qg.scieur.name}`,
      hint: undefined,
    }));
  }, [data]);

  useEffect(() => {
    if (!active && tabs.length > 0) {
      const raw = window.location.hash?.replace("#", "");
      const found = tabs.find(
        (t) => raw === t.id || raw?.startsWith(`${t.id}&`),
      );
      setActive(found?.id ?? tabs[0].id);
    }
  }, [tabs, active]);

  const activeQualityGroup = useMemo(() => {
    if (!data || !active) return null;
    const qgid = active.replace(/^qg_/, "");
    return data.qualityGroups.find((qg) => qg.id === qgid) || null;
  }, [data, active]);

  useEffect(() => {
    (async () => {
      if (!data || !activeQualityGroup) {
        setStats(null);
        setGlobalStats(null);
        setUserStats(null);
        setTodayUser(null);
        return;
      }
      try {
        const s = await getSaisiesStats(
          data.id,
          activeQualityGroup.id,
          activeQualityGroup.pourcentageEcorce ?? 0,
        );
        setStats(s);
        
        // Récupérer les statistiques globales pour les bûcherons
        const currentUser = getUser();
        if (currentUser?.roles.includes("BUCHERON") && !currentUser?.roles.includes("SUPERVISEUR")) {
          try {
            const gs = await getSaisiesStats(
              data.id,
              activeQualityGroup.id,
              activeQualityGroup.pourcentageEcorce ?? 0,
              true, // global = true
            );
            setGlobalStats(gs);
          } catch {
            setGlobalStats(null);
          }
        } else {
          setGlobalStats(s); // Les superviseurs voient déjà les stats globales
        }
        
        // Récupérer les rows pour les calculs suivants
        const rows = await listSaisies(data.id, activeQualityGroup.id);
        const current = getUser();
        const toLocalYmd = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}`;
        };
        const todayYmd = toLocalYmd(new Date());
        let tLt = 0, tBt = 0, tGe = 0;
        for (const r of rows as SaisieRow[]) {
          if (current && r.user?.id === current.id) {
            const rowYmd = toLocalYmd(new Date(r.date));
            if (rowYmd === todayYmd) {
              const vol = Number(r.volumeCalc) || 0;
              if (vol < 0.25) tLt += vol;
              else if (vol < 0.5) tBt += vol;
              else tGe += vol;
            }
          }
        }
        setTodayUser({
          ltV1: tLt,
          between: tBt,
          geV2: tGe,
          total: tLt + tBt + tGe,
        });

        // Calculer les statistiques du bûcheron connecté
        if (currentUser && rows.length > 0) {
          let userLtV1 = 0, userBetween = 0, userGeV2 = 0;
          let userLtV1Count = 0, userBetweenCount = 0, userGeV2Count = 0;
          
          for (const r of rows as SaisieRow[]) {
            if (r.user?.id === currentUser.id) {
              // Utiliser la même logique que getSaisiesStatsOffline
              let a = Number(r.volLtV1 || 0);
              let b = Number(r.volBetweenV1V2 || 0);
              let c = Number(r.volGeV2 || 0);
              
              if (!a && !b && !c && activeQualityGroup?.pourcentageEcorce != null) {
                const dM = Math.max(0, Number(r.diametre)) / 100;
                const base = Math.PI * Math.pow(dM / 2, 2) * Math.max(0, Number(r.longueur));
                const factor = 1 - Math.max(0, Math.min(100, activeQualityGroup.pourcentageEcorce)) / 100;
                const vol = base * factor;
                if (vol < 0.25) a = vol;
                else if (vol < 0.5) b = vol;
                else c = vol;
              }
              
              if (a > 0) userLtV1Count += 1;
              if (b > 0) userBetweenCount += 1;
              if (c > 0) userGeV2Count += 1;
              
              userLtV1 += a;
              userBetween += b;
              userGeV2 += c;
            }
          }
          
          const userTotal = userLtV1 + userBetween + userGeV2;
          const userTotalCount = userLtV1Count + userBetweenCount + userGeV2Count;
          setUserStats({
            columns: {
              ltV1: { sum: userLtV1, count: userLtV1Count, avg: userLtV1Count ? userLtV1 / userLtV1Count : 0 },
              between: { sum: userBetween, count: userBetweenCount, avg: userBetweenCount ? userBetween / userBetweenCount : 0 },
              geV2: { sum: userGeV2, count: userGeV2Count, avg: userGeV2Count ? userGeV2 / userGeV2Count : 0 },
            },
            total: { sum: userTotal, count: userTotalCount, avg: userTotalCount ? userTotal / userTotalCount : 0 },
          });
        } else {
          setUserStats(null);
        }

        // Supervisor aggregation across all qualites of this chantier
        // Build columns from chantier qualites (essence + qualité name + scieur)
        const columns = (data.qualityGroups || []).map((qg) => ({
          key: qg.id,
          label: `${qg.essences.map(e => e.name).join(' + ')} ${qg.qualite.name} ${qg.scieur.name}`,
        }));
        // For each qualite, fetch rows and aggregate by user
        const userMap: Record<string, { user: User; values: Record<string, number>; total: number }> = {};
        let grand = 0;
        for (const qg of (data.qualityGroups || [])) {
          const qRows = await listSaisies(data.id, qg.id);
          for (const r of qRows as SaisieRow[]) {
            const uid = r.user?.id;
            if (!uid || !r.user) continue;
            const vol = Number(r.volumeCalc) || 0;
            grand += vol;
            if (!userMap[uid]) {
              userMap[uid] = { user: r.user as User, values: {}, total: 0 };
            }
            userMap[uid].values[qg.id] = (userMap[uid].values[qg.id] || 0) + vol;
            userMap[uid].total += vol;
          }
        }
        const users = Object.values(userMap).sort((a, b) =>
          (a.user.lastName || "").localeCompare(b.user.lastName || "")
        );
        setPerUserTotals({ users, columns, grandTotal: grand });
      } catch {
        setStats(null);
        setTodayUser(null);
      }
    })();

    // Vérifier si le qualityGroup actuel a des points GPS
    (async () => {
      if (activeQualityGroup && data) {
        try {
          const points = await fetchGPSPoints(data.id, activeQualityGroup.id);
          setHasGpsPoints(points.length > 0);
        } catch {
          setHasGpsPoints(false);
        }
      }
    })();
  }, [data, activeQualityGroup, mutTick]);

  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!data) return <div className="p-4 text-gray-600">Chargement…</div>;
  if (!activeQualityGroup)
    return <div className="p-4 text-gray-600">Aucun groupe de qualité activé.</div>;

  const activeEcorce = activeQualityGroup.pourcentageEcorce ?? 0;
  const setHash = (id: string, show: boolean) => {
    const flag = show ? "&stats=1" : "";
    window.location.hash = `${id}${flag}`;
  };

  async function onExportAllPdfs() {
    if (!data) return;
    
    // Traiter chaque PDF de manière séquentielle avec une approche simplifiée
    for (let i = 0; i < (data.qualityGroups || []).length; i++) {
      const qg = data.qualityGroups![i];
      try {
        const s = await getSaisiesStats(data.id, qg.id, qg.pourcentageEcorce ?? 0);
        const rows = (await listSaisies(data.id, qg.id)) as SaisieRow[];
        
        // Modifier le HTML pour inclure la numérotation directement dans le CSS
        const htmlWithPageNumbers = buildExportHtmlWithPageNumbers(data, qg, s, rows);
        
        // Attendre que le PDF précédent soit complètement traité
        if (i > 0) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
        // Créer une nouvelle fenêtre pour chaque PDF
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) {
          console.error('Impossible d\'ouvrir une nouvelle fenêtre pour l\'impression');
          continue;
        }
        
        printWindow.document.write(htmlWithPageNumbers);
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
        
      } catch (error) {
        console.error('Erreur lors de l\'export PDF pour la qualité:', qg.name, error);
      }
    }
  }

  async function onExportLocationPlans() {
    if (!data) return;
    
    // Pour chaque quality group, vérifier s'il y a des points GPS
    for (let i = 0; i < (data.qualityGroups || []).length; i++) {
      const qg = data.qualityGroups![i];
      try {
        const gpsPoints = await fetchGPSPoints(data.id, qg.id);
        
        // Si pas de points GPS, passer au suivant
        if (gpsPoints.length === 0) {
          continue;
        }
        
        // Générer le plan de localisation pour ce quality group
        const html = generateLocationPlanHTML(data, qg, gpsPoints);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `plan-localisation-${qg.essences.map(e => e.name).join('-')}-${qg.qualite.name}-${qg.scieur.name}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Attendre un peu entre chaque téléchargement
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error('Erreur lors de l\'export du plan de localisation pour:', qg.name, error);
      }
    }
  }

  function generateLocationPlanHTML(chantier: ChantierDetail, qg: any, gpsPoints: any[]) {
    const qualityGroupName = `${qg.essences.map((e: any) => e.name).join(' + ')} ${qg.qualite.name} ${qg.scieur.name}`;
    const qualityGroupNameFormatted = `<strong>${qg.essences.map((e: any) => e.name).join(' + ')}</strong> <strong>${qg.qualite.name}</strong> <strong>${qg.scieur.name}</strong>`;

    // Récupérer les informations du chantier
    const property = chantier.property;
    const client = chantier.client;
    
    // Récupérer les informations de lot et convention
    const lotConvention = qg.lotConventions ? qg.lotConventions[0] : null;
    
    // Construire les informations à afficher
    let propertyInfo = '';
    if (property) {
      const sections = [];
      
      // Titre plus gros
      sections.push(`<span class="info-title">Coupe n° ${chantier.numeroCoupe}</span>`);
      
      if (client) {
        sections.push(`<span class="info-label">Client</span> : ${client.firstName} ${client.lastName}`);
      }
      
      if (property.commune) {
        sections.push(`<span class="info-label">Commune</span> : ${property.commune}`);
      }
      
      if (property.lieuDit) {
        sections.push(`<span class="info-label">Lieu-dit</span> : ${property.lieuDit}`);
      }
      
      if (property.section || property.parcelle) {
        const sectionParcelle = [];
        if (property.section) sectionParcelle.push(`<span class="info-bold">Section</span> : ${property.section.toUpperCase()}`);
        if (property.parcelle) sectionParcelle.push(`<span class="info-bold">Parcelle</span> : ${property.parcelle}`);
        sections.push(sectionParcelle.join(' • '));
      }
      
      if (property.surfaceCadastrale) {
        sections.push(`<span class="info-label">Surface cadastrale</span> : ${Number(property.surfaceCadastrale).toFixed(3)}m²`);
      }
      
      sections.push(qualityGroupNameFormatted);
      
      if (lotConvention) {
        sections.push(`<span class="info-bold">Lot</span> : ${lotConvention.lot} • <span class="info-bold">Convention</span> : ${lotConvention.convention}`);
      }
      
      // Ajouter les points GPS à la suite
      if (gpsPoints && gpsPoints.length > 0) {
        gpsPoints.forEach((point, index) => {
          sections.push(`
            <div style="margin-top: 0px; text-align: center;">
              <span style="font-size: 20px;">📍</span>
              <a href="https://www.google.com/maps?q=${point.latitude},${point.longitude}" target="_blank" style="color: #2563eb; text-decoration: none; font-size: 14px; margin-left: 5px;">
                ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)}
              </a>
              ${point.notes ? `<div style="margin-top: 3px; font-size: 13px; color: #555;">${point.notes}</div>` : ''}
            </div>
          `);
        });
      }
      
      // Séparer les sections texte des sections HTML
      const textSections = [];
      const htmlSections = [];
      
      for (const section of sections) {
        if (section.trim().startsWith('<div')) {
          htmlSections.push(section);
        } else {
          textSections.push(section);
        }
      }
      
      // Joindre les sections texte avec <br>, puis ajouter les sections HTML directement
      propertyInfo = textSections.join('<br>') + (htmlSections.length > 0 ? '<br>' + htmlSections.join('') : '');
    }

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plan de Localisation - ${qualityGroupName}</title>
    <style>
        * { box-sizing: border-box; }
        body { 
            font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            font-size: 24px;
            margin: 0 0 20px;
            color: #333;
            text-align: center;
        }
        .info-section {
            margin-bottom: 30px;
            padding: 30px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            text-align: center;
            font-size: 14px;
            line-height: 2.2;
        }
        .info-title {
            font-size: 20px;
            font-weight: 700;
            color: #111;
            margin-bottom: 0px;
            display: block;
        }
        .info-label {
            font-weight: 600;
            color: #111;
        }
        .info-bold {
            font-weight: 600;
            color: #111;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Plan de Localisation</h1>
        
        ${propertyInfo ? `<div class="info-section">${propertyInfo}</div>` : ''}
    </div>
</body>
</html>`;
  }

  function buildExportHtmlWithPageNumbers(
    chantier: ChantierDetail,
    qualite: NonNullable<typeof activeQualityGroup>,
    stats: SaisieStats | null,
    rows: SaisieRow[],
  ) {
    const fmt3 = (n?: number) =>
      (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const fmtDate = (iso: string) => {
      const d = new Date(iso);
      const date = d.toLocaleDateString("fr-FR", { year: "2-digit", month: "2-digit", day: "2-digit" });
      const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${date} ${time}`;
    };
  
    const head = `
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Coupe n° ${chantier.numeroCoupe} — ${qualite.essences.map(e => e.name).join(' + ')} ${qualite.qualite.name}</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; 
          color: #111; 
          margin: 24px; 
          counter-reset: page; /* Réinitialiser le compteur de pages */
        }
        .title-wrap { display:flex; align-items:center; justify-content:center; text-align:center; }
        h1 { font-size: 22px; margin: 0 0 4px; font-weight: 600; }
        h2 { font-size: 16px; margin: 12px 0 8px; text-align: center; font-weight: 600; }
        .quality-title { font-size: 14px; margin: 8px 0 6px; text-align: center; font-weight: 500; }
        .muted { color: #6b7280; font-size: 12px; text-align: center; }
        .small { font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
        th { background: #f9fafb; text-align: center; }
        td { text-align: center; }
        td.left { text-align: left; }
        .nums { font-variant-numeric: tabular-nums; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        
        @media print { 
          body { margin: 10mm; }
          @page {
            margin: 10mm;
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { 
              content: counter(page) "/" counter(pages);
              font-size: 10px;
              color: #666;
            }
          }
        }
      </style>
    `;
  
    const createdAtText = chantier?.createdAt
  ? (() => {
      const d = new Date(chantier.createdAt as any);
      const date = d.toLocaleDateString("fr-FR", { year: "2-digit", month: "2-digit", day: "2-digit" });
      const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${date} ${time}`;
    })()
  : "—";
  
    const clientName = chantier.client ? `${chantier.client.firstName} ${chantier.client.lastName}` : "—";
    const commune = chantier.property?.commune || "—";
    const lieuDit = chantier.property?.lieuDit || null;
    const section = chantier.property?.section || "—";
    const parcelle = chantier.property?.parcelle || "—";
    const surfaceCad = chantier.property?.surfaceCadastrale 
      ? chantier.property.surfaceCadastrale.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })
      : "—";
  
    const info = `
      <section class="mb-3 no-break">
        <div class="title-wrap"><h1>Coupe n° ${chantier.numeroCoupe}</h1></div>
        <div class="muted mb-2"><strong>Client :</strong> ${clientName}</div>
        <div class="muted mb-2"><strong>Commune :</strong> ${commune}${lieuDit ? ` • <strong>Lieu-dit :</strong> ${lieuDit}` : ""}</div>
        <div class="muted mb-2"><strong>Section :</strong> ${section} • <strong>Parcelle :</strong> ${parcelle}</div>
        <div class="muted mb-2"><strong>Surface cadastrale :</strong> ${surfaceCad}m²</div>
      </section>
    `;
  
    const qual = `
      <section class="mb-2">
        <div class="quality-title">${qualite.essences.map(e => e.name).join(' ')} ${qualite.qualite.name} ${qualite.scieur.name}</div>
        <div class="muted small"><strong>Lot :</strong> ${(qualite as any).lotConventions?.[0]?.lot || "—"} • <strong>Convention :</strong> ${(qualite as any).lotConventions?.[0]?.convention || "—"}</div>
        <div class="muted small"><strong>Seuils :</strong> V1 = 0,250 m³ • V2 = 0,500 m³ • % écorce : ${qualite.pourcentageEcorce ?? 0}%</div>
      </section>
    `;
  
    const statsTable = stats ? `
      <section class="mb-2 no-break">
        <table>
          <thead>
            <tr><th></th><th>vol. &lt; V1</th><th>V1 ≤ vol. &lt; V2</th><th>vol. ≥ V2</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr><td class="left">V. total</td><td class="nums">${fmt3(stats.columns.ltV1.sum)} m³</td><td class="nums">${fmt3(stats.columns.between.sum)} m³</td><td class="nums">${fmt3(stats.columns.geV2.sum)} m³</td><td class="nums">${fmt3(stats.total.sum)} m³</td></tr>
            <tr><td class="left">Nb.</td><td>${stats.columns.ltV1.count}</td><td>${stats.columns.between.count}</td><td>${stats.columns.geV2.count}</td><td>${stats.total.count}</td></tr>
            <tr><td class="left">V. moy</td><td class="nums">${fmt3(stats.columns.ltV1.avg)} m³</td><td class="nums">${fmt3(stats.columns.between.avg)} m³</td><td class="nums">${fmt3(stats.columns.geV2.avg)} m³</td><td class="nums">${fmt3(stats.total.avg)} m³</td></tr>
          </tbody>
        </table>
      </section>
    ` : "";
  
    const rowsTable = `
      <section>
        <table>
          <thead>
            <tr>
              <th>N°</th><th>Date</th><th>LONG.</th><th>DIAM.</th>
              <th>vol. &lt; V1</th><th>V1 ≤ vol. &lt; V2</th><th>vol. ≥ V2</th><th>Annotation</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length === 0
                ? `<tr><td class="left" colspan="8" style="text-align:center">Aucune saisie.</td></tr>`
                : rows.map((r) => {
                    const dM = Math.max(0, Number(r.diametre)) / 100;
                    const base = Math.PI * Math.pow(dM / 2, 2) * Math.max(0, Number(r.longueur));
                    const factor = 1 - Math.max(0, Math.min(100, qualite.pourcentageEcorce ?? 0)) / 100;
                    const vol = base * factor;
                    const a = vol < 0.25 ? vol : 0;
                    const b = vol >= 0.25 && vol < 0.5 ? vol : 0;
                    const c = vol >= 0.5 ? vol : 0;
                    return `
                      <tr>
                        <td class="nums">${r.numero}</td>
                        <td class="nums">${fmtDate(r.date)}</td>
                        <td class="nums">${Number(r.longueur).toLocaleString("fr-FR")}</td>
                        <td class="nums">${Number(r.diametre).toLocaleString("fr-FR")}</td>
                        <td class="nums">${a ? fmt3(a) : ""}</td>
                        <td class="nums">${b ? fmt3(b) : ""}</td>
                        <td class="nums">${c ? fmt3(c) : ""}</td>
                        <td class="left">${r.annotation ? escapeHtml(r.annotation) : "—"}</td>
                      </tr>`;
                  }).join("")
            }
          </tbody>
        </table>
      </section>
    `;
  
    return `<!doctype html><html><head>${head}</head><body>${info}${qual}${statsTable}${rowsTable}</body></html>`;
  }

  function buildExportHtml(
    chantier: ChantierDetail,
    qualite: NonNullable<typeof activeQualityGroup>,
    stats: SaisieStats | null,
    rows: SaisieRow[],
  ) {
    const fmt3 = (n?: number) =>
      (n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
    const fmtDate = (iso: string) => {
      const d = new Date(iso);
      const date = d.toLocaleDateString("fr-FR", { year: "2-digit", month: "2-digit", day: "2-digit" });
      const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${date} ${time}`; // (on garde la date/heure par ligne)
    };
  
    const head = `
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Coupe n° ${chantier.numeroCoupe} — ${qualite.essences.map(e => e.name).join(' + ')} ${qualite.qualite.name}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 24px; }
        .title-wrap { display:flex; align-items:center; justify-content:center; text-align:center; }
        h1 { font-size: 22px; margin: 0 0 4px; font-weight: 600; }
        h2 { font-size: 16px; margin: 12px 0 8px; text-align: center; font-weight: 600; }
        .quality-title { font-size: 14px; margin: 8px 0 6px; text-align: center; font-weight: 500; }
        .muted { color: #6b7280; font-size: 12px; text-align: center; }
        .small { font-size: 11px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; font-size: 12px; }
        th { background: #f9fafb; text-align: center; }
        td { text-align: center; }
        td.left { text-align: left; }
        .nums { font-variant-numeric: tabular-nums; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .page-break { page-break-before: always; }
        .no-break { page-break-inside: avoid; }
        @media print { 
          body { margin: 10mm; }
          @page {
            margin: 10mm;
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
          }
          .page-number {
            position: fixed;
            bottom: 10mm;
            right: 10mm;
            font-size: 10px;
            color: #666;
            z-index: 1000;
          }
        }
      </style>
    `;
  
    const createdAtText = chantier?.createdAt
  ? (() => {
      const d = new Date(chantier.createdAt as any); // string ISO ou Date
      const date = d.toLocaleDateString("fr-FR", { year: "2-digit", month: "2-digit", day: "2-digit" });
      const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${date} ${time}`;
    })()
  : "—";
  
    const info = `
      <section class="mb-3 no-break">
        <div class="title-wrap"><h1>Coupe n° ${chantier.numeroCoupe}</h1></div>
        <div class="muted mb-2 small">${chantier.client ? `${chantier.client.firstName} ${chantier.client.lastName}` : "Aucun client"} — ${chantier.client?.city || "—"}</div>
        <div class="muted small"><strong>Section :</strong> ${chantier.section ?? "—"} • <strong>Parcelle :</strong> ${chantier.parcel ?? "—"}</div>
      </section>
    `;
  
    const qual = `
      <section class="mb-2">
        <div class="quality-title">${qualite.essences.map(e => e.name).join(' ')} ${qualite.qualite.name} ${qualite.scieur.name}</div>
        <div class="muted small"><strong>Lot :</strong> ${(qualite as any).lotConventions?.[0]?.lot || "—"} • <strong>Convention :</strong> ${(qualite as any).lotConventions?.[0]?.convention || "—"}</div>
        <div class="muted small">Seuils : V1 = 0,250 m³ • V2 = 0,500 m³ • % écorce : ${qualite.pourcentageEcorce ?? 0}%</div>
      </section>
    `;
  
    const statsTable = stats ? `
      <section class="mb-2 no-break">
        <table>
          <thead>
            <tr><th></th><th>vol. &lt; V1</th><th>V1 ≤ vol. &lt; V2</th><th>vol. ≥ V2</th><th>Total</th></tr>
          </thead>
          <tbody>
            <tr><td class="left">V. total</td><td class="nums">${fmt3(stats.columns.ltV1.sum)} m³</td><td class="nums">${fmt3(stats.columns.between.sum)} m³</td><td class="nums">${fmt3(stats.columns.geV2.sum)} m³</td><td class="nums">${fmt3(stats.total.sum)} m³</td></tr>
            <tr><td class="left">Nb.</td><td>${stats.columns.ltV1.count}</td><td>${stats.columns.between.count}</td><td>${stats.columns.geV2.count}</td><td>${stats.total.count}</td></tr>
            <tr><td class="left">V. moy</td><td class="nums">${fmt3(stats.columns.ltV1.avg)} m³</td><td class="nums">${fmt3(stats.columns.between.avg)} m³</td><td class="nums">${fmt3(stats.columns.geV2.avg)} m³</td><td class="nums">${fmt3(stats.total.avg)} m³</td></tr>
          </tbody>
        </table>
      </section>
    ` : "";
  
    const rowsTable = `
      <section>
        <table>
          <thead>
            <tr>
              <th>N°</th><th>Date</th><th>LONG.</th><th>DIAM.</th>
              <th>vol. &lt; V1</th><th>V1 ≤ vol. &lt; V2</th><th>vol. ≥ V2</th><th>Annotation</th>
            </tr>
          </thead>
          <tbody>
            ${
              rows.length === 0
                ? `<tr><td class="left" colspan="8" style="text-align:center">Aucune saisie.</td></tr>`
                : rows.map((r) => {
                    const dM = Math.max(0, Number(r.diametre)) / 100;
                    const base = Math.PI * Math.pow(dM / 2, 2) * Math.max(0, Number(r.longueur));
                    const factor = 1 - Math.max(0, Math.min(100, qualite.pourcentageEcorce ?? 0)) / 100;
                    const vol = base * factor;
                    const a = vol < 0.25 ? vol : 0;
                    const b = vol >= 0.25 && vol < 0.5 ? vol : 0;
                    const c = vol >= 0.5 ? vol : 0;
                    return `
                      <tr>
                        <td class="nums">${r.numero}</td>
                        <td class="nums">${fmtDate(r.date)}</td>
                        <td class="nums">${Number(r.longueur).toLocaleString("fr-FR")}</td>
                        <td class="nums">${Number(r.diametre).toLocaleString("fr-FR")}</td>
                        <td class="nums">${a ? fmt3(a) : ""}</td>
                        <td class="nums">${b ? fmt3(b) : ""}</td>
                        <td class="nums">${c ? fmt3(c) : ""}</td>
                        <td class="left">${r.annotation ? escapeHtml(r.annotation) : "—"}</td>
                      </tr>`;
                  }).join("")
            }
          </tbody>
        </table>
      </section>
    `;
  
    return `<!doctype html><html><head>${head}</head><body>${info}${qual}${statsTable}${rowsTable}</body></html>`;
  }

  function escapeHtml(s: string) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-8 pb-[50px]">
      {/* Bouton retour mobile — juste sous la navbar */}
      <MobileBack fallback="/chantiers" variant="fixed" className="md:block" />

      {/* Header centré */}
      <header className="text-center space-y-1">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
          Coupe n° {data.numeroCoupe}
        </h1>
        {data.client && (
          <p className="text-sm text-gray-500">
            Client : <strong>{data.client.firstName} {data.client.lastName}</strong>
          </p>
        )}
        {data.property && (
          <div className="text-xs text-gray-500 space-y-0.5">
            {data.property.commune && <p>Commune : <strong>{data.property.commune}</strong></p>}
            {data.property.lieuDit && <p>Lieu-dit : <strong>{data.property.lieuDit}</strong></p>}
            {(data.property.section || data.property.parcelle) && (
              <p>
                {data.property.section && <>Section : <strong>{data.property.section}</strong></>}
                {(data.property.section && data.property.parcelle) && " • "}
                {data.property.parcelle && <>Parcelle : <strong>{data.property.parcelle}</strong></>}
              </p>
            )}
            {data.property.surfaceCadastrale && (
              <p>Surface cadastrale : <strong>{data.property.surfaceCadastrale}m²</strong></p>
            )}
          </div>
        )}
      </header>

      {/* Export PDF et Fiche chantier (desktop uniquement pour superviseurs) */}
      {(() => {
        const user = getUser();
        const isSupervisor = isSuperviseur(user);
        return isSupervisor;
      })() && (     
     <div className="hidden md:flex justify-center gap-2 mb-2.5">
       <Link
         to={`/chantiers/${id}/fiche`}
         className="inline-flex items-center justify-center rounded-full px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition hover:opacity-90"
         aria-label="Voir la fiche chantier"
         title="Voir la fiche chantier"
       >
         <FileText className="h-5 w-5 text-blue-600" />
       </Link>
       <button
         onClick={onExportAllPdfs}
         className="inline-flex items-center justify-center rounded-full text-red-600 px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition"
         aria-label="Exporter en PDF"
         title="Exporter en PDF"
       >
         {/* Icône PDF minimaliste */}
         <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden>
           <path d="M7 3h7l5 5v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2"/>
           <path d="M14 3v5h5" stroke="currentColor" strokeWidth="2"/>
           <path d="M8 16v-5h2.2a2.5 2.5 0 0 1 0 5H8Z" stroke="currentColor" strokeWidth="2"/>
           <path d="M13 11h2.2a2 2 0 1 1 0 4H13v-4Z" stroke="currentColor" strokeWidth="2"/>
           <path d="M18 11h3" stroke="currentColor" strokeWidth="2"/>
         </svg>
       </button>
     </div>
      )}


      {/* Tableau superviseur: volumes par bûcheron et par (essence, qualité) */}
      {isSuperviseur(getUser()) && (
        <div className="max-w-[1100px] mx-auto">
          <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col key="header" className="w-[22%]" />
                {perUserTotals?.columns.map((c) => (
                  <col key={c.key} className="w-[19.5%]" />
                )) || []}
                <col key="total" className="w-[19.5%]" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr className="text-center">
                  <th className="px-3 py-2 border-b border-gray-200 text-left text-gray-600 font-medium">Bûcheron</th>
                  {perUserTotals?.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-b border-gray-200 text-gray-600 font-medium">
                      {c.label}
                    </th>
                  )) || []}
                  <th className="px-3 py-2 border-b border-gray-200 text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {perUserTotals?.users.map((u) => (
                  <tr key={u.user.id} className="text-center">
                    <td className="px-3 py-2 border-b border-gray-200 text-left">
                      {u.user.firstName} {u.user.lastName}
                    </td>
                    {perUserTotals.columns.map((c) => (
                      <td key={c.key} className="px-3 py-2 border-b border-gray-200 tabular-nums">
                        {(u.values[c.key] ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³
                      </td>
                    ))}
                    <td className="px-3 py-2 border-b border-gray-200 tabular-nums">
                      {u.total.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³
                    </td>
                  </tr>
                ))}
                {perUserTotals && (
                  <tr className="text-center bg-gray-50/60">
                    <td className="px-3 py-2 border-t border-gray-200 text-left font-medium">Total</td>
                    {perUserTotals.columns.map((c) => {
                      const sum = perUserTotals.users.reduce((acc, u) => acc + (u.values[c.key] ?? 0), 0);
                      return (
                        <td key={c.key} className="px-3 py-2 border-t border-gray-200 tabular-nums font-medium">
                          {sum.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 border-t border-gray-200 tabular-nums font-semibold">
                      {perUserTotals.grandTotal.toLocaleString("fr-FR", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} m³
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onglets centrés */}
      <div className="flex justify-center">
        <ChipTabs
          tabs={tabs}
          activeId={active!}
          onChange={(id) => {
            setActive(id);
            setHash(id, showStatsMobile);
          }}
        />
      </div>

      {/* Boutons GPS (desktop) */}
      {isSuperviseur(getUser()) && activeQualityGroup && (
        <div className="hidden lg:flex justify-center mb-3">
          <button
            onClick={() => {
              const buttonName = `gpsAddButton_gps_${activeQualityGroup.id}`;
              if ((window as any)[buttonName]) {
                (window as any)[buttonName]();
              }
            }}
            className="inline-flex items-center justify-center rounded-full px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition"
            aria-label="Ajouter un point GPS"
            title="Ajouter un point GPS"
          >
            {/* Icône Google Maps multicolore */}
            <svg viewBox="0 0 24 24" className="h-5 w-5" xmlns="http://www.w3.org/2000/svg">
              {/* Forme du marqueur (goutte inversée) */}
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="none"/>
              {/* Section rouge - haut gauche */}
              <path d="M12 2L5 9L12 9L12 2Z" fill="#EA4335"/>
              {/* Section bleue - haut droite */}
              <path d="M12 2L19 9L12 9L12 2Z" fill="#4285F4"/>
              {/* Section jaune - bas gauche */}
              <path d="M5 9L12 9L12 22L5 9Z" fill="#FBBC04"/>
              {/* Section verte - bas droite */}
              <path d="M12 9L19 9L12 22L12 9Z" fill="#34A853"/>
              {/* Cercle central blanc */}
              <circle cx="12" cy="9" r="2" fill="#FFFFFF"/>
            </svg>
          </button>
          {hasGpsPoints && (
            <button
              onClick={async () => {
                try {
                  const gpsPoints = await fetchGPSPoints(data.id, activeQualityGroup.id);
                  if (gpsPoints && gpsPoints.length > 0) {
                    const html = generateLocationPlanHTML(data, activeQualityGroup, gpsPoints);
                    const blob = new Blob([html], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `plan-localisation-${activeQualityGroup.essences.map(e => e.name).join('-')}-${activeQualityGroup.qualite.name}-${activeQualityGroup.scieur.name}.html`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                } catch (error) {
                  console.error('Erreur lors de l\'export du plan de localisation:', error);
                }
              }}
              className="inline-flex items-center justify-center rounded-full text-green-600 px-2 py-2 text-sm shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition"
              aria-label="Créer un plan de localisation"
              title="Créer un plan de localisation"
            >
              <Map className="h-5 w-5" />
            </button>
          )}
        </div>
      )}

      {/* Gestionnaire GPS (toujours présent mais visuellement caché sur desktop) */}
      {isSuperviseur(getUser()) && activeQualityGroup && (
        <div className="hidden lg:block" data-gps-manager={`gps_${activeQualityGroup.id}`}>
          <GPSPointsManager 
            chantierId={data.id}
            qualityGroupId={activeQualityGroup.id}
            onPointsCountChange={(count) => {
              setHasGpsPoints(count > 0);
            }}
          />
        </div>
      )}

      {/* Lot/Convention + Seuils + toggle mobile */}
      <div className="text-center text-[12px] text-gray-500">
        {/* Lot et Convention */}
        {activeQualityGroup && (
          <div className="mb-2 text-gray-700">
            <span className="font-medium">Lot :</span> <span className="tabular-nums">{(activeQualityGroup as any).lotConventions?.[0]?.lot || "—"}</span>
            {" • "}
            <span className="font-medium">Convention :</span> <span className="tabular-nums">{(activeQualityGroup as any).lotConventions?.[0]?.convention || "—"}</span>
          </div>
        )}
        
        <div className="hidden lg:block">
          Seuils : V1 ={" "}
          <span className="tabular-nums font-semibold">0,250 m³</span> • V2 =
          <span className="tabular-nums font-semibold"> 0,500 m³</span> • %
          écorce :
          <span className="tabular-nums font-semibold"> {activeEcorce}%</span>
        </div>
        <div className="lg:hidden">
          <button
            onClick={() => {
              const next = !showStatsMobile;
              setShowStatsMobile(next);
              setHash(active!, next);
            }}
            className="text-gray-600 underline underline-offset-4"
          >
            {showStatsMobile
              ? "Masquer les seuils & totaux"
              : "Afficher les seuils & totaux"}
          </button>
          {showStatsMobile && (
            <div className="mt-1">
              Seuils : V1 ={" "}
              <span className="tabular-nums font-semibold">0,250 m³</span> • V2
              =<span className="tabular-nums font-semibold"> 0,500 m³</span> • %
              écorce :
              <span className="tabular-nums font-semibold">
                {" "}
                {activeEcorce}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats + Table même largeur */}
      <div className="space-y-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="hidden lg:block">
            <StatsTable
              stats={stats}
              globalStats={globalStats}
              userStats={userStats}
              todayUser={todayUser ?? undefined}
              isSupervisor={isSuperviseur(getUser())}
            />
          </div>
          {showStatsMobile && (
            <div className="lg:hidden">
              <StatsTable
                stats={stats}
                globalStats={globalStats}
                userStats={userStats}
                todayUser={todayUser ?? undefined}
                isSupervisor={isSuperviseur(getUser())}
              />
            </div>
          )}
        </div>

        <div className="max-w-[1100px] mx-auto">
          <SaisieTab
            chantierId={data.id}
            qualityGroupId={activeQualityGroup.id}
            ecorcePercent={activeQualityGroup.pourcentageEcorce ?? 0}
            onMutated={onMutated}
          />
        </div>
      </div>
    </div>
  );
}
