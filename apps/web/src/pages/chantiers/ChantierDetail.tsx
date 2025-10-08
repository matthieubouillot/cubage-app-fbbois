import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import {
  fetchChantier,
  type ChantierDetail,
} from "../../features/chantiers/api";
import { getSaisiesStats, listSaisies, type SaisieStats, type SaisieRow } from "../../features/saisies/api";
import { getUser, type User } from "../../features/auth/auth";

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
    window.addEventListener("cubage:reconnected", onReconnected as any);
    return () => window.removeEventListener("cubage:reconnected", onReconnected as any);
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
        setTodayUser(null);
        return;
      }
      try {
        const s = await getSaisiesStats(
          data.id,
          activeQualite.id,
          activeQualite.pourcentageEcorce ?? 0,
        );
        setStats(s);
        // Compute per-user today volume by category from rows
        const rows = await listSaisies(data.id, activeQualite.id);
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

        // Supervisor aggregation across all qualites of this chantier
        // Build columns from chantier qualites (essence + qualité name)
        const columns = (data.qualites || []).map((q) => ({
          key: q.id,
          label: `${q.essence.name} — ${q.name}`,
        }));
        // For each qualite, fetch rows and aggregate by user
        const userMap = new Map<string, { user: User; values: Record<string, number>; total: number }>();
        let grand = 0;
        for (const q of data.qualites) {
          const qRows = await listSaisies(data.id, q.id);
          for (const r of qRows as SaisieRow[]) {
            const uid = r.user?.id;
            if (!uid || !r.user) continue;
            const vol = Number(r.volumeCalc) || 0;
            grand += vol;
            if (!userMap.has(uid)) {
              userMap.set(uid, { user: r.user as User, values: {}, total: 0 });
            }
            const entry = userMap.get(uid)!;
            entry.values[q.id] = (entry.values[q.id] || 0) + vol;
            entry.total += vol;
          }
        }
        const users = Array.from(userMap.values()).sort((a, b) =>
          (a.user.lastName || "").localeCompare(b.user.lastName || "")
        );
        setPerUserTotals({ users, columns, grandTotal: grand });
      } catch {
        setStats(null);
        setTodayUser(null);
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

  async function onExportAllPdfs() {
    if (!data) return;
    for (const q of data.qualites) {
      try {
        const s = await getSaisiesStats(data.id, q.id, q.pourcentageEcorce ?? 0);
        const rows = (await listSaisies(data.id, q.id)) as SaisieRow[];
        const html = buildExportHtml(data, q, s, rows);
        // Imprimer via un iframe caché pour éviter tout titre/URL (about:blank)
        const iframe = document.createElement("iframe");
        iframe.style.position = "fixed";
        iframe.style.right = "0";
        iframe.style.bottom = "0";
        iframe.style.width = "0";
        iframe.style.height = "0";
        iframe.style.border = "0";
        document.body.appendChild(iframe);
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) {
          document.body.removeChild(iframe);
          continue;
        }
        doc.open();
        doc.write(html);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          
          // Ajouter la numérotation de page avec JavaScript
          const addPageNumbers = () => {
            const doc = iframe.contentDocument;
            if (!doc) return;
            
            // Calculer le nombre total de pages estimé
            const bodyHeight = doc.body.scrollHeight;
            const pageHeight = 297; // A4 height in mm (approximate)
            const totalPages = Math.ceil(bodyHeight / (pageHeight * 3.78)); // Convert mm to pixels
            
            // Créer un script pour ajouter la numérotation
            const script = doc.createElement('script');
            script.textContent = `
              window.addEventListener('beforeprint', function() {
                // Supprimer les anciens numéros de page
                document.querySelectorAll('.page-number').forEach(el => el.remove());
                
                // Estimer le nombre de pages
                const bodyHeight = document.body.scrollHeight;
                const pageHeight = 1122; // A4 height in pixels (approximate)
                const totalPages = Math.max(1, Math.ceil(bodyHeight / pageHeight));
                
                // Ajouter les numéros de page
                for (let i = 1; i <= totalPages; i++) {
                  const pageNum = document.createElement('div');
                  pageNum.className = 'page-number';
                  pageNum.textContent = i + '/' + totalPages;
                  pageNum.style.position = 'fixed';
                  pageNum.style.bottom = '10mm';
                  pageNum.style.right = '10mm';
                  pageNum.style.fontSize = '10px';
                  pageNum.style.color = '#666';
                  pageNum.style.zIndex = '1000';
                  pageNum.style.pointerEvents = 'none';
                  document.body.appendChild(pageNum);
                }
              });
            `;
            doc.head.appendChild(script);
            
            // Déclencher l'événement beforeprint
            iframe.contentWindow?.dispatchEvent(new Event('beforeprint'));
          };
          
          addPageNumbers();
          iframe.contentWindow?.print();
          setTimeout(() => document.body.removeChild(iframe), 500);
        }, 150);
      } catch {}
    }
  }

  function buildExportHtml(
    chantier: ChantierDetail,
    qualite: NonNullable<typeof activeQualite>,
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
      <title>Lot ${chantier.referenceLot} — ${qualite.essence.name} ${qualite.name}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: #111; margin: 24px; }
        .title-wrap { display:flex; align-items:center; justify-content:center; text-align:center; }
        h1 { font-size: 22px; margin: 0 0 4px; font-weight: 600; }
        h2 { font-size: 16px; margin: 12px 0 8px; text-align: center; font-weight: 600; }
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
        <div class="title-wrap"><h1>Lot ${chantier.referenceLot}</h1></div>
        <div class="muted mb-2 small">${chantier.proprietaire} — ${chantier.commune}${chantier.lieuDit ? ` (${chantier.lieuDit})` : ""}</div>
        <div class="muted small"><strong>Convention:</strong> ${chantier.convention} • <strong>Section:</strong> ${chantier.section ?? "—"} • <strong>Parcelle:</strong> ${chantier.parcel ?? "—"}</div>
        <div class="muted small"><strong>Date de création:</strong> ${createdAtText}</div>
      </section>
    `;
  
    const qual = `
      <section class="mb-2">
        <h2>${qualite.essence.name} — ${qualite.name}</h2>
        <div class="muted">% écorce: ${qualite.pourcentageEcorce ?? 0}%</div>
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

      {/* Export PDF (desktop) */}
      {getUser()?.role === "SUPERVISEUR" && (     
     <div className="hidden lg:flex justify-center">
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
      {getUser()?.role === "SUPERVISEUR" && perUserTotals && (
        <div className="hidden lg:block max-w-[1100px] mx-auto">
          <div className="overflow-x-auto bg-white rounded-xl border shadow-sm">
            <table className="w-full text-sm table-fixed">
              <colgroup>
                <col key="header" className="w-[22%]" />
                {perUserTotals.columns.map((c) => (
                  <col key={c.key} className="w-[19.5%]" />
                ))}
                <col key="total" className="w-[19.5%]" />
              </colgroup>
              <thead className="bg-gray-50">
                <tr className="text-center">
                  <th className="px-3 py-2 border-b border-gray-200 text-left text-gray-600 font-medium">Bûcheron</th>
                  {perUserTotals.columns.map((c) => (
                    <th key={c.key} className="px-3 py-2 border-b border-gray-200 text-gray-600 font-medium">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-3 py-2 border-b border-gray-200 text-gray-600 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {perUserTotals.users.map((u) => (
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
            <StatsTable
              stats={stats}
              todayUser={todayUser ?? undefined}
              isSupervisor={getUser()?.role === "SUPERVISEUR"}
            />
          </div>
          {showStatsMobile && (
            <div className="lg:hidden">
              <StatsTable
                stats={stats}
                todayUser={todayUser ?? undefined}
                isSupervisor={getUser()?.role === "SUPERVISEUR"}
              />
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
