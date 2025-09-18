// apps/web/src/pages/chantiers/CreateChantier.tsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { twMerge } from "tailwind-merge";

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
  section?: string;
  parcel?: string;
  qualiteIds: string[];
  bucheronIds: string[];
};

export default function CreateChantier() {
  const [essences, setEssences] = useState<EssenceFull[]>([]);
  const [bucherons, setBucherons] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

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

  useEffect(() => {
    (async () => {
      const e = await api<EssenceFull[]>("/essences");
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
        throw new Error("Choisis au moins une qualité.");
      if (form.bucheronIds.length === 0)
        throw new Error("Choisis au moins un bûcheron.");

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
    <div className="px-4 py-6">
      <div className="mx-auto w-full max-w-5xl">
        {/* Titre centré */}
        <header className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            Créer un chantier
          </h1>
          <p className="text-sm text-gray-500">
            Renseigne les informations, choisis les qualités et assigne les
            bûcherons.
          </p>
        </header>

        <form onSubmit={submit} className="space-y-6">
          {/* Carte 1 — Infos générales */}
          <Card title="Informations générales">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Référence du lot *">
                <Input
                  value={form.referenceLot}
                  onChange={(e) =>
                    setForm({ ...form, referenceLot: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Convention *">
                <Input
                  value={form.convention}
                  onChange={(e) =>
                    setForm({ ...form, convention: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Nom du propriétaire *">
                <Input
                  value={form.proprietaire}
                  onChange={(e) =>
                    setForm({ ...form, proprietaire: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Prénom du propriétaire *">
                <Input
                  value={form.proprietaireFirstName}
                  onChange={(e) =>
                    setForm({ ...form, proprietaireFirstName: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Commune *">
                <Input
                  value={form.commune}
                  onChange={(e) =>
                    setForm({ ...form, commune: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Lieu-dit *">
                <Input
                  value={form.lieuDit}
                  onChange={(e) =>
                    setForm({ ...form, lieuDit: e.target.value })
                  }
                  required
                />
              </Field>

              <Field label="Section (1–2 lettres)">
                <Input
                  value={form.section ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      section: e.target.value.toUpperCase().slice(0, 2),
                    })
                  }
                  placeholder="ex: A ou AB"
                />
              </Field>

              <Field label="Parcelle (chiffres)">
                <Input
                  value={form.parcel ?? ""}
                  inputMode="numeric"
                  pattern="\d*"
                  onChange={(e) =>
                    setForm({
                      ...form,
                      parcel: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="ex: 257"
                />
              </Field>
            </div>
          </Card>

          {/* Carte 2 — Qualités */}
          <Card title="Qualités (groupées par essence)">
            <div className="space-y-3">
              {essences.map((e) => (
                <div key={e.id} className="border rounded-xl p-3 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{e.name}</span>
                    <span className="text-xs text-gray-500">
                      {checkedByEssence.get(e.id) || 0} sélectionnée(s)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {e.qualites.map((q) => (
                      <label
                        key={q.id}
                        className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        title={`${q.pourcentageEcorce}% d'écorce`}
                      >
                        <input
                          type="checkbox"
                          className="accent-black"
                          checked={form.qualiteIds.includes(q.id)}
                          onChange={() => toggleQualite(q.id)}
                        />
                        <span className="flex-1">
                          <span className="font-medium">{q.name}</span>{" "}
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
          </Card>

          {/* Carte 3 — Bûcherons */}
          <Card title="Bûcherons assignés">
            {bucherons.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun bûcheron disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {bucherons.map((u) => {
                  const checked = form.bucheronIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={twMerge(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-50",
                        checked && "border-black/50 bg-gray-50",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="accent-black"
                        checked={checked}
                        onChange={() => toggleBucheron(u.id)}
                      />
                      <span className="font-medium">
                        {u.lastName} {u.firstName}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Messages */}
          {err && <div className="text-center text-sm text-red-600">{err}</div>}
          {ok && <div className="text-center text-sm text-green-600">{ok}</div>}

          {/* Barre d'action sticky en mobile, centrée en desktop */}
          <div className="bottom-3 flex justify-center">
            <button
              disabled={loading}
              className="rounded-full bg-black text-white px-6 py-3 shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {loading ? "Création…" : "Créer le chantier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ———————— Petits composants UI ———————— */

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border rounded-2xl shadow-sm">
      <div className="px-4 py-3 border-b">
        <h2 className="text-base font-semibold">{title}</h2>
      </div>
      <div className="p-4">{children}</div>
    </section>
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
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      {children}
    </label>
  );
}

function Input({
  className = "",
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={twMerge(
        "w-full border rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20",
        className,
      )}
      {...rest}
    />
  );
}
