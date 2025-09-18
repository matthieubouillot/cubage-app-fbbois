// apps/web/src/pages/chantiers/SaisieTab.tsx
import React, { forwardRef, useEffect, useRef, useState } from "react";
import {
  listSaisies,
  createSaisie,
  updateSaisie,
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
  onMutated,
}: {
  chantierId: string;
  qualiteId: string;
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
      await updateSaisie(showEdit.id, {
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
      await deleteSaisie(id);
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

      {/* bouton flottant mobile */}
      <BtnPrimary
        onClick={openAdd}
        className="lg:hidden fixed bottom-20 right-6 z-40 w-14 h-14 rounded-full text-2xl p-0"
        aria-label="Ajouter"
      >
        +
      </BtnPrimary>

      {/* tableau desktop */}
      <div className="hidden lg:block mx-auto bg-white border rounded-xl overflow-x-auto shadow-sm">
        <table className="text-sm table-fixed">
          <colgroup>
            <col className="w-[7%]" /> {/* N° */}
            <col className="w-[10%]" /> {/* Date */}
            <col className="w-[10%]" /> {/* LONG */}
            <col className="w-[10%]" /> {/* DIAM */}
            <col className="w-[14%]" /> {/* < V1 */}
            <col className="w-[14%]" /> {/* V1–V2 */}
            <col className="w-[14%]" /> {/* ≥ V2 */}
            <col className="w-[16%]" /> {/* Annotation */}
            <col className="w-[5%]" /> {/* Actions */}
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
                  <Td
                    title={`Bûcheron : ${who}`}
                    aria-label={`Bûcheron : ${who}`}
                    className="tabular-nums"
                  >
                    {r.numero}
                  </Td>
                  <Td className="tabular-nums">{fmtDate(r.date)}</Td>
                  <Td className="tabular-nums">
                    {Number(r.longueur).toLocaleString("fr-FR")}
                  </Td>
                  <Td className="tabular-nums">
                    {Number(r.diametre).toLocaleString("fr-FR")}
                  </Td>
                  <Td className="tabular-nums">{fmt3(r.volLtV1)}</Td>
                  <Td className="tabular-nums">{fmt3(r.volBetweenV1V2)}</Td>
                  <Td className="tabular-nums">{fmt3(r.volGeV2)}</Td>
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
                        Éditer
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

      {/* cartes mobile (toujours actives en paysage) */}
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
              <Info
                label="< V1"
                value={fmt3(r.volLtV1)}
                className="text-center"
              />
              <Info
                label="V1–V2"
                value={fmt3(r.volBetweenV1V2)}
                className="text-center"
              />
              <Info
                label="≥ V2"
                value={fmt3(r.volGeV2)}
                className="text-center"
              />
            </div>

            {/* Annotation */}
            <div className="mt-2">
              <Info
                label="Annotation"
                value={r.annotation || "—"}
                className="w-full"
              />
            </div>

            {/* Actions */}
            <div className="mt-2 flex justify-end gap-2">
              <BtnPrimary
                className="px-3 py-1.5 text-xs"
                onClick={() => openEdit(r)}
              >
                Éditer
              </BtnPrimary>
              <BtnDanger
                className="px-3 py-1.5 text-xs"
                onClick={() => remove(r.id)}
              >
                Suppr.
              </BtnDanger>
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

      {/* Modal éditer */}
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
