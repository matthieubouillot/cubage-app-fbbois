import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchChantiers,
  deleteChantier,
  type ChantierListItem,
} from "../../features/chantiers/api";
import { getUser } from "../../features/auth/auth";
import { twMerge } from "tailwind-merge";
import MobileBack from "../../components/MobileBack";

/* Helper date: JJ/MM/AAAA HH:MM (une seule ligne) */
function formatDateTime(value: string | number | Date) {
  const d = new Date(value);
  const date = d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

export default function ChantiersList() {
  const [rows, setRows] = useState<ChantierListItem[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const nav = useNavigate();
  const u = getUser();
  const isSupervisor = u?.role === "SUPERVISEUR";
  const [offline, setOffline] = useState<boolean>(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

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
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const onReconnected = () => refresh();
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("cubage:reconnected", onReconnected as any);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("cubage:reconnected", onReconnected as any);
    };
  }, []);

  const onDelete = async (id: string) => {
    if (!isSupervisor) return;
    if (!window.confirm("Supprimer ce chantier ?")) return;
    try {
      setDeletingId(id);
      setRows((prev) => prev?.filter((r) => r.id !== id) ?? null); // optimiste
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
        {isSupervisor && !offline && (
          <MobileBack fallback="/home" variant="fixed" className="md:hidden" />
        )}

        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Chantiers
          </h1>
          <div className="text-sm text-gray-500">
            {rows ? `${rows.length} chantier(s)` : "Chargement…"}
          </div>

          {isSupervisor && !offline && (
            <div className="hidden md:flex justify-center">
              <button
                onClick={() => nav("/chantiers/nouveau")}
                className="inline-flex items-center gap-2 rounded-full bg-black text-white px-6 py-2.5 text-sm shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-[0.98] transition"
                title="Nouveau chantier"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Nouveau chantier</span>
              </button>
            </div>
          )}
        </header>

        {err && <p className="text-center text-sm text-red-600">{err}</p>}

        {/* MOBILE */}
        <div className="md:hidden space-y-4">
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
                className="bg-white border rounded-2xl shadow-sm px-4 py-5"
              >
                <div className="mx-auto max-w-[320px] text-center">
                  <div className="space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                      Référence du lot
                    </div>
                    <div className="font-semibold text-base">
                      {r.referenceLot}
                    </div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                      Propriétaire
                    </div>
                    <div className="font-medium">{owner}</div>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">
                      Localisation
                    </div>
                    <div className="font-medium">{localisation}</div>
                  </div>

                  {isSupervisor && !offline && (
                    <div className="mt-3">
                      <div className="text-[11px] uppercase tracking-wide text-gray-500">
                        Bûcherons
                      </div>
                      {r.bucherons?.length ? (
                        <div className="mt-2 flex justify-center">
                          <AvatarStack
                            people={r.bucherons.map((b) => ({
                              id: b.id,
                              name: `${b.firstName} ${b.lastName}`,
                            }))}
                            max={6}
                            size={30}
                            overlap={10}
                            trigger="click"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Aucun</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-center gap-3">
  <Link
    to={`/chantiers/${r.id}`}
    className={iosIconBtn + " h-[36px] w-[36px]"}
    aria-label="Ouvrir"
    title="Ouvrir"
  >
    <EyeIcon className="h-4 w-4" />
  </Link>

  {isSupervisor && !offline && (
    <>
      <Link
        to={`/chantiers/${r.id}/modifier`}
        className={iosIconBtnLight + " h-[36px] w-[36px]"}
        aria-label="Modifier"
        title="Modifier"
      >
        <PencilIcon className="h-4 w-4" />
      </Link>

      <button
        onClick={() => onDelete(r.id)}
        disabled={deletingId === r.id}
        className={twMerge(
          iosIconBtnDanger + " h-[36px] w-[36px]",
          deletingId === r.id && "opacity-60 cursor-wait",
        )}
        aria-label="Supprimer"
        title="Supprimer"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </>
  )}
</div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP (sans overflow) */}
        {rows && rows.length > 0 && (
         <div className="hidden md:block">
         <div className="mx-auto bg-white border rounded-2xl shadow-sm w-full overflow-hidden">
           <table className="w-full text-sm text-center table-fixed rounded-t-2xl overflow-hidden">
             <thead className="bg-gray-50">
               <tr>
                 <Th>Référence</Th>
                 <Th>Convention</Th>
                 <Th>Propriétaire</Th>
                 <Th>Localisation</Th>
                 {isSupervisor && <Th>Bûcherons</Th>}
                 <Th>Date</Th>
                 <Th>Actions</Th>
               </tr>
             </thead>
             <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/50">
        {rows.map((r) => {
          const owner =
            (r.proprietaireFirstName ? r.proprietaireFirstName + " " : "") +
            r.proprietaire;
          const localisation = r.lieuDit
            ? `${r.commune} (${r.lieuDit})`
            : r.commune;

          return (
            <tr key={r.id} className="border-t border-gray-200 text-center">
              <Td className="align-middle break-words">{r.referenceLot}</Td>
              <Td className="align-middle break-words">{r.convention}</Td>
              <Td className="align-middle break-words">{owner}</Td>
              <Td className="align-middle break-words">{localisation}</Td>

              {isSupervisor && (
                <Td className="align-middle">
                  <AvatarStack
                    people={
                      r.bucherons?.map((b) => ({
                        id: b.id,
                        name: `${b.firstName} ${b.lastName}`,
                      })) || []
                    }
                    max={5}
                    size={30}
                    overlap={10}
                    trigger="click"
                  />
                </Td>
              )}

              <Td className="align-middle whitespace-nowrap">
                {new Date(r.createdAt).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Td>

              <Td className="align-middle">
                <div className="flex items-center justify-center gap-2">
                  <Link
                    to={`/chantiers/${r.id}`}
                    className={iosIconBtn + " h-[30px] w-[30px]"}
                    title="Ouvrir"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>

                  {isSupervisor && !offline && (
                    <>
                      <Link
                        to={`/chantiers/${r.id}/modifier`}
                        className={iosIconBtnLight + " h-[30px] w-[30px]"}
                        title="Modifier"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => onDelete(r.id)}
                        disabled={deletingId === r.id}
                        className={twMerge(
                          iosIconBtnDanger + " h-[30px] w-[30px]",
                          deletingId === r.id && "opacity-60 cursor-wait",
                        )}
                        title="Supprimer"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </>
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

        {rows && rows.length === 0 && (
          <div className="hidden md:block text-center text-sm text-gray-600">
            Aucun chantier.
          </div>
        )}
      </div>

{/* FAB mobile en bas droite — même taille que les avatars */}
{isSupervisor && !offline && (
  <button
    onClick={() => nav("/chantiers/nouveau")}
    className={twMerge(
      "inline-flex items-center justify-center rounded-full bg-black text-white h-[36px] w-[36px] shadow-[0_6px_16px_rgba(0,0,0,0.15)] active:scale-[0.98] transition fixed bottom-6 right-6 z-40 md:hidden",
    )}
    aria-label="Nouveau chantier"
    title="Nouveau chantier"
  >
    <PlusIcon className="h-4 w-4" />
  </button>
)}
    </div>
  );
}

/* ——— UI helpers ——— */
function Th(props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <th
      className={twMerge(
        "px-4 py-3 text-center whitespace-nowrap text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-200",
        className
      )}
      {...rest}
    />
  );
}

function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <td
      className={twMerge(
        "px-4 py-3.5 align-top text-center whitespace-normal break-words",
        className
      )}
      {...rest}
    />
  );
}

/* ——— Boutons iOS (mobile) ——— */
const iosIconBase =
  "inline-flex items-center justify-center rounded-full h-11 w-11 shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition";
const iosIconBtn = iosIconBase + " bg-black text-white";
const iosIconBtnLight =
  iosIconBase + " bg-white text-gray-900 border border-gray-300";
const iosIconBtnDanger =
  iosIconBase + " bg-white text-red-700 border border-red-500";

/* ——— Boutons desktop ——— */
const deskBase =
  "px-3 py-1.5 rounded-full text-sm transition active:scale-[0.985] select-none";
const deskPrimaryBtn =
  deskBase + " bg-black text-white shadow-sm hover:opacity-90";
const deskSecondaryBtn = deskBase + " border border-gray-300 hover:bg-gray-50";
const deskDestructiveBtn =
  deskBase + " border border-red-600 text-red-700 hover:bg-red-50";

/* ——— Modale centrée ——— */
function CenterModal({
  open,
  onClose,
  title,
  children,
  maxW = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxW?: "max-w-sm" | "max-w-md" | "max-w-lg" | "max-w-xl";
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={boxRef}
        className={twMerge(
          "relative w-full bg-white rounded-2xl shadow-2xl",
          maxW,
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
        <div className="p-4">{children}</div>
        <div className="p-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

/* ——— AvatarStack ——— */
function AvatarStack({
  people,
  max = 5,
  size = 30,
  overlap = 10,
  trigger = "click",
  className = "",
}: {
  people: { id: string; name: string }[];
  max?: number;
  size?: number;
  overlap?: number;
  trigger?: "click" | "none";
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  const circleStyle: React.CSSProperties = {
    width: size,
    height: size,
    fontSize: Math.max(11, Math.round(size * 0.4)),
    lineHeight: `${size}px`,
  };

  const handleOpen = () => {
    if (trigger === "click") setOpen(true);
  };

  return (
    <>
      <div className={twMerge("relative flex items-center", className)}>
        <div className="flex">
          {shown.map((p, i) => {
            const initials = getInitials(p.name);
            const ml = i === 0 ? 0 : -overlap;
            return (
              <button
                type="button"
                key={p.id}
                className="relative"
                style={{ marginLeft: ml }}
                onClick={handleOpen}
                title={p.name}
                aria-label={p.name}
              >
                <div
                  className="rounded-full bg-gray-800 text-white flex items-center justify-center ring-2 ring-white shadow-sm hover:z-20 cursor-pointer select-none"
                  style={circleStyle}
                >
                  {initials}
                </div>
              </button>
            );
          })}

          {rest > 0 && (
            <button
              type="button"
              className="relative"
              style={{ marginLeft: shown.length ? -overlap : 0 }}
              onClick={handleOpen}
              title={people
                .slice(max)
                .map((p) => p.name)
                .join(", ")}
              aria-label={`Plus ${rest} bûcheron(s)`}
            >
              <div
                className="rounded-full bg-gray-200 text-gray-700 flex items-center justify-center ring-2 ring-white shadow-sm hover:z-20 cursor-pointer select-none"
                style={circleStyle}
              >
                +{rest}
              </div>
            </button>
          )}
        </div>
      </div>

      <CenterModal
        open={open}
        onClose={() => setOpen(false)}
        title={`Bûcherons (${people.length})`}
        maxW="max-w-md"
      >
        <ul className="max-h-[60vh] overflow-auto">
          {people.map((p) => (
            <li key={p.id} className="py-2 flex items-center gap-2">
              <div
                className="rounded-full bg-gray-800 text-white flex items-center justify-center shrink-0"
                style={{
                  width: 32,
                  height: 32,
                  lineHeight: "32px",
                  fontSize: 12,
                }}
                aria-hidden
              >
                {getInitials(p.name)}
              </div>
              <span className="text-sm">{p.name}</span>
            </li>
          ))}
        </ul>
      </CenterModal>
    </>
  );
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

/* ——— Icônes ——— */
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function EyeIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M3 21l3.75-.75L20.5 6.5a2.12 2.12 0 0 0-3-3L3.75 17.25 3 21Z" stroke="currentColor" strokeWidth="2" />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path d="M4 7h16M9 7V5h6v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}