import React, { forwardRef, useEffect, useRef, useState } from "react";
import {
  listSaisies,
  createSaisie,
  updateSaisieWithContext,
  deleteSaisie,
  type SaisieRow,
} from "../../features/saisies/api";
import { twMerge } from "tailwind-merge";

/* ───────── helpers ───────── */
function fmt3(v?: number | null) {
  return v != null
    ? Number(v).toLocaleString("fr-FR", {
        minimumFractionDigits: 3,
        maximumFractionDigits: 3,
      })
    : "";
}
const onlyNum = (s: string) => s.replace(/[^\d.,]/g, "");
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });

/* ───────── UI atoms ───────── */
const BtnPrimary = ({
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={twMerge(
      "inline-flex items-center justify-center rounded-full bg-black text-white px-4 py-2 text-sm disabled:opacity-60",
      className,
    )}
    {...rest}
  />
);

const BtnDanger = ({
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    className={twMerge(
      "inline-flex items-center justify-center rounded-full border border-red-600 text-red-700 px-4 py-2 text-sm hover:bg-red-50",
      className,
    )}
    {...rest}
  />
);

const LabeledInput = forwardRef<
  HTMLInputElement,
  {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
    autoFocus?: boolean;
    className?: string;
  }
>(
  (
    {
      label,
      value,
      onChange,
      placeholder,
      inputMode,
      autoFocus,
      className = "",
    },
    ref,
  ) => {
    return (
      <label className={twMerge("block", className)}>
        <div className="text-xs text-gray-600 mb-1">{label}</div>
        <input
          ref={ref}
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          inputMode={inputMode}
          autoFocus={autoFocus}
        />
      </label>
    );
  },
);
LabeledInput.displayName = "LabeledInput";

function Th(props: React.ThHTMLAttributes<HTMLTableHeaderCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <th
      className={twMerge(
        "px-3 py-2 text-center whitespace-nowrap text-xs font-medium text-gray-600 uppercase tracking-wide border-b border-gray-200",
        className,
      )}
      {...rest}
    />
  );
}
function Td(props: React.TdHTMLAttributes<HTMLTableCellElement>) {
  const { className = "", ...rest } = props;
  return (
    <td
      className={twMerge("px-3 py-2 align-middle text-center", className)}
      {...rest}
    />
  );
}

/* ───────── Boutons iOS (mobile) ───────── */
const iosIconBase =
  "inline-flex items-center justify-center rounded-full h-11 w-11 shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition";
const iosIconBtn = iosIconBase + " bg-black text-white"; // FAB mobile identique UsersPage
const iosIconBtnLight =
  iosIconBase + " bg-white text-gray-900 border border-gray-300";
const iosIconBtnDanger =
  iosIconBase + " bg-white text-red-700 border border-red-500";

/* ───────── Modal ───────── */
function Modal({
  open,
  onClose,
  title,
  children,
  onSubmit,
  submitLabel = "Enregistrer",
  maxWidth = "max-w-md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSubmit: () => void;
  submitLabel?: string;
  maxWidth?: "max-w-sm" | "max-w-md" | "max-w-lg";
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={twMerge(
          "relative w-full bg-white rounded-2xl shadow-2xl",
          maxWidth,
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">
            ✕
          </button>
        </div>
        <div className="p-4 space-y-4">{children}</div>
        <div className="p-4 border-t flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-200"
          >
            Annuler
          </button>
          <BtnPrimary onClick={onSubmit}>{submitLabel}</BtnPrimary>
        </div>
      </div>
    </div>
  );
}

/* ───────── Main ───────── */
export default function SaisieTab({
  chantierId,
  qualiteId,
  ecorcePercent = 0,
  onMutated,
}: {
  chantierId: string;
  qualiteId: string;
  ecorcePercent?: number;
  onMutated?: () => void;
}) {
  const [rows, setRows] = useState<SaisieRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // modals
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState<null | SaisieRow>(null);

  // forms
  const [addForm, setAddForm] = useState({
    longueur: "",
    diametre: "",
    annotation: "",
  });
  const [editForm, setEditForm] = useState({
    longueur: "",
    diametre: "",
    annotation: "",
  });

  const addLongRef = useRef<HTMLInputElement>(null);

  async function refresh() {
    const data = await listSaisies(chantierId, qualiteId);
    setRows(data);
  }

  useEffect(() => {
    setRows(null);
    setErr(null);
    refresh().catch((e) => setErr(e.message || "Erreur de chargement"));
    const onUpdated = () => refresh().catch(() => {});
    window.addEventListener("cubage:offline-updated", onUpdated as any);
    return () => window.removeEventListener("cubage:offline-updated", onUpdated as any);
  }, [chantierId, qualiteId]);

  /* add */
  function openAdd() {
    setAddForm({ longueur: "", diametre: "", annotation: "" });
    setShowAdd(true);
    setTimeout(() => addLongRef.current?.focus(), 60);
  }
  async function submitAdd() {
    try {
      const longueur = parseFloat(onlyNum(addForm.longueur).replace(",", "."));
      const diametre = parseFloat(onlyNum(addForm.diametre).replace(",", "."));
      if (
        !isFinite(longueur) ||
        !isFinite(diametre) ||
        longueur <= 0 ||
        diametre <= 0
      ) {
        throw new Error(
          "Longueur et diamètre doivent être des nombres positifs.",
        );
      }
      await createSaisie({
        chantierId,
        qualiteId,
        longueur,
        diametre,
        annotation: addForm.annotation.trim() || undefined,
      });
      setShowAdd(false);
      await refresh();
      onMutated?.();
    } catch (e: any) {
      setErr(e.message || "Erreur lors de l’ajout");
    }
  }

  /* edit */
  function openEdit(row: SaisieRow) {
    setShowEdit(row);
    setEditForm({
      longueur: String(row.longueur).replace(".", ","),
      diametre: String(row.diametre).replace(".", ","),
      annotation: row.annotation || "",
    });
  }
  async function submitEdit() {
    if (!showEdit) return;
    try {
      const longueur = parseFloat(onlyNum(editForm.longueur).replace(",", "."));
      const diametre = parseFloat(onlyNum(editForm.diametre).replace(",", "."));
      if (
        !isFinite(longueur) ||
        !isFinite(diametre) ||
        longueur <= 0 ||
        diametre <= 0
      ) {
        throw new Error(
          "Longueur et diamètre doivent être des nombres positifs.",
        );
      }
      await updateSaisieWithContext(showEdit.id, chantierId, qualiteId, {
        longueur,
        diametre,
        annotation: editForm.annotation.trim() || undefined,
      });
      setShowEdit(null);
      await refresh();
      onMutated?.();
    } catch (e: any) {
      setErr(e.message || "Erreur lors de la modification");
    }
  }

  /* delete */
  async function remove(id: string) {
    try {
      if (!window.confirm("Supprimer cette ligne ?")) return;
      await deleteSaisie(id, chantierId, qualiteId);
      await refresh();
      onMutated?.();
    } catch (e: any) {
      setErr(e.message || "Erreur lors de la suppression");
    }
  }

  return (
    <div className="w-full max-w-[1100px] mx-auto space-y-6 relative">
      {/* action bar desktop */}
      <div className="hidden lg:flex justify-center">
        <BtnPrimary onClick={openAdd}>Ajouter une saisie</BtnPrimary>
      </div>

      {/* FAB mobile — identique UsersPage */}
      <button
        onClick={openAdd}
        className={twMerge(iosIconBtn, "fixed bottom-6 right-6 z-40 lg:hidden")}
        aria-label="Ajouter une saisie"
        title="Ajouter une saisie"
      >
        <PlusIcon className="h-6 w-6" />
      </button>

      {/* tableau desktop */}
      <div className="hidden lg:block mx-auto bg-white border rounded-xl overflow-x-auto shadow-sm">
        <table className="text-sm table-fixed">
          <colgroup>
            <col className="w-[7%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[10%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[14%]" />
            <col className="w-[16%]" />
            <col className="w-[5%]" />
          </colgroup>
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <Th>N°</Th>
              <Th>Date</Th>
              <Th>LONG.</Th>
              <Th>DIAM</Th>
              <Th>vol. &lt; V1</Th>
              <Th>V1 ≤ vol. &lt; V2</Th>
              <Th>vol. ≥ V2</Th>
              <Th>Annotation</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/60">
            {!rows && (
              <tr>
                <Td colSpan={9} className="py-4 text-gray-600">
                  Chargement…
                </Td>
              </tr>
            )}
            {rows && rows.length === 0 && (
              <tr>
                <Td colSpan={9} className="py-4 text-gray-600">
                  Aucune saisie.
                </Td>
              </tr>
            )}
            {rows?.map((r) => {
              const who = r.user
                ? `${r.user.firstName} ${r.user.lastName}`
                : "—";
              return (
                <tr key={r.id} className="border-b border-gray-100">
                  <Td title={`${who}`} className="tabular-nums">
                    {r.numero}
                  </Td>
                  <Td className="tabular-nums">{fmtDate(r.date)}</Td>
                  <Td className="tabular-nums">
                    {Number(r.longueur).toLocaleString("fr-FR")}
                  </Td>
                  <Td className="tabular-nums">
                    {Number(r.diametre).toLocaleString("fr-FR")}
                  </Td>
                {renderVolCells(r, ecorcePercent)}
                  <Td className="max-w-[320px]">
                    <span
                      className="truncate inline-block w-full"
                      title={r.annotation || ""}
                    >
                      {r.annotation || "—"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-center gap-2">
                      <BtnPrimary
                        className="px-3 py-1.5 text-xs"
                        onClick={() => openEdit(r)}
                      >
                        Modifier
                      </BtnPrimary>
                      <BtnDanger
                        className="px-3 py-1.5 text-xs"
                        onClick={() => remove(r.id)}
                      >
                        Suppr.
                      </BtnDanger>
                    </div>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* cartes mobile (style iOS pour les actions) */}
      <div className="lg:hidden space-y-3">
        {!rows && (
          <div className="text-center py-3 text-gray-600 bg-white border rounded-xl">
            Chargement…
          </div>
        )}
        {rows && rows.length === 0 && (
          <div className="text-center py-3 text-gray-600 bg-white border rounded-xl">
            Aucune saisie.
          </div>
        )}
        {rows?.map((r) => (
          <div key={r.id} className="bg-white border rounded-xl p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                N° {r.numero}
                {r.user && (
                  <span className="text-gray-400">
                    {" "}
                    — {r.user.firstName} {r.user.lastName}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{fmtDate(r.date)}</div>
            </div>

            {/* LONG + DIAM */}
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-center">
              <Info
                label="LONG."
                value={Number(r.longueur).toLocaleString("fr-FR")}
              />
              <Info
                label="DIAM."
                value={Number(r.diametre).toLocaleString("fr-FR")}
              />
            </div>

            {/* V1 strip */}
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              {renderVolCards(r, ecorcePercent)}
            </div>

            {/* Annotation */}
            <div className="mt-2">
              <Info
                label="Annotation"
                value={r.annotation || "—"}
                className="w-full"
              />
            </div>

            {/* Actions iOS centrées */}
            <div className="mt-3 flex items-center justify-center gap-3">
              <button
                className={iosIconBtnLight}
                onClick={() => openEdit(r)}
                aria-label="Modifier"
                title="Modifier"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                className={iosIconBtnDanger}
                onClick={() => remove(r.id)}
                aria-label="Supprimer"
                title="Supprimer"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {err && <div className="text-center text-sm text-red-600">{err}</div>}

      {/* Modal ajouter */}
      <Modal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        title="Ajouter une saisie"
        onSubmit={submitAdd}
        submitLabel="Ajouter"
        maxWidth="max-w-md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledInput
            label="LONG. (m)"
            value={addForm.longueur}
            onChange={(v) =>
              setAddForm((s) => ({ ...s, longueur: onlyNum(v) }))
            }
            placeholder="ex: 6,5"
            inputMode="decimal"
            autoFocus
            ref={addLongRef}
          />
          <LabeledInput
            label="DIAM. (cm)"
            value={addForm.diametre}
            onChange={(v) =>
              setAddForm((s) => ({ ...s, diametre: onlyNum(v) }))
            }
            placeholder="ex: 22"
            inputMode="decimal"
          />
          <div className="sm:col-span-2">
            <LabeledInput
              label="Annotation"
              value={addForm.annotation}
              onChange={(v) => setAddForm((s) => ({ ...s, annotation: v }))}
              placeholder="Optionnel"
            />
          </div>
        </div>
      </Modal>

      {/* Modal modifier */}
      <Modal
        open={!!showEdit}
        onClose={() => setShowEdit(null)}
        title={`Modifier N° ${showEdit?.numero ?? ""}`}
        onSubmit={submitEdit}
        maxWidth="max-w-md"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <LabeledInput
            label="LONG. (m)"
            value={editForm.longueur}
            onChange={(v) =>
              setEditForm((s) => ({ ...s, longueur: onlyNum(v) }))
            }
            placeholder="ex: 6,5"
            inputMode="decimal"
          />
          <LabeledInput
            label="DIAM. (cm)"
            value={editForm.diametre}
            onChange={(v) =>
              setEditForm((s) => ({ ...s, diametre: onlyNum(v) }))
            }
            placeholder="ex: 22"
            inputMode="decimal"
          />
          <div className="sm:col-span-2">
            <LabeledInput
              label="Annotation"
              value={editForm.annotation}
              onChange={(v) => setEditForm((s) => ({ ...s, annotation: v }))}
              placeholder="Optionnel"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* petits blocs d’info */
function Info({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={twMerge("bg-gray-50 rounded-lg px-3 py-2", className)}>
      <div className="text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="font-medium text-center">{value || "—"}</div>
    </div>
  );
}

/* ───────── Icônes SVG ───────── */
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* ——— Offline volume helpers ——— */
function computeVolNet(longueur: number, diametre: number, ecorcePercent: number) {
  const dM = Math.max(0, Number(diametre)) / 100;
  const base = Math.PI * Math.pow(dM / 2, 2) * Math.max(0, Number(longueur));
  const factor = 1 - Math.max(0, Math.min(100, ecorcePercent)) / 100;
  return base * factor;
}
function getVolLtV1(r: SaisieRow, ecorcePercent: number) {
  if (r.volLtV1 != null && r.volLtV1 > 0) return r.volLtV1;
  if ((r.volBetweenV1V2 ?? 0) > 0 || (r.volGeV2 ?? 0) > 0) return 0;
  const vol = computeVolNet(r.longueur, r.diametre, ecorcePercent);
  return vol < 0.25 ? vol : 0;
}
function getVolBetween(r: SaisieRow, ecorcePercent: number) {
  if (r.volBetweenV1V2 != null && r.volBetweenV1V2 > 0) return r.volBetweenV1V2;
  if ((r.volLtV1 ?? 0) > 0 || (r.volGeV2 ?? 0) > 0) return 0;
  const vol = computeVolNet(r.longueur, r.diametre, ecorcePercent);
  return vol >= 0.25 && vol < 0.5 ? vol : 0;
}
function getVolGeV2(r: SaisieRow, ecorcePercent: number) {
  if (r.volGeV2 != null && r.volGeV2 > 0) return r.volGeV2;
  if ((r.volLtV1 ?? 0) > 0 || (r.volBetweenV1V2 ?? 0) > 0) return 0;
  const vol = computeVolNet(r.longueur, r.diametre, ecorcePercent);
  return vol >= 0.5 ? vol : 0;
}

function renderVolCells(r: SaisieRow, ecorcePercent: number) {
  const a = getVolLtV1(r, ecorcePercent);
  const b = getVolBetween(r, ecorcePercent);
  const c = getVolGeV2(r, ecorcePercent);
  const cells = [
    <Td key="a" className="tabular-nums">{a ? fmt3(a) : ""}</Td>,
    <Td key="b" className="tabular-nums">{b ? fmt3(b) : ""}</Td>,
    <Td key="c" className="tabular-nums">{c ? fmt3(c) : ""}</Td>,
  ];
  return cells;
}

function renderVolCards(r: SaisieRow, ecorcePercent: number) {
  const a = getVolLtV1(r, ecorcePercent);
  const b = getVolBetween(r, ecorcePercent);
  const c = getVolGeV2(r, ecorcePercent);
  return (
    <>
      <Info label="< V1" value={a ? fmt3(a) : ""} className="text-center" />
      <Info label="V1–V2" value={b ? fmt3(b) : ""} className="text-center" />
      <Info label=">= V2" value={c ? fmt3(c) : ""} className="text-center" />
    </>
  );
}
function PencilIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M3 21l3.75-.75L20.5 6.5a2.12 2.12 0 0 0-3-3L3.75 17.25 3 21Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path d="M14.5 6.5l3 3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function TrashIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M4 7h16M9 7V5h6v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
