// apps/web/src/pages/chantiers/ChantierDetail.tsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchChantier,
  type ChantierDetail,
} from "../../features/chantiers/api";
import { getSaisiesStats, type SaisieStats } from "../../features/saisies/api";

import ChipTabs from "../../components/ChipTabs";
import StatsTable from "../../components/StatsTable";
import SaisieTab from "./SaisieTab";
import MobileBack from "../../components/MobileBack";

type Tab = { id: string; label: string; hint?: string };

export default function ChantierDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ChantierDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [active, setActive] = useState<string | null>(null);
  const [stats, setStats] = useState<SaisieStats | null>(null);

  // Mobile: cacher totaux/seuils par défaut, mémoriser dans le hash
  const [showStatsMobile, setShowStatsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.location.hash.includes("stats=1");
  });

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

  const tabs = useMemo<Tab[]>(() => {
    if (!data) return [];
    return data.qualites.map((q) => ({
      id: `q_${q.id}`,
      label: `${q.essence.name} — ${q.name}`,
      hint: `${q.pourcentageEcorce}% d'écorce`,
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

  const activeQualite = useMemo(() => {
    if (!data || !active) return null;
    const qid = active.replace(/^q_/, "");
    return data.qualites.find((q) => q.id === qid) || null;
  }, [data, active]);

  useEffect(() => {
    (async () => {
      if (!data || !activeQualite) {
        setStats(null);
        return;
      }
      try {
        const s = await getSaisiesStats(
          data.id,
          activeQualite.id,
          activeQualite.pourcentageEcorce ?? 0,
        );
        setStats(s);
      } catch {
        setStats(null);
      }
    })();
  }, [data, activeQualite, mutTick]);

  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!data) return <div className="p-4 text-gray-600">Chargement…</div>;
  if (!activeQualite)
    return <div className="p-4 text-gray-600">Aucune qualité activée.</div>;

  const activeEcorce = activeQualite.pourcentageEcorce ?? 0;
  const setHash = (id: string, show: boolean) => {
    const flag = show ? "&stats=1" : "";
    window.location.hash = `${id}${flag}`;
  };
  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-8 space-y-8">
      {/* Bouton retour mobile — juste sous la navbar */}
      <MobileBack fallback="/chantiers" variant="fixed" />

      {/* Header centré */}
      <header className="text-center space-y-1">
        <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
          {data.referenceLot}
        </h1>
        <p className="text-sm text-gray-500">
          {data.proprietaire} — {data.commune}
          {data.lieuDit ? ` (${data.lieuDit})` : ""}
        </p>
        <p className="text-xs text-gray-400">
          Convention : {data.convention}
          {(data.section || data.parcel) && (
            <>
              {" • "}Section : <strong>{data.section ?? "—"}</strong>
              {" • "}Parcelle : <strong>{data.parcel ?? "—"}</strong>
            </>
          )}
        </p>
      </header>

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

      {/* Seuils + toggle mobile */}
      <div className="text-center text-[12px] text-gray-500">
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
            <StatsTable stats={stats} />
          </div>
          {showStatsMobile && (
            <div className="lg:hidden">
              <StatsTable stats={stats} />
            </div>
          )}
        </div>

        <div className="max-w-[1100px] mx-auto">
          <SaisieTab
            chantierId={data.id}
            qualiteId={activeQualite.id}
            ecorcePercent={activeQualite.pourcentageEcorce ?? 0}
            onMutated={onMutated}
          />
        </div>
      </div>
    </div>
  );
}
