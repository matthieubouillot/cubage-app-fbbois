import { useEffect, useState } from "react";
import {
  createSaisie,
  listSaisies,
  type SaisieRow,
  getSaisiesStats,
  type SaisieStats,
} from "../../features/saisies/api";

const fmt3 = (n: number) =>
  n.toLocaleString("fr-FR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });

export default function SaisieTab({
  chantierId,
  qualiteId,
}: {
  chantierId: string;
  qualiteId: string;
}) {
  const [rows, setRows] = useState<SaisieRow[] | null>(null);
  const [stats, setStats] = useState<SaisieStats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    longueur: "",
    diametre: "",
    annotation: "",
  });

  async function refreshAll() {
    const [r, s] = await Promise.all([
      listSaisies(chantierId, qualiteId),
      getSaisiesStats(chantierId, qualiteId),
    ]);
    setRows(r);
    setStats(s);
  }

  useEffect(() => {
    setRows(null);
    setStats(null);
    setErr(null);
    refreshAll().catch((e) => setErr(e.message || "Erreur de chargement"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chantierId, qualiteId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const longueur = parseFloat(form.longueur.replace(",", "."));
      const diametre = parseFloat(form.diametre.replace(",", "."));
      if (isNaN(longueur) || isNaN(diametre) || longueur <= 0 || diametre <= 0)
        throw new Error(
          "Longueur et diamètre doivent être des nombres positifs.",
        );

      await createSaisie({
        chantierId,
        qualiteId,
        longueur,
        diametre,
        annotation: form.annotation?.trim() || undefined,
      });
      setForm({ longueur: "", diametre: "", annotation: "" });
      await refreshAll();
    } catch (e: any) {
      setErr(e.message || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ===== Synthèse ===== */}
      {stats && (
        <div className="overflow-auto">
          <table className="min-w-[560px] border border-gray-300 bg-white">
            <thead className="bg-gray-50">
              <tr>
                <Th></Th>
                <Th>vol. &lt; V1</Th>
                <Th>V1 ≤ vol. &lt; V2</Th>
                <Th>vol. ≥ V2</Th>
                <Th className="text-right">Total</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium">V. total</Td>
                <Td>{fmt3(stats.columns.ltV1.sum)}</Td>
                <Td>{fmt3(stats.columns.between.sum)}</Td>
                <Td>{fmt3(stats.columns.geV2.sum)}</Td>
                <Td className="text-right">{fmt3(stats.total.sum)}&nbsp;M3</Td>
              </tr>
              <tr>
                <Td className="font-medium">Nb.</Td>
                <Td>{stats.columns.ltV1.count}</Td>
                <Td>{stats.columns.between.count}</Td>
                <Td>{stats.columns.geV2.count}</Td>
                <Td className="text-right">{stats.total.count}</Td>
              </tr>
              <tr>
                <Td className="font-medium">V. moy</Td>
                <Td>{fmt3(stats.columns.ltV1.avg)}</Td>
                <Td>{fmt3(stats.columns.between.avg)}</Td>
                <Td>{fmt3(stats.columns.geV2.avg)}</Td>
                <Td className="text-right">{fmt3(stats.total.avg)}&nbsp;M3</Td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ===== Formulaire saisie ===== */}
      <form
        onSubmit={submit}
        className="bg-white border rounded-xl p-4 grid gap-3 sm:grid-cols-6"
      >
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">LONG. (m)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            inputMode="decimal"
            placeholder="ex: 7,5"
            value={form.longueur}
            onChange={(e) =>
              setForm((f) => ({ ...f, longueur: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">DIAM (cm)</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            inputMode="decimal"
            placeholder="ex: 22"
            value={form.diametre}
            onChange={(e) =>
              setForm((f) => ({ ...f, diametre: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">Annotation</label>
          <input
            className="w-full border rounded-lg px-3 py-2"
            placeholder="Optionnel"
            value={form.annotation}
            onChange={(e) =>
              setForm((f) => ({ ...f, annotation: e.target.value }))
            }
          />
        </div>
        <div className="sm:col-span-6">
          <button
            className="rounded-lg bg-black text-white px-4 py-2 w-full sm:w-auto"
            disabled={saving}
          >
            {saving ? "Enregistrement..." : "Ajouter"}
          </button>
          {err && <span className="ml-3 text-sm text-red-600">{err}</span>}
        </div>
      </form>

      {/* ===== Tableau des lignes ===== */}
      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full min-w-[860px] text-sm">
          <thead>
            <tr>
              <Th>N°</Th>
              <Th>LONG.</Th>
              <Th>DIAM</Th>
              <Th>vol. &lt; V1</Th>
              <Th>V1 ≤ vol. &lt; V2</Th>
              <Th>vol. ≥ V2</Th>
              <Th>Annotation</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(odd)]:bg-gray-50">
            {/* ... tes lignes */}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <input
        className="w-full border rounded px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function Th(props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <th
      className={`sticky top-0 z-10 bg-gray-50 text-xs font-medium text-gray-600 uppercase tracking-wide
                  px-3 py-2 text-left whitespace-nowrap ${className}`}
      {...rest}
    />
  );
}

export function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return <td className={`px-3 py-2 align-middle ${className}`} {...rest} />;
}
