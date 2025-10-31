import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type UserDTO,
  type Role,
  type CreateUserPayload,
  type UpdateUserPayload,
} from "../../features/users/api";
import MobileBack from "../../components/MobileBack";



/* ───────── Constantes ───────── */
const ROLES: Role[] = ["SUPERVISEUR", "BUCHERON", "DEBARDEUR"];
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/; // lettres + espace/’/-
const PHONE_RE = /^\d{6,}$/; // chiffres uniquement (>=6)

/* ───────── Page ───────── */
export default function UsersPage() {
  const [rows, setRows] = useState<UserDTO[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<UserDTO | null>(null);

  async function refresh() {
    try {
      setErr(null);
      const data = await listUsers();
      // tri par plage num (numStart asc puis numEnd asc)
      data.sort((a, b) => a.numStart - b.numStart || a.numEnd - b.numEnd);
      setRows([...data]);
    } catch (e: any) {
      setErr(e.message || "Erreur de chargement");
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Barre retour mobile — flottant, toujours visible */}
        <MobileBack fallback="/home" variant="fixed" />

        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Utilisateurs
          </h1>
          <div className="text-sm text-gray-500">
            {rows ? `${rows.length} utilisateur(s)` : "Chargement…"}
          </div>

          {/* Bouton desktop */}
          <div className="hidden sm:flex justify-center">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-sm shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              Nouvel utilisateur
            </button>
          </div>
        </header>

        {err && <p className="text-center text-sm text-red-600">{err}</p>}

        {/* MOBILE — cartes + actions iOS */}
        <div className="sm:hidden space-y-4 pb-28">
          {!rows && !err && (
            <div className="text-center text-sm text-gray-600">Chargement…</div>
          )}
          {rows?.length === 0 && (
            <div className="text-center text-sm text-gray-600">
              Aucun utilisateur.
            </div>
          )}

          {rows?.map((u) => (
            <div
              key={u.id}
              className="bg-white border rounded-2xl p-4 shadow-sm"
            >
              <div className="text-base font-semibold text-center">
                {u.lastName} {u.firstName}
              </div>
              <div className="mt-1 text-center text-xs">
                <div className="flex flex-wrap justify-center gap-1">
                  {u.roles.map((role, index) => (
                    <span key={index} className="px-2 py-0.5 rounded-full border text-[10px] uppercase">
                      {role}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-center">
                <div className="text-xs text-gray-500">{u.email}</div>
                <div className="text-xs text-gray-500">{u.phone}</div>
                <div className="text-[11px] text-gray-500">
                  Plage: <b>{u.numStart}</b> — <b>{u.numEnd}</b>
                </div>
              </div>

              {/* Actions iOS centrées */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setEditing(u)}
                  className={iosIconBtnLight}
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <MobileDeleteButton id={u.id} onDone={refresh} />
              </div>
            </div>
          ))}

          {/* Bouton flottant + (mobile) */}
          <button
            onClick={() => setShowCreate(true)}
            className={twMerge(iosIconBtn, "fixed bottom-6 right-6 z-40")}
            aria-label="Créer un utilisateur"
            title="Créer un utilisateur"
          >
            <PlusIcon className="h-6 w-6" />
          </button>
        </div>

        {/* DESKTOP — tableau */}
        {rows && rows.length > 0 && (
          <div className="hidden sm:block">
            <div className="mx-auto bg-white border rounded-2xl shadow-sm overflow-x-auto w-full">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Nom</Th>
                    <Th>Rôle</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th className="text-center">Plage num.</Th>
                    <Th className="text-center w-[220px]">Actions</Th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/50">
                  {rows.map((u) => (
                    <tr key={u.id} className="border-t border-gray-200">
                      <Td>
                        <div className="font-medium">
                          {u.lastName} {u.firstName}
                        </div>
                      </Td>
                      <Td className="uppercase text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.map((role, index) => (
                            <span key={index} className="px-2 py-0.5 rounded-full border">
                              {role}
                            </span>
                          ))}
                        </div>
                      </Td>
                      <Td className="text-gray-700">{u.email}</Td>
                      <Td className="text-gray-700">{u.phone}</Td>
                      <Td className="text-center">
                        <span className="font-medium">
                          {u.numStart} — {u.numEnd}
                        </span>
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditing(u)}
                            className={iosIconBtnLight + " h-[30px] w-[30px]"}
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Supprimer cet utilisateur ?")) return;
                              try {
                                await deleteUser(u.id);
                                await refresh();
                              } catch (e: any) {
                                console.error("Erreur suppression:", e);
                              }
                            }}
                            className={iosIconBtnDanger + " h-[30px] w-[30px]"}
                            title="Supprimer"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {showCreate && (
        <UserModal
          mode="create"
          title="Créer un utilisateur"
          onClose={() => setShowCreate(false)}
          onSubmit={async (payload) => {
            await createUser(payload);
            setShowCreate(false);
            await refresh();
          }}
        />
      )}

      {editing && (
        <UserModal
          mode="edit"
          title={`Modifier ${editing.lastName} ${editing.firstName}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateUser(editing.id, payload);
            setEditing(null);
            await refresh();
          }}
        />
      )}
    </div>
  );
}


/* ───────── UI helpers tableau ───────── */
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

/* ───────── Boutons iOS (mobile) ───────── */
const iosIconBase =
  "inline-flex items-center justify-center rounded-full h-9 w-9 shadow-[0_8px_20px_rgba(0,0,0,0.12)] active:scale-[0.98] transition";
const iosIconBtn = iosIconBase + " bg-black text-white";
const iosIconBtnLight =
  iosIconBase + " bg-white text-gray-900 border border-gray-300";
const iosIconBtnDanger =
  iosIconBase + " bg-white text-red-700 border border-red-500";


/* Version iOS (mobile) */
function MobileDeleteButton({
  id,
  onDone,
}: {
  id: string;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      disabled={busy}
      onClick={async () => {
        if (!window.confirm("Supprimer cet utilisateur ?")) return;
        try {
          setBusy(true);
          await deleteUser(id);
          onDone();
        } finally {
          setBusy(false);
        }
      }}
      className={twMerge(iosIconBtnDanger, busy && "opacity-60 cursor-wait")}
      title="Supprimer"
      aria-label="Supprimer"
    >
      <TrashIcon className="h-4 w-4" />
    </button>
  );
}

/* ───────── Modal discriminée ───────── */
type BaseProps = { title: string; onClose: () => void };
type CreateProps = BaseProps & {
  mode: "create";
  initial?: undefined;
  onSubmit: (payload: CreateUserPayload) => Promise<void>;
};
type EditProps = BaseProps & {
  mode: "edit";
  initial: UserDTO;
  onSubmit: (payload: UpdateUserPayload) => Promise<void>;
};
type UserModalProps = CreateProps | EditProps;

function UserModal(props: UserModalProps) {
  const { title, onClose } = props;
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;

  const [firstName, setFirst] = useState(initial?.firstName ?? "");
  const [lastName, setLast] = useState(initial?.lastName ?? "");
  const [roles, setRoles] = useState<Role[]>(initial?.roles ?? ["BUCHERON"]);
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [numStart, setStart] = useState(
    initial ? String(initial.numStart) : "",
  );
  const [numEnd, setEnd] = useState(initial ? String(initial.numEnd) : "");
  const [password, setPwd] = useState("");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setErr(null);

      // Nettoyage inputs
      // Prénom/Nom: filtrer à la frappe dans les inputs; ici on revalide
      if (!NAME_RE.test(firstName))
        throw new Error("Prénom invalide (lettres uniquement).");
      if (!NAME_RE.test(lastName))
        throw new Error("Nom invalide (lettres uniquement).");

      // Téléphone: chiffres uniquement (>=6)
      if (!PHONE_RE.test(phone))
        throw new Error("Téléphone invalide (chiffres uniquement).");

      const nStart = parseInt(numStart, 10);
      const nEnd = parseInt(numEnd, 10);
      if (!Number.isFinite(nStart) || !Number.isFinite(nEnd) || nStart > nEnd)
        throw new Error("Plage de numérotation invalide.");

      setBusy(true);

      if (isEdit) {
        const payload: UpdateUserPayload = {
          firstName,
          lastName,
          roles,
          phone,
          numStart: nStart,
          numEnd: nEnd,
        };
        await props.onSubmit(payload);
      } else {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email))
          throw new Error("Email invalide.");
        if (!password || password.length < 6)
          throw new Error("Mot de passe temporaire requis (≥ 6 caractères).");

        const payload: CreateUserPayload = {
          firstName,
          lastName,
          roles,
          email,
          phone,
          numStart: nStart,
          numEnd: nEnd,
          password,
        };
        await props.onSubmit(payload);
      }

      onClose();
    } catch (e: any) {
      setErr(e.message || "Erreur");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl">
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

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Prénom *">
              <Input
                value={firstName}
                onChange={(e) =>
                  setFirst(e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, ""))
                }
              />
            </Field>
            <Field label="Nom *">
              <Input
                value={lastName}
                onChange={(e) =>
                  setLast(e.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ' -]/g, ""))
                }
              />
            </Field>

            {!isEdit && (
              <Field label="Email *">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
            )}

            <Field label="Téléphone *">
              <Input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </Field>

            <Field label="Rôles *">
              <div className="space-y-2">
                {ROLES.map((r) => {
                  const checked = roles.includes(r);
                  return (
                    <label
                      key={r}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 cursor-pointer hover:bg-gray-50 ${
                        checked && "border-black/50 bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-black h-4 w-4"
                        checked={checked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setRoles(prev => [...prev, r]);
                          } else {
                            setRoles(prev => prev.filter(role => role !== r));
                          }
                        }}
                      />
                      <span className="font-medium text-sm">
                        {r}
                      </span>
                    </label>
                  );
                })}
              </div>
            </Field>

            {!isEdit && (
              <Field label="Mot de passe temporaire *">
                <Input
                  type="text"
                  value={password}
                  onChange={(e) => setPwd(e.target.value)}
                />
              </Field>
            )}

            <Field label="Numéro début *">
              <Input
                inputMode="numeric"
                value={numStart}
                onChange={(e) => setStart(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field label="Numéro fin *">
              <Input
                inputMode="numeric"
                value={numEnd}
                onChange={(e) => setEnd(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>

        <div className="p-4 border-t flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            disabled={busy}
            onClick={submit}
            className="rounded-full bg-black text-white px-4 py-1.5 text-sm disabled:opacity-60"
          >
            {busy ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────── Champs ───────── */
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
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return (
    <input
      className={twMerge(
        "w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20",
        className,
      )}
      {...rest}
    />
  );
}

/* ───────── Icônes inline ───────── */
function PlusIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
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
function ChevronLeftIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
