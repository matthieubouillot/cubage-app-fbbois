import { useEffect, useState } from "react";
import { fetchChantiers, type ChantierListItem } from "../../features/chantiers/api";
import { Link, useNavigate } from "react-router-dom";
import { getUser } from "../../features/auth/auth";

export default function ChantiersList() {
  const [rows, setRows] = useState<ChantierListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const nav = useNavigate();
  const u = getUser();

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchChantiers();
        setRows(data);
      } catch (e: any) {
        setErr(e.message || "Erreur");
      }
    })();
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chantiers</h1>
        {u?.role === "SUPERVISEUR" && (
          <button
            onClick={() => nav("/chantiers/nouveau")}
            className="rounded bg-black text-white px-3 py-1.5 text-sm"
          >
            Nouveau chantier
          </button>
        )}
      </div>

      {err && <p className="text-red-600 text-sm">{err}</p>}
      {!rows && !err && <p className="text-sm text-gray-600">Chargement…</p>}

      {rows && rows.length === 0 && <p className="text-sm text-gray-600">Aucun chantier.</p>}

      {rows && rows.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2">Référence</th>
                <th className="text-left px-3 py-2">Propriétaire</th>
                <th className="text-left px-3 py-2">Commune</th>
                <th className="text-left px-3 py-2">Essences</th>
                <th className="text-left px-3 py-2 w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2">{r.referenceLot}</td>
                  <td className="px-3 py-2">{r.proprietaire}</td>
                  <td className="px-3 py-2">{r.commune}</td>
                  <td className="px-3 py-2">
                    {r.essences.map(e => e.name).join(", ")}
                  </td>
                  <td className="px-3 py-2">
                    <Link to={`/chantiers/${r.id}`} className="underline">Ouvrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}