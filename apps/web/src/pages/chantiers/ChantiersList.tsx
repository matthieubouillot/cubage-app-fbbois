// apps/web/src/pages/chantiers/ChantiersList.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchChantiers,
  deleteChantier,
  type ChantierListItem,
} from "../../features/chantiers/api";
import { getUser } from "../../features/auth/auth";
import { twMerge } from "tailwind-merge";

export default function ChantiersList() {
  const [rows, setRows] = useState<ChantierListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const nav = useNavigate();
  const u = getUser();
  const isSupervisor = u?.role === "SUPERVISEUR";

  async function refresh() {
    try {
      setErr(null);
      const data = await fetchChantiers();
      setRows(data);
    } catch (e: any) {
      setErr(e.message || "Erreur");
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const onDelete = async (id: string) => {
    if (!isSupervisor) return;
    if (!window.confirm("Supprimer ce chantier ?")) return;
    try {
      setDeletingId(id);
      // optimiste
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? null);
      await deleteChantier(id);
    } catch (e: any) {
      setErr(e.message || "Erreur lors de la suppression");
      await refresh(); // rollback
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header centré */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Chantiers
          </h1>
          <div className="text-sm text-gray-500">
            {rows ? `${rows.length} chantier(s)` : "Chargement…"}
          </div>
          {isSupervisor && (
            <div className="flex justify-center">
              <button
                onClick={() => nav("/chantiers/nouveau")}
                className="rounded-full bg-black text-white px-5 py-2 text-sm shadow-sm hover:shadow-md"
              >
                Nouveau chantier
              </button>
            </div>
          )}
        </header>

        {err && <p className="text-center text-sm text-red-600">{err}</p>}

        {/* LISTE MOBILE (cartes) */}
        <div className="md:hidden space-y-3">
          {!rows && !err && (
            <div className="text-center text-sm text-gray-600">Chargement…</div>
          )}
          {rows?.length === 0 && (
            <div className="text-center text-sm text-gray-600">
              Aucun chantier.
            </div>
          )}
          {rows?.map((r) => {
            const owner =
              (r.proprietaireFirstName ? r.proprietaireFirstName + " " : "") +
              r.proprietaire;
            const localisation = r.lieuDit
              ? `${r.commune} (${r.lieuDit})`
              : r.commune;

            return (
              <div
                key={r.id}
                className="bg-white border rounded-2xl p-3 shadow-sm"
              >
                {/* Référence */}
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Référence du lot
                  </div>
                  <div className="font-medium">{r.referenceLot}</div>
                </div>

                {/* Propriétaire */}
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Propriétaire
                  </div>
                  <div className="font-medium">{owner}</div>
                </div>

                {/* Localisation */}
                <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">
                    Localisation
                  </div>
                  <div className="font-medium">{localisation}</div>
                </div>

                {/* Actions */}
                <div className="mt-3 flex items-center gap-2">
                  <Link
                    to={`/chantiers/${r.id}`}
                    className="flex-1 text-center rounded-full bg-black text-white px-4 py-2 text-sm"
                  >
                    Ouvrir
                  </Link>
                  {isSupervisor && (
                    <button
                      onClick={() => onDelete(r.id)}
                      disabled={deletingId === r.id}
                      className={twMerge(
                        "flex-1 text-center rounded-full border border-red-600 text-red-700 px-4 py-2 text-sm hover:bg-red-50",
                        deletingId === r.id && "opacity-60 cursor-wait",
                      )}
                    >
                      {deletingId === r.id ? "Suppression…" : "Supprimer"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* TABLEAU DESKTOP */}
        {rows && rows.length > 0 && (
          <div className="hidden md:block">
            <div className="mx-auto bg-white border rounded-2xl shadow-sm overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Référence du lot</Th>
                    <Th>Propriétaire</Th>
                    <Th>Localisation</Th>
                    <Th className="text-center w-[180px]">Actions</Th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/50">
                  {rows.map((r) => {
                    const owner =
                      (r.proprietaireFirstName
                        ? r.proprietaireFirstName + " "
                        : "") + r.proprietaire;
                    const localisation = r.lieuDit
                      ? `${r.commune} (${r.lieuDit})`
                      : r.commune;

                    return (
                      <tr key={r.id} className="border-t border-gray-200">
                        {/* Référence */}
                        <Td>
                          <div className="font-medium">{r.referenceLot}</div>
                        </Td>

                        {/* Propriétaire */}
                        <Td className="align-middle">
                          <div className="font-medium">{owner}</div>
                        </Td>

                        {/* Localisation */}
                        <Td className="align-middle">
                          <div className="font-medium">{localisation}</div>
                        </Td>

                        {/* Actions */}
                        <Td className="text-center">
                          <div className="inline-flex items-center gap-2">
                            <Link
                              to={`/chantiers/${r.id}`}
                              className="px-3 py-1.5 rounded-full bg-black text-white hover:opacity-90"
                            >
                              Ouvrir
                            </Link>
                            {isSupervisor && (
                              <button
                                onClick={() => onDelete(r.id)}
                                disabled={deletingId === r.id}
                                className={twMerge(
                                  "px-3 py-1.5 rounded-full border border-red-600 text-red-700 hover:bg-red-50",
                                  deletingId === r.id &&
                                    "opacity-60 cursor-wait",
                                )}
                                title="Supprimer le chantier"
                              >
                                {deletingId === r.id
                                  ? "Suppression…"
                                  : "Suppr."}
                              </button>
                            )}
                          </div>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Etat vide desktop */}
        {rows && rows.length === 0 && (
          <div className="hidden md:block text-center text-sm text-gray-600">
            Aucun chantier.
          </div>
        )}
      </div>
    </div>
  );
}

/* Helpers UI */
function Th(props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <th
      className={twMerge(
        "px-3 py-2 text-left whitespace-nowrap text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-200",
        className,
      )}
      {...rest}
    />
  );
}

function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <td className={twMerge("px-3 py-3 align-middle", className)} {...rest} />
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-2 py-0.5 text-[11px] text-gray-700">
      {children}
    </span>
  );
}
