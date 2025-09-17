// apps/web/src/pages/chantiers/CreateChantier.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

type Qualite = { id: string; name: string; pourcentageEcorce: number };
type EssenceFull = { id: string; name: string; qualites: Qualite[] };
type User = { id: string; firstName: string; lastName: string };

type FormState = {
  referenceLot: string;
  convention: string;
  proprietaire: string;
  proprietaireFirstName: string; 
  commune: string;
  lieuDit: string;
  section?: string; // optionnel
  parcel?: string; // optionnel
  qualiteIds: string[];
  bucheronIds: string[];
};

export default function CreateChantier() {
  const [essences, setEssences] = useState<EssenceFull[]>([]);
  const [bucherons, setBucherons] = useState<User[]>([]);
  const [form, setForm] = useState<FormState>({
    referenceLot: "",
    convention: "",
    proprietaire: "",
    proprietaireFirstName: "", 
    commune: "",
    lieuDit: "",
    section: "",
    parcel: "",
    qualiteIds: [],
    bucheronIds: [],
  });
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const e = await api<EssenceFull[]>("/essences"); // inclut qualites
      setEssences(e);
      const u = await api<any[]>("/users?role=BUCHERON");
      setBucherons(
        u.map((x) => ({
          id: x.id,
          firstName: x.firstName,
          lastName: x.lastName,
        })),
      );
    })();
  }, []);

  const checkedByEssence = useMemo(() => {
    const map = new Map<string, number>();
    for (const ess of essences) {
      const ids = new Set(ess.qualites.map((q) => q.id));
      const count = form.qualiteIds.reduce(
        (acc, qid) => acc + (ids.has(qid) ? 1 : 0),
        0,
      );
      map.set(ess.id, count);
    }
    return map;
  }, [essences, form.qualiteIds]);

  const toggleQualite = (qualiteId: string) => {
    setForm((f) => {
      const set = new Set(f.qualiteIds);
      set.has(qualiteId) ? set.delete(qualiteId) : set.add(qualiteId);
      return { ...f, qualiteIds: Array.from(set) };
    });
  };

  const toggleBucheron = (id: string) => {
    setForm((f) => {
      const set = new Set(f.bucheronIds);
      set.has(id) ? set.delete(id) : set.add(id);
      return { ...f, bucheronIds: Array.from(set) };
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      if (form.qualiteIds.length === 0)
        throw new Error("Choisis au moins une qualité");
      if (form.bucheronIds.length === 0)
        throw new Error("Choisis au moins un bûcheron");

      // 👇 IMPORTANT : on envoie aussi proprietaireFirstName
      const payload = {
        referenceLot: form.referenceLot,
        convention: form.convention,
        proprietaire: form.proprietaire,
        proprietaireFirstName: form.proprietaireFirstName, 
        commune: form.commune,
        lieuDit: form.lieuDit,
        section: form.section?.toUpperCase() || undefined,
        parcel: form.parcel || undefined,
        qualiteIds: form.qualiteIds,
        bucheronIds: form.bucheronIds,
      };

      await api("/chantiers", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setOk("Chantier créé 🎉");
      // reset complet (inclut proprietaireFirstName)
      setForm({
        referenceLot: "",
        convention: "",
        proprietaire: "",
        proprietaireFirstName: "", 
        commune: "",
        lieuDit: "",
        section: "",
        parcel: "",
        qualiteIds: [],
        bucheronIds: [],
      });
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Créer un chantier</h1>
      <form onSubmit={submit} className="grid gap-4 max-w-3xl">
        {/* Infos générales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Référence du lot">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.referenceLot}
              onChange={(e) =>
                setForm({ ...form, referenceLot: e.target.value })
              }
              required
            />
          </Field>

          <Field label="Convention">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.convention}
              onChange={(e) => setForm({ ...form, convention: e.target.value })}
              required
            />
          </Field>

          <Field label="Nom du propriétaire">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.proprietaire}
              onChange={(e) =>
                setForm({ ...form, proprietaire: e.target.value })
              }
              required
            />
          </Field>

          <Field label="Prénom du propriétaire">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.proprietaireFirstName}
              onChange={(e) =>
                setForm({ ...form, proprietaireFirstName: e.target.value })
              }
              required
            />
          </Field>

          <Field label="Commune">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.commune}
              onChange={(e) => setForm({ ...form, commune: e.target.value })}
              required
            />
          </Field>

          <Field label="Lieu-dit">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.lieuDit}
              onChange={(e) => setForm({ ...form, lieuDit: e.target.value })}
              required
            />
          </Field>

          <Field label="Section (1–2 lettres)">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.section ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  section: e.target.value.toUpperCase().slice(0, 2),
                })
              }
            />
          </Field>

          <Field label="Parcelle (chiffres)">
            <input
              className="w-full border rounded px-3 py-2"
              value={form.parcel ?? ""}
              inputMode="numeric"
              pattern="\d*"
              onChange={(e) =>
                setForm({ ...form, parcel: e.target.value.replace(/\D/g, "") })
              }
            />
          </Field>
        </div>

        {/* Qualités (groupées par essence) */}
        <Field label="Qualités (sélection multiple, groupées par essence)">
          <div className="space-y-3">
            {essences.map((e) => (
              <div key={e.id} className="border rounded p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{e.name}</span>
                  <span className="text-xs text-gray-500">
                    {checkedByEssence.get(e.id) || 0} sélectionnée(s)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {e.qualites.map((q) => (
                    <label key={q.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.qualiteIds.includes(q.id)}
                        onChange={() => toggleQualite(q.id)}
                      />
                      <span>
                        {q.name}{" "}
                        <span className="text-gray-400 text-xs">
                          ({q.pourcentageEcorce}% écorce)
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Field>

        {/* Bûcherons */}
        <Field label="Bûcherons assignés">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {bucherons.map((u) => (
              <label key={u.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.bucheronIds.includes(u.id)}
                  onChange={() => toggleBucheron(u.id)}
                />
                <span>
                  {u.lastName} {u.firstName}
                </span>
              </label>
            ))}
          </div>
        </Field>

        {err && <p className="text-sm text-red-600">{err}</p>}
        {ok && <p className="text-sm text-green-600">{ok}</p>}

        <button
          disabled={loading}
          className="rounded bg-black text-white px-4 py-2"
        >
          {loading ? "Création..." : "Créer le chantier"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-sm mb-1">{label}</div>
      {children}
    </label>
  );
}
