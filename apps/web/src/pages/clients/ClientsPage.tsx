import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  type ClientDTO,
  type CreateClientPayload,
  type UpdateClientPayload,
  type PropertyDTO,
  type CreatePropertyPayload,
} from "../../features/clients/api";
import MobileBack from "../../components/MobileBack";

/* ───────── Constantes ───────── */
const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/; // lettres + espace/'/-
const PHONE_RE = /^\d{6,}$/; // chiffres uniquement (>=6)

/* ───────── Page ───────── */
export default function ClientsPage() {
  const [rows, setRows] = useState<ClientDTO[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<ClientDTO | null>(null);
  const [showPropertiesModal, setShowPropertiesModal] = useState<ClientDTO | null>(null);
  const [editingProperty, setEditingProperty] = useState<{ client: ClientDTO; property: PropertyDTO | 'new' } | null>(null);

  async function refresh() {
    try {
      setErr(null);
      const data = await listClients();
      data.sort((a, b) => a.lastName.localeCompare(b.lastName) || a.firstName.localeCompare(b.firstName));
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
            Clients
          </h1>
          <div className="text-sm text-gray-500">
            {rows ? `${rows.length} client(s)` : "Chargement…"}
          </div>

          {/* Bouton desktop */}
          <div className="hidden sm:flex justify-center">
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-full bg-black text-white px-5 py-2 text-sm shadow-sm hover:shadow-md"
            >
              <PlusIcon className="h-5 w-5" />
              Nouveau client
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
              Aucun client.
            </div>
          )}

          {rows?.map((c) => (
            <div
              key={c.id}
              className="bg-white border rounded-2xl p-4 shadow-sm"
            >
              <div className="text-base font-semibold text-center">
                {c.lastName} {c.firstName}
              </div>

              <div className="mt-3 space-y-1 text-center">
                <div className="text-xs text-gray-500">{c.email}</div>
                <div className="text-xs text-gray-500">{c.phone}</div>
                <div className="text-xs text-gray-500 break-words px-2">
                  {c.street}
                </div>
                <div className="text-xs text-gray-500">
                  {c.postalCode} {c.city}
                </div>
              </div>

              {/* Actions iOS centrées */}
              <div className="mt-4 flex items-center justify-center gap-3">
                {c.properties && c.properties.length > 0 && (
                  <button
                    onClick={() => setShowPropertiesModal(c)}
                    className="bg-black text-white rounded-full px-3 py-1 text-xs font-medium hover:bg-gray-800 transition-colors"
                    title="Voir les propriétés"
                  >
                    {c.properties.length} propriété{c.properties.length > 1 ? 's' : ''}
                  </button>
                )}
                <button
                  onClick={() => setEditing(c)}
                  className={iosIconBtnLight}
                  title="Modifier"
                  aria-label="Modifier"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <MobileDeleteButton id={c.id} onDone={refresh} />
              </div>
            </div>
          ))}

          {/* Bouton flottant + (mobile) */}
          <button
            onClick={() => setShowCreate(true)}
            className={twMerge(iosIconBtn, "fixed bottom-6 right-6 z-40")}
            aria-label="Créer un client"
            title="Créer un client"
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
                    <Th>Prénom</Th>
                    <Th>Nom</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Rue</Th>
                    <Th>Code postal</Th>
                    <Th>Commune</Th>
                    <Th>Propriétés</Th>
                    <Th className="text-center w-[220px]">Actions</Th>
                  </tr>
                </thead>
                <tbody className="[&>tr:nth-child(odd)]:bg-gray-50/50">
                  {rows.map((c) => (
                    <tr key={c.id} className="border-t border-gray-200">
                      <Td className="text-gray-700">{c.firstName}</Td>
                      <Td className="text-gray-700">{c.lastName}</Td>
                      <Td className="text-gray-700">{c.email}</Td>
                      <Td className="text-gray-700">{c.phone}</Td>
                      <Td className="text-gray-700">{c.street}</Td>
                      <Td className="text-gray-700">{c.postalCode}</Td>
                      <Td className="text-gray-700">{c.city}</Td>
                      <Td className="text-gray-700 text-center">
                        {c.properties && c.properties.length > 0 ? (
                          <button
                            onClick={() => setShowPropertiesModal(c)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-white border border-gray-200 text-black hover:border-gray-300 hover:bg-gray-50 font-medium transition-colors"
                            title="Voir les propriétés"
                          >
                            {c.properties.length}
                          </button>
                        ) : (
                          "-"
                        )}
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setEditing(c)}
                            className={iosIconBtnLight + " h-[30px] w-[30px]"}
                            title="Modifier"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!window.confirm("Supprimer ce client ?")) return;
                              try {
                                await deleteClient(c.id);
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
        <ClientModal
          mode="create"
          title="Créer un client"
          onClose={() => setShowCreate(false)}
          onSubmit={async (payload) => {
            await createClient(payload);
            setShowCreate(false);
            await refresh();
          }}
        />
      )}

      {editing && (
        <ClientModal
          mode="edit"
          title={`Modifier ${editing.lastName} ${editing.firstName}`}
          initial={editing}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            await updateClient(editing.id, payload);
            setEditing(null);
            await refresh();
          }}
        />
      )}

      {/* Modal des propriétés */}
      {showPropertiesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowPropertiesModal(null)} />
          <div className="relative w-full bg-white rounded-2xl shadow-2xl max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-base font-semibold">
                Propriétés de {showPropertiesModal.firstName} {showPropertiesModal.lastName}
              </h3>
              <button
                onClick={() => setShowPropertiesModal(null)}
                className="text-gray-500 hover:text-black"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <h4 className="text-sm font-medium text-gray-700">Liste des propriétés</h4>
                <button
                  onClick={() => {
                    setEditingProperty({ client: showPropertiesModal, property: 'new' });
                    setShowPropertiesModal(null);
                  }}
                  className="rounded-full bg-black text-white h-8 w-8 inline-flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:bg-gray-800"
                  title="Ajouter une propriété"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-auto">
                {showPropertiesModal.properties && showPropertiesModal.properties.length > 0 ? (
                  <ul className="space-y-2">
                    {showPropertiesModal.properties.map((property, index) => (
                      <li key={property.id || index} className="py-3 border-b border-gray-200 last:border-b-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="grid grid-cols-2 gap-2 text-sm flex-1">
                            {property.commune && (
                              <div><span className="text-gray-500">Commune:</span> {property.commune}</div>
                            )}
                            {property.lieuDit && (
                              <div><span className="text-gray-500">Lieu-dit:</span> {property.lieuDit}</div>
                            )}
                            {property.section && (
                              <div><span className="text-gray-500">Section:</span> {property.section}</div>
                            )}
                            {property.parcelle && (
                              <div><span className="text-gray-500">Parcelle:</span> {property.parcelle}</div>
                            )}
                            {property.surfaceCadastrale !== null && (
                              <div><span className="text-gray-500">Surface:</span> {property.surfaceCadastrale}m²</div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingProperty({ client: showPropertiesModal, property });
                                setShowPropertiesModal(null);
                              }}
                              className="rounded-full bg-white text-gray-900 border border-gray-300 h-8 w-8 inline-flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:bg-gray-50"
                              title="Modifier"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm('Supprimer cette propriété ?')) return;
                                try {
                                  const updatedProperties = showPropertiesModal.properties
                                    .filter(p => p.id !== property.id)
                                    .map(p => ({
                                      commune: p.commune || undefined,
                                      lieuDit: p.lieuDit || undefined,
                                      section: p.section || undefined,
                                      parcelle: p.parcelle || undefined,
                                      surfaceCadastrale: p.surfaceCadastrale || undefined,
                                    }));

                                  await updateClient(showPropertiesModal.id, {
                                    firstName: showPropertiesModal.firstName,
                                    lastName: showPropertiesModal.lastName,
                                    email: showPropertiesModal.email,
                                    phone: showPropertiesModal.phone,
                                    street: showPropertiesModal.street || "",
                                    postalCode: showPropertiesModal.postalCode || "",
                                    city: showPropertiesModal.city || "",
                                    properties: updatedProperties,
                                  });
                                  await refresh();
                                } catch (e: any) {
                                  alert(e.message || "Erreur lors de la suppression");
                                }
                              }}
                              className="rounded-full bg-white text-red-700 border border-red-500 h-8 w-8 inline-flex items-center justify-center shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:bg-red-50"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    Aucune propriété définie
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-3 border-t flex justify-end">
              <button
                onClick={() => setShowPropertiesModal(null)}
                className="rounded-full border px-4 py-1.5 text-sm hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProperty && (
        <EditPropertyModal
          client={editingProperty.client}
          property={editingProperty.property}
          onClose={() => {
            setEditingProperty(null);
            refresh();
          }}
          onSave={() => {
            setEditingProperty(null);
            refresh();
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
        if (!window.confirm("Supprimer ce client ?")) return;
        try {
          setBusy(true);
          await deleteClient(id);
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
  onSubmit: (payload: CreateClientPayload) => Promise<void>;
};
type EditProps = BaseProps & {
  mode: "edit";
  initial: ClientDTO;
  onSubmit: (payload: UpdateClientPayload) => Promise<void>;
};
type ClientModalProps = CreateProps | EditProps;

function ClientModal(props: ClientModalProps) {
  const { title, onClose } = props;
  const isEdit = props.mode === "edit";
  const initial = isEdit ? props.initial : undefined;

  const [firstName, setFirst] = useState(initial?.firstName ?? "");
  const [lastName, setLast] = useState(initial?.lastName ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [city, setCity] = useState(initial?.city ?? "");

  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setErr(null);

      // Nettoyage inputs
      if (!NAME_RE.test(firstName))
        throw new Error("Prénom invalide (lettres uniquement).");
      if (!NAME_RE.test(lastName))
        throw new Error("Nom invalide (lettres uniquement).");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(email))
        throw new Error("Email invalide.");
      if (!PHONE_RE.test(phone))
        throw new Error("Téléphone invalide (chiffres uniquement).");
      if (!street.trim())
        throw new Error("Rue requise.");
      if (!postalCode.trim())
        throw new Error("Code postal requis.");
      if (!city.trim())
        throw new Error("Commune requise.");

      setBusy(true);

      const payload: CreateClientPayload | UpdateClientPayload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        street: street.trim(),
        postalCode: postalCode.trim(),
        city: city.trim(),
        properties: [],
      };

      await props.onSubmit(payload);
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

            <Field label="Email *">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Téléphone *">
              <Input
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
              />
            </Field>

            <Field label="Rue *">
              <Input
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </Field>

            <Field label="Code postal *">
              <Input
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ""))}
              />
            </Field>

            <Field label="Commune *">
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
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

/* ───────── Edit Property Modal ───────── */
function EditPropertyModal({
  client,
  property,
  onClose,
  onSave,
}: {
  client: ClientDTO;
  property: PropertyDTO | 'new';
  onClose: () => void;
  onSave: () => void;
}) {
  const isNew = property === 'new';
  const [commune, setCommune] = useState(isNew ? "" : property.commune || "");
  const [lieuDit, setLieuDit] = useState(isNew ? "" : property.lieuDit || "");
  const [section, setSection] = useState(isNew ? "" : property.section || "");
  const [parcelle, setParcelle] = useState(isNew ? "" : property.parcelle || "");
  const [surfaceCadastrale, setSurfaceCadastrale] = useState(isNew ? "" : property.surfaceCadastrale?.toString() || "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    try {
      setErr(null);

      // Validation obligatoire
      if (!commune.trim()) {
        throw new Error("La commune est obligatoire.");
      }
      if (!section.trim()) {
        throw new Error("La section est obligatoire.");
      }
      if (!parcelle.trim()) {
        throw new Error("La parcelle est obligatoire.");
      }

      // Validation section : seulement des lettres, 2 caractères
      const sectionUpper = section.toUpperCase().trim();
      if (!/^[A-Z]{2}$/.test(sectionUpper)) {
        throw new Error("La section doit contenir exactement 2 lettres.");
      }

      // Validation parcelle : seulement des chiffres
      if (!/^\d+$/.test(parcelle.trim())) {
        throw new Error("La parcelle ne peut contenir que des chiffres.");
      }

      setBusy(true);

      const newProperty = {
        commune: commune.trim(),
        lieuDit: lieuDit.trim() || undefined,
        section: sectionUpper,
        parcelle: parcelle.trim(),
        surfaceCadastrale: surfaceCadastrale ? Number(surfaceCadastrale) : undefined,
      };

      // On récupère toutes les propriétés du client
      let updatedProperties: CreatePropertyPayload[];
      
      if (isNew) {
        // Création : on ajoute la nouvelle propriété
        updatedProperties = client.properties.map(p => ({
          commune: p.commune || undefined,
          lieuDit: p.lieuDit || undefined,
          section: p.section || undefined,
          parcelle: p.parcelle || undefined,
          surfaceCadastrale: p.surfaceCadastrale || undefined,
        })).concat(newProperty);
      } else {
        // Édition : on remplace la propriété existante
        updatedProperties = client.properties
          .filter(p => p.id !== property.id)
          .map(p => ({
            commune: p.commune || undefined,
            lieuDit: p.lieuDit || undefined,
            section: p.section || undefined,
            parcelle: p.parcelle || undefined,
            surfaceCadastrale: p.surfaceCadastrale || undefined,
          }))
          .concat(newProperty);
      }

      const payload: UpdateClientPayload = {
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
        street: client.street || "",
        postalCode: client.postalCode || "",
        city: client.city || "",
        properties: updatedProperties,
      };

      await updateClient(client.id, payload);
      onSave();
    } catch (e: any) {
      setErr(e.message || "Erreur lors de la mise à jour");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full bg-white rounded-2xl shadow-2xl max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold">{isNew ? "Ajouter une propriété" : "Modifier la propriété"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <div className="text-xs text-gray-600 mb-1">Commune *</div>
            <input
              type="text"
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Lieu-dit</div>
            <input
              type="text"
              value={lieuDit}
              onChange={(e) => setLieuDit(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-600 mb-1">Section (2 lettres) *</div>
              <input
                type="text"
                value={section}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
                  setSection(value);
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                maxLength={2}
                required
              />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">Parcelle *</div>
              <input
                type="text"
                value={parcelle}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setParcelle(value);
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div>
            <div className="text-xs text-gray-600 mb-1">Surface cadastrale (m³)</div>
            <input
              type="number"
              step="0.001"
              value={surfaceCadastrale}
              onChange={(e) => setSurfaceCadastrale(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
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