import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import { api } from "../../lib/api";
import { updateChantier } from "../../features/chantiers/api";
import MobileBack from "../../components/MobileBack";

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
  section: string;
  parcel: string;
  qualiteIds: string[];
  bucheronIds: string[];
};

/* ───────── helpers de saisie (mêmes contraintes que "Create") ───────── */
const onlyDigits = (s: string) => s.replace(/\D/g, "");
const onlyLetters = (s: string) => s.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s-]/g, ""); // lettres + espaces + tirets

export default function EditChantier() {
  const { id } = useParams();
  const nav = useNavigate();

  const [essences, setEssences] = useState<EssenceFull[]>([]);
  const [bucherons, setBucherons] = useState<User[]>([]);
  const [form, setForm] = useState<FormState | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Charge référentiels + chantier
  useEffect(() => {
    (async () => {
      try {
        const [e, u, chantier] = await Promise.all([
          api<EssenceFull[]>("/essences"),
          api<any[]>("/users?role=BUCHERON"),
          api<any>(`/chantiers/${id}`),
        ]);

        setEssences(e);
        setBucherons(
          u.map((x) => ({
            id: x.id,
            firstName: x.firstName,
            lastName: x.lastName,
          })),
        );

        setForm({
          referenceLot: chantier.referenceLot ?? "",
          convention: chantier.convention ?? "",
          proprietaire: chantier.proprietaire ?? "",
          proprietaireFirstName: chantier.proprietaireFirstName ?? "",
          commune: chantier.commune ?? "",
          lieuDit: chantier.lieuDit ?? "",
          section: chantier.section ?? "",
          parcel: chantier.parcel ?? "",
          qualiteIds: (chantier.qualites ?? []).map((q: any) => q.id),
          bucheronIds: (chantier.bucherons ?? []).map((b: any) => b.id),
        });
      } catch (e: any) {
        setErr(e.message || "Erreur de chargement");
      }
    })();
  }, [id]);

  /* Comptage des cases cochées par essence */
  const checkedByEssence = useMemo(() => {
    const map = new Map<string, number>();
    for (const ess of essences) {
      const ids = new Set(ess.qualites.map((q) => q.id));
      const count = (form?.qualiteIds ?? []).reduce(
        (acc, qid) => acc + (ids.has(qid) ? 1 : 0),
        0,
      );
      map.set(ess.id, count);
    }
    return map;
  }, [essences, form?.qualiteIds]);

  /* Toggles */
  const toggleQualite = (qualiteId: string) => {
    setForm((f) => {
      if (!f) return f;
      const set = new Set(f.qualiteIds);
      set.has(qualiteId) ? set.delete(qualiteId) : set.add(qualiteId);
      return { ...f, qualiteIds: Array.from(set) };
    });
  };

  const toggleBucheron = (userId: string) => {
    setForm((f) => {
      if (!f) return f;
      const set = new Set(f.bucheronIds);
      set.has(userId) ? set.delete(userId) : set.add(userId);
      return { ...f, bucheronIds: Array.from(set) };
    });
  };

  /* Soumission */
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setErr(null);
    setLoading(true);
    try {
      // validations front “soft” (back refera Zod strict)
      if (!form.referenceLot || !/^\d+$/.test(form.referenceLot))
        throw new Error("Référence : chiffres uniquement.");
      if (!form.convention || !/^\d+$/.test(form.convention))
        throw new Error("Convention : chiffres uniquement.");
      if (
        !form.proprietaire ||
        !/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(form.proprietaire)
      )
        throw new Error("Nom propriétaire : lettres uniquement.");
      if (
        !form.proprietaireFirstName ||
        !/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(form.proprietaireFirstName)
      )
        throw new Error("Prénom propriétaire : lettres uniquement.");
      if (!form.commune || !/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(form.commune))
        throw new Error("Commune : lettres uniquement.");
      if (!form.lieuDit || !/^[A-Za-zÀ-ÖØ-öø-ÿ\s-]+$/.test(form.lieuDit))
        throw new Error("Lieu-dit : lettres uniquement.");
      if (form.section && !/^[A-Za-z]{1,2}$/.test(form.section))
        throw new Error("Section : 1 à 2 lettres.");
      if (form.parcel && !/^\d+$/.test(form.parcel))
        throw new Error("Parcelle : chiffres uniquement.");
      if (!form.qualiteIds.length)
        throw new Error("Choisis au moins une qualité.");
      if (!form.bucheronIds.length)
        throw new Error("Choisis au moins un bûcheron.");

      await updateChantier(id!, {
        referenceLot: form.referenceLot,
        convention: form.convention,
        proprietaire: form.proprietaire,
        proprietaireFirstName: form.proprietaireFirstName,
        commune: form.commune,
        lieuDit: form.lieuDit,
        section: form.section.toUpperCase(),
        parcel: form.parcel,
        qualiteIds: form.qualiteIds,
        bucheronIds: form.bucheronIds,
      });

      // retour sur la page détail
      nav(`/chantiers`);
    } catch (e: any) {
      setErr(e.message || "Erreur lors de l’enregistrement");
    } finally {
      setLoading(false);
    }
  };

  if (!form) {
    return <div className="p-4 text-sm text-gray-600">Chargement…</div>;
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto w-full max-w-5xl">
        <MobileBack fallback="/chantiers" variant="fixed" />

        {/* Titre centré */}
        <header className="text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight">
            Modifier le chantier
          </h1>
          <p className="text-sm text-gray-500">
            Mets à jour les informations, les qualités et les bûcherons
            assignés.
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
                    setForm({
                      ...form,
                      referenceLot: onlyDigits(e.target.value),
                    })
                  }
                  inputMode="numeric"
                  pattern="\d+"
                  required
                />
              </Field>

              <Field label="Convention *">
                <Input
                  value={form.convention}
                  onChange={(e) =>
                    setForm({ ...form, convention: onlyDigits(e.target.value) })
                  }
                  inputMode="numeric"
                  pattern="\d+"
                  required
                />
              </Field>

              <Field label="Nom du propriétaire *">
                <Input
                  value={form.proprietaire}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proprietaire: onlyLetters(e.target.value),
                    })
                  }
                  required
                />
              </Field>

              <Field label="Prénom du propriétaire *">
                <Input
                  value={form.proprietaireFirstName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proprietaireFirstName: onlyLetters(e.target.value),
                    })
                  }
                  required
                />
              </Field>

              <Field label="Commune *">
                <Input
                  value={form.commune}
                  onChange={(e) =>
                    setForm({ ...form, commune: onlyLetters(e.target.value) })
                  }
                  required
                />
              </Field>

              <Field label="Lieu-dit *">
                <Input
                  value={form.lieuDit}
                  onChange={(e) =>
                    setForm({ ...form, lieuDit: onlyLetters(e.target.value) })
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
                      section: e.target.value
                        .toUpperCase()
                        .replace(/[^A-Z]/g, "")
                        .slice(0, 2),
                    })
                  }
                  placeholder="ex: A ou AB"
                />
              </Field>

              <Field label="Parcelle (chiffres)">
                <Input
                  value={form.parcel ?? ""}
                  onChange={(e) =>
                    setForm({ ...form, parcel: onlyDigits(e.target.value) })
                  }
                  inputMode="numeric"
                  pattern="\d*"
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
                    {e.qualites.map((q) => {
                      const checked = form.qualiteIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className={twMerge(
                            "flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-50",
                            checked && "border-black/50 bg-gray-50",
                          )}
                          title={`${q.pourcentageEcorce}% d'écorce`}
                        >
                          <input
                            type="checkbox"
                            className="accent-black"
                            checked={checked}
                            onChange={() => toggleQualite(q.id)}
                          />
                          <span className="flex-1">
                            <span className="font-medium">{q.name}</span>{" "}
                            <span className="text-gray-400 text-xs">
                              ({q.pourcentageEcorce}% écorce)
                            </span>
                          </span>
                        </label>
                      );
                    })}
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

          {/* Actions */}
          <div className="flex justify-center">
            <button
              disabled={loading}
              className="rounded-full bg-black text-white px-6 py-3 shadow-sm hover:shadow-md disabled:opacity-60"
            >
              {loading ? "Enregistrement…" : "Enregistrer les modifications"}
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
