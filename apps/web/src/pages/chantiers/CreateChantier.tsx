import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getQualityGroups, 
  getLotConventionsByQualityGroup,
  createChantier,
  getChantiers
} from '../../features/chantiers/api';
import { listClients, ClientDTO, createClient, CreateClientPayload, PropertyDTO, CreatePropertyPayload, updateClient, UpdateClientPayload } from '../../features/clients/api';
import { listUsers, UserDTO } from '../../features/users/api';
import { QualityGroup, LotConvention } from '../../features/chantiers/api';
import MobileBack from '../../components/MobileBack';

type CreateChantierDTO = {
  numeroCoupe: string;
  clientId: string;
  propertyId: string;
  qualityGroupIds: string[];
  bucheronIds: string[];
  debardeurIds: string[]; // Nouveau : IDs des débardeurs assignés
  lotConventions: {
    qualityGroupId: string;
    lot: string;
    convention: string;
  }[];
};

export default function CreateChantier() {
  const navigate = useNavigate();
  
  // États pour les données
  const [qualityGroups, setQualityGroups] = useState<QualityGroup[]>([]);
  const [clients, setClients] = useState<ClientDTO[]>([]);
  const [bucherons, setBucherons] = useState<UserDTO[]>([]);
  const [debardeurs, setDebardeurs] = useState<UserDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour le formulaire
  const [formData, setFormData] = useState<CreateChantierDTO>({
    numeroCoupe: '',
    clientId: '',
    propertyId: '',
    qualityGroupIds: [],
    bucheronIds: [],
    debardeurIds: [],
    lotConventions: []
  });
  
  // États pour les lots/conventions
  const [selectedQualityGroups, setSelectedQualityGroups] = useState<QualityGroup[]>([]);
  const [lotConventions, setLotConventions] = useState<Record<string, LotConvention[]>>({});
  const [selectedLotConventions, setSelectedLotConventions] = useState<Record<string, string>>({});
  const [customLotConventions, setCustomLotConventions] = useState<Record<string, { lot: string; convention: string }>>({});
  
  // États pour la sélection de client
  const [clientSearch, setClientSearch] = useState('');
  const [filteredClients, setFilteredClients] = useState<ClientDTO[]>([]);
  const [showClientList, setShowClientList] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setError(null);
        const [qualityGroupsData, clientsData, usersData, chantiersData] = await Promise.all([
          getQualityGroups(),
          listClients(),
          listUsers(),
          getChantiers()
        ]);
        
        setQualityGroups(qualityGroupsData);
        setClients(clientsData);
        setFilteredClients(clientsData);
        setBucherons(usersData.filter(user => user.roles.includes('BUCHERON')));
        setDebardeurs(usersData.filter(user => user.roles.includes('DEBARDEUR')));
        
        // Générer le prochain numéro de coupe
        const lastNumeroCoupe = (chantiersData as any[])
          .map((c: any) => parseInt(c.numeroCoupe))
          .filter((n: any) => !isNaN(n))
          .sort((a: any, b: any) => b - a)[0] || 0;
        
        setFormData(prev => ({
          ...prev,
          numeroCoupe: (lastNumeroCoupe + 1).toString()
        }));
        
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setError('Erreur lors du chargement des données');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Filtrer les clients selon la recherche
  useEffect(() => {
    if (clientSearch.trim() === '') {
      setFilteredClients([]);
      setShowClientList(false);
    } else {
      const searchTerm = clientSearch.toLowerCase();
      const filtered = clients.filter(client => 
        client.lastName.toLowerCase().includes(searchTerm) ||
        client.firstName.toLowerCase().includes(searchTerm) ||
        `${client.firstName} ${client.lastName}`.toLowerCase().includes(searchTerm)
      );
      setFilteredClients(filtered);
      // Ne pas afficher la liste si on a déjà un client sélectionné
      if (!formData.clientId) {
        setShowClientList(true);
      }
    }
  }, [clientSearch, clients, formData.clientId]);

  // Charger les lots/conventions quand les groupes de qualité changent
  useEffect(() => {
    const loadLotConventions = async () => {
      const newLotConventions: Record<string, LotConvention[]> = {};
      
      for (const qualityGroup of selectedQualityGroups) {
        try {
          const lc = await getLotConventionsByQualityGroup(qualityGroup.id);
          newLotConventions[qualityGroup.id] = lc;
        } catch (error) {
          console.error(`Erreur lors du chargement des lots/conventions pour ${qualityGroup.name}:`, error);
          newLotConventions[qualityGroup.id] = [];
        }
      }
      
      setLotConventions(newLotConventions);
    };
    
    if (selectedQualityGroups.length > 0) {
      loadLotConventions();
    }
  }, [selectedQualityGroups]);

  const handleQualityGroupToggle = (qualityGroup: QualityGroup) => {
    const isSelected = formData.qualityGroupIds.includes(qualityGroup.id);
    
    if (isSelected) {
      // Désélectionner
      setFormData(prev => ({
        ...prev,
        qualityGroupIds: prev.qualityGroupIds.filter(id => id !== qualityGroup.id)
      }));
      setSelectedQualityGroups(prev => prev.filter(qg => qg.id !== qualityGroup.id));
      
      // Nettoyer les lots/conventions sélectionnés
      const newSelectedLotConventions = { ...selectedLotConventions };
      delete newSelectedLotConventions[qualityGroup.id];
      setSelectedLotConventions(newSelectedLotConventions);
    } else {
      // Sélectionner
      setFormData(prev => ({
        ...prev,
        qualityGroupIds: [...prev.qualityGroupIds, qualityGroup.id]
      }));
      setSelectedQualityGroups(prev => [...prev, qualityGroup]);
    }
  };

  const handleLotConventionChange = (qualityGroupId: string, lotConventionId: string) => {
    setSelectedLotConventions(prev => ({
      ...prev,
      [qualityGroupId]: lotConventionId
    }));
  };

  const handleCustomLotConventionChange = (qualityGroupId: string, field: 'lot' | 'convention', value: string) => {
    setCustomLotConventions(prev => ({
      ...prev,
      [qualityGroupId]: {
        ...prev[qualityGroupId],
        [field]: value
      }
    }));
  };

  const handleClientSelect = (client: ClientDTO) => {
    setFormData(prev => ({ ...prev, clientId: client.id }));
    setClientSearch(`${client.firstName} ${client.lastName}`);
    // Fermer la liste des clients
    setShowClientList(false);
    setFilteredClients([]);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      // Validation des champs obligatoires
      if (!formData.propertyId || formData.propertyId === '') {
        setError('Veuillez sélectionner une propriété');
        return;
      }
      
      if (formData.bucheronIds.length === 0) {
        setError('Veuillez sélectionner au moins un bûcheron');
        return;
      }
      
      if (formData.debardeurIds.length === 0) {
        setError('Veuillez sélectionner au moins un débardeur');
        return;
      }
      
      // Construire les lotConventions à partir de customLotConventions (uniquement si les valeurs sont non vides)
      const lotConventions = Object.entries(customLotConventions)
        .filter(([_, data]) => data.lot || data.convention) // Filtrer les entrées vides
        .map(([qualityGroupId, data]) => ({
          qualityGroupId,
          lot: data.lot || '',
          convention: data.convention || ''
        }));
      
      console.log('🔍 customLotConventions:', customLotConventions);
      console.log('🔍 lotConventions à envoyer:', lotConventions);
      
      const submitData = {
        ...formData,
        lotConventions
      };
      
      console.log('🔍 submitData:', submitData);
      
      await createChantier(submitData);
      navigate('/chantiers');
    } catch (error) {
      console.error('Erreur lors de la création du chantier:', error);
      setError('Erreur lors de la création du chantier');
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <MobileBack fallback="/chantiers" variant="fixed" />
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <MobileBack fallback="/chantiers" variant="fixed" />
        
        {/* Header */}
        <header className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            Nouveau Chantier
          </h1>
          <div className="text-sm text-gray-500">
            Créer un nouveau chantier
          </div>
        </header>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card title="Informations générales">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Field label="Coupe n° (chiffres) *">
                <Input
                  value={formData.numeroCoupe}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Seulement des chiffres
                    setFormData(prev => ({ ...prev, numeroCoupe: value }));
                  }}
                  required
                  inputMode="numeric"
                  pattern="\d+"
                />
              </Field>
              
              <Field label="Client *">
                <div className="relative">
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Rechercher un client par nom..."
                    required
                  />
                  
                  {/* Liste des clients filtrés */}
                  {showClientList && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <button
                          key={client.id}
                          type="button"
                          onClick={() => handleClientSelect(client)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="font-medium">{client.firstName} {client.lastName}</div>
                        </button>
                      ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500">
                          Aucun client trouvé
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Field>
              
              {formData.clientId && (
                <PropertySelector
                  label="Propriété *"
                  value={formData.propertyId || ''}
                  onChange={(propertyId) => setFormData(prev => ({ ...prev, propertyId }))}
                  properties={clients.find(c => c.id === formData.clientId)?.properties || []}
                  required
                />
              )}
            </div>
          </Card>

          {/* Combinaisons Essence + Qualité + Scieur */}
          <Card title="Essence(s) Qualité Scieur *">
            
            <div className="space-y-3">
              {(() => {
                const grouped = qualityGroups.reduce((groups, qualityGroup) => {
                  const category = qualityGroup.category;
                  if (!groups[category]) groups[category] = [];
                  groups[category].push(qualityGroup);
                  return groups;
                }, {} as Record<string, QualityGroup[]>);
                
                return Object.entries(grouped).map(([category, groups]) => (
                  <div key={category} className="border rounded-xl p-3 bg-white">
                    <div className="mb-2">
                      <span className="font-medium text-sm">{category}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {groups.map(qualityGroup => (
                        <label
                          key={qualityGroup.id}
                          className="flex items-center gap-2 rounded-lg border px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            className="accent-black h-4 w-4"
                            checked={formData.qualityGroupIds.includes(qualityGroup.id)}
                            onChange={() => handleQualityGroupToggle(qualityGroup)}
                          />
                          <span className="flex-1">
                            <span className="font-medium text-sm">{qualityGroup.scieur.name}</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </Card>

          {/* Lots/Conventions pour les groupes sélectionnés */}
          {selectedQualityGroups.length > 0 && (
            <Card title="Lots/Conventions">
              <div className="space-y-4">
                {selectedQualityGroups.map(qualityGroup => (
                  <div key={qualityGroup.id} className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{qualityGroup.name}</h4>
                    
                    {/* Saisie libre des lots/conventions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Lot (chiffres)">
                        <Input
                          value={customLotConventions[qualityGroup.id]?.lot || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Seulement des chiffres
                            handleCustomLotConventionChange(qualityGroup.id, 'lot', value);
                          }}
                          inputMode="numeric"
                          pattern="\d+"
                        />
                      </Field>
                      
                      <Field label="Convention (chiffres)">
                        <Input
                          value={customLotConventions[qualityGroup.id]?.convention || ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Seulement des chiffres
                            handleCustomLotConventionChange(qualityGroup.id, 'convention', value);
                          }}
                          inputMode="numeric"
                          pattern="\d+"
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Bûcherons */}
          <Card title="Bûcherons *">
            
            {bucherons.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun bûcheron disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {bucherons.map((bucheron) => {
                  const checked = formData.bucheronIds.includes(bucheron.id);
                  return (
                    <label
                      key={bucheron.id}
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
                            setFormData(prev => ({
                              ...prev,
                              bucheronIds: [...prev.bucheronIds, bucheron.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              bucheronIds: prev.bucheronIds.filter(id => id !== bucheron.id)
                            }));
                          }
                        }}
                      />
                      <span className="font-medium text-sm">
                        {bucheron.lastName} {bucheron.firstName}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Débardeurs */}
          <Card title="Débardeurs *">
            
            {debardeurs.length === 0 ? (
              <div className="text-sm text-gray-500">
                Aucun débardeur disponible.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {debardeurs.map((debardeur) => {
                  const checked = formData.debardeurIds.includes(debardeur.id);
                  return (
                    <label
                      key={debardeur.id}
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
                            setFormData(prev => ({
                              ...prev,
                              debardeurIds: [...prev.debardeurIds, debardeur.id]
                            }));
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              debardeurIds: prev.debardeurIds.filter(id => id !== debardeur.id)
                            }));
                          }
                        }}
                      />
                      <span className="font-medium text-sm">
                        {debardeur.lastName} {debardeur.firstName}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Boutons */}
          <div className="flex justify-center space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate('/chantiers')}
              className="px-6 py-2 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-black text-white rounded-full hover:bg-gray-800 text-sm shadow-sm hover:shadow-md"
            >
              Créer le chantier
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

/* ———————— Composant sélecteur de propriété personnalisé ———————— */
function PropertySelector({
  label,
  value,
  onChange,
  properties,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  properties: any[];
  required?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedProperty = properties.find(p => p.id === value);
  
  const displayText = selectedProperty
    ? `${selectedProperty.commune || ''}${selectedProperty.lieuDit ? ` (${selectedProperty.lieuDit})` : ''}${selectedProperty.section && selectedProperty.parcelle ? ` - ${selectedProperty.section}/${selectedProperty.parcelle}` : ''}${selectedProperty.surfaceCadastrale !== null ? ` - ${selectedProperty.surfaceCadastrale}m²` : ''}`.trim() || 'Sélectionner une propriété'
    : 'Sélectionner une propriété';
  
  return (
    <div className="relative">
      <Field label={label}>
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full border rounded-lg px-3 py-2 text-sm text-left focus:outline-none focus:ring-2 focus:ring-black/20 flex items-center justify-between bg-white"
        >
          <span className={selectedProperty ? 'text-gray-900' : 'text-gray-500'}>
            {displayText}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </Field>
      
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl max-h-[80vh] flex flex-col pointer-events-auto">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-base font-semibold">Sélectionner une propriété</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-black"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {properties.length > 0 ? (
                  <div className="p-2">
                    {properties.map(property => (
                      <button
                        key={property.id}
                        type="button"
                        onClick={() => {
                          onChange(property.id);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors border-2 ${
                          value === property.id
                            ? 'border-black bg-gray-50'
                            : 'border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium">
                          {property.commune || 'Sans commune'}
                          {property.lieuDit && ` (${property.lieuDit})`}
                          {(property.section && property.parcelle) && ` - ${property.section}/${property.parcelle}`}
                          {property.surfaceCadastrale !== null && ` - ${property.surfaceCadastrale}m²`}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm text-gray-500">
                    Aucune propriété disponible
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
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
        <h2 className="text-base font-semibold text-center">{title}</h2>
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
      className={`w-full border rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 ${className}`}
      {...rest}
    />
  );
}