// src/pages/chantiers/ChantierDetail.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
  fetchChantier,
  type ChantierDetail,
} from "../../features/chantiers/api";
import { getSaisiesStats, type SaisieStats } from "../../features/saisies/api"; // ← ici
import ChipTabs from "../../components/ChipTabs";
import { StatCard } from "../../components/StatCard";
import SaisieTab from "./SaisieTab";

type Tab = { id: string; label: string; hint?: string };

function fmt(n?: number) {
  if (n == null || Number.isNaN(n)) return "0,000";
  return n.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export default function ChantierDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ChantierDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // id d’onglet = "q_<qualiteId>"
  const [active, setActive] = useState<string | null>(null);

  // ✅ Type corrigé
  const [stats, setStats] = useState<SaisieStats | null>(null);

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
      const hash = window.location.hash?.replace("#", "");
      const found = tabs.find((t) => t.id === hash);
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
        const s = await getSaisiesStats(data.id, activeQualite.id);
        setStats(s);
      } catch {
        setStats(null);
      }
    })();
  }, [data, activeQualite]);

  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!data) return <div className="p-4 text-gray-600">Chargement…</div>;
  if (!activeQualite)
    return <div className="p-4 text-gray-600">Aucune qualité activée.</div>;

  const activeLabel = `${activeQualite.essence.name} — ${activeQualite.name}`;
  const activeEcorce = activeQualite.pourcentageEcorce ?? 0;
  const vLtV1 = stats?.columns.ltV1.sum ?? 0;
  const vBetween = stats?.columns.between.sum ?? 0;
  const vGeV2 = stats?.columns.geV2.sum ?? 0;
  const vAll = stats?.total.sum ?? 0;

  const nLtV1 = stats?.columns.ltV1.count ?? 0;
  const nBetween = stats?.columns.between.count ?? 0;
  const nGeV2 = stats?.columns.geV2.count ?? 0;
  const nAll = stats?.total.count ?? 0;

  const mLtV1 = stats?.columns.ltV1.avg ?? 0;
  const mBetween = stats?.columns.between.avg ?? 0;
  const mGeV2 = stats?.columns.geV2.avg ?? 0;
  const mAll = stats?.total.avg ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-semibold">
          {data.referenceLot}
        </h1>
        <p className="text-sm text-gray-500">
          {data.proprietaire} — {data.commune} ({data.lieuDit})
        </p>
        <p className="text-sm text-gray-400">Convention : {data.convention}</p>
      </header>

      <ChipTabs
        tabs={tabs}
        activeId={active ?? ""}
        onChange={(id) => {
          setActive(id);
          window.location.hash = id;
        }}
      />

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Synthèse</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="V. total < V1" value={fmt(vLtV1)} suffix="m³" />
          <StatCard label="V. total V1–V2" value={fmt(vBetween)} suffix="m³" />
          <StatCard label="V. total ≥ V2" value={fmt(vGeV2)} suffix="m³" />
          <StatCard label="Total général" value={fmt(vAll)} suffix="m³" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard tone="soft" label="Nb. < V1" value={String(nLtV1)} />
          <StatCard tone="soft" label="Nb. V1–V2" value={String(nBetween)} />
          <StatCard tone="soft" label="Nb. ≥ V2" value={String(nGeV2)} />
          <StatCard tone="soft" label="Nb. total" value={String(nAll)} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="V. moy < V1" value={fmt(mLtV1)} suffix="m³" />
          <StatCard label="V. moy V1–V2" value={fmt(mBetween)} suffix="m³" />
          <StatCard label="V. moy ≥ V2" value={fmt(mGeV2)} suffix="m³" />
          <StatCard label="V. moy total" value={fmt(mAll)} suffix="m³" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">
          {activeLabel}{" "}
          <span className="text-sm text-gray-400">
            ({activeEcorce}% écorce)
          </span>
        </h2>
        <SaisieTab chantierId={data.id} qualiteId={activeQualite.id} />
      </section>
    </div>
  );
}
