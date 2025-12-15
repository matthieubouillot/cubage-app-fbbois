import { prisma } from "../../prisma";

export type ChantierFicheData = {
  aFacturerValues: Record<string, { abattage: string; debardage: string }>;
  fraisGestionValues: Record<number, string>;
  prixUHT: { aba: string; deb: string };
  volumeMoulinValues?: Record<string, string>;
  facturationValues?: Record<string, boolean>;
};

export async function listChantiersService(user: {
  userId: string;
  roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
}) {
  try {
    // Déterminer le filtre en fonction du rôle
    const where = user.roles.includes("SUPERVISEUR")
      ? {} // Les superviseurs voient tous les chantiers
      : {
          OR: [
            // Chantiers où l'utilisateur est assigné comme bûcheron
            { assignments: { some: { userId: user.userId } } },
            // Chantiers où l'utilisateur est assigné comme débardeur
            { debardeurAssignments: { some: { userId: user.userId } } }
          ]
        };

    const rows = await prisma.chantier.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { numeroCoupe: "asc" }],
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            createdAt: true,
          }
        },
        qualityGroups: {
          include: {
            qualityGroup: {
              include: {
                qualite: true,
                scieur: true,
                essences: {
                  include: {
                    essence: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: true
          }
        },
        debardeurAssignments: {
          include: {
            user: true
          }
        },
        property: true
      },
    });

    return rows.map((r) => ({
      id: r.id,
      numeroCoupe: r.numeroCoupe,
      section: r.property?.section || r.section,
      parcel: r.property?.parcelle || r.parcel,
      createdAt: r.createdAt,
      client: r.client ? {
        id: r.client.id,
        firstName: r.client.firstName,
        lastName: r.client.lastName,
        email: r.client.email,
        phone: r.client.phone,
        street: r.client.street,
        postalCode: r.client.postalCode,
        city: r.client.city
      } : null,
      property: r.property ? {
        id: r.property.id,
        commune: r.property.commune,
        lieuDit: r.property.lieuDit,
        section: r.property.section,
        parcelle: r.property.parcelle,
        surfaceCadastrale: r.property.surfaceCadastrale ? Number(r.property.surfaceCadastrale) : null
      } : null,
      qualityGroups: r.qualityGroups.map(cqg => ({
        id: cqg.qualityGroup.id,
        name: cqg.qualityGroup.name,
        category: cqg.qualityGroup.category,
        pourcentageEcorce: cqg.qualityGroup.pourcentageEcorce,
        qualite: {
          id: cqg.qualityGroup.qualite.id,
          name: cqg.qualityGroup.qualite.name
        },
        scieur: {
          id: cqg.qualityGroup.scieur.id,
          name: cqg.qualityGroup.scieur.name
        },
        essences: cqg.qualityGroup.essences.map(e => ({
          id: e.essence.id,
          name: e.essence.name
        })),
        lot: cqg.lot || null,
        convention: cqg.convention || null
      })),
      bucherons: r.assignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      })),
      debardeurs: r.debardeurAssignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      }))
    }));
  } catch (error) {
    console.error('Error in listChantiersService:', error);
    throw error;
  }
}

export async function getChantierByIdService(
  user: { userId: string; roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[] },
  id: string,
) {
  try {
    // Déterminer le filtre en fonction du rôle
    const whereFilter = user.roles.includes("SUPERVISEUR")
      ? { id }
      : {
          AND: [
            { id },
            {
              OR: [
                // Chantiers où l'utilisateur est assigné comme bûcheron
                { assignments: { some: { userId: user.userId } } },
                // Chantiers où l'utilisateur est assigné comme débardeur
                { debardeurAssignments: { some: { userId: user.userId } } }
              ]
            }
          ]
        };

    const r = await prisma.chantier.findFirst({
      where: whereFilter,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            createdAt: true,
          }
        },
        qualityGroups: {
          include: {
            qualityGroup: {
              include: {
                qualite: true,
                scieur: true,
                essences: {
                  include: {
                    essence: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: true
          }
        },
        debardeurAssignments: {
          include: {
            user: true
          }
        },
        property: true
      },
    });

    if (!r) return null;

    return {
      id: r.id,
      numeroCoupe: r.numeroCoupe,
      section: r.property?.section || r.section,
      parcel: r.property?.parcelle || r.parcel,
      createdAt: r.createdAt,
      client: r.client ? {
        id: r.client.id,
        firstName: r.client.firstName,
        lastName: r.client.lastName,
        email: r.client.email,
        phone: r.client.phone,
        street: r.client.street,
        postalCode: r.client.postalCode,
        city: r.client.city
      } : null,
      property: r.property ? {
        id: r.property.id,
        commune: r.property.commune,
        lieuDit: r.property.lieuDit,
        section: r.property.section,
        parcelle: r.property.parcelle,
        surfaceCadastrale: r.property.surfaceCadastrale ? Number(r.property.surfaceCadastrale) : null
      } : null,
      qualityGroups: r.qualityGroups.map(cqg => ({
        id: cqg.qualityGroup.id,
        name: cqg.qualityGroup.name,
        category: cqg.qualityGroup.category,
        pourcentageEcorce: cqg.qualityGroup.pourcentageEcorce,
        qualite: {
          id: cqg.qualityGroup.qualite.id,
          name: cqg.qualityGroup.qualite.name
        },
        scieur: {
          id: cqg.qualityGroup.scieur.id,
          name: cqg.qualityGroup.scieur.name
        },
        essences: cqg.qualityGroup.essences.map(e => ({
          id: e.essence.id,
          name: e.essence.name
        })),
        lot: cqg.lot || null,
        convention: cqg.convention || null
      })),
      bucherons: r.assignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      })),
      debardeurAssignments: r.debardeurAssignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      }))
    };
  } catch (error) {
    console.error('Error in getChantierByIdService:', error);
    throw error;
  }
}

export async function createChantierService(input: {
  numeroCoupe: string;
  clientId: string;
  propertyId?: string;
  qualityGroupIds: string[];
  bucheronIds: string[];
  debardeurIds?: string[]; // Nouveau : IDs des débardeurs
  lotConventions?: Array<{
    qualityGroupId: string;
    lot?: string;
    convention?: string;
  }>;
}) {
  try {
    // Créer le chantier
    const chantier = await prisma.chantier.create({
      data: {
        numeroCoupe: input.numeroCoupe,
        clientId: input.clientId,
        propertyId: input.propertyId || null,
        qualityGroups: {
          create: input.qualityGroupIds.map(qualityGroupId => {
            // Trouver le lot/convention pour ce quality group si disponible
            const lotConv = input.lotConventions?.find(lc => lc.qualityGroupId === qualityGroupId);
            return {
              qualityGroupId,
              lot: lotConv?.lot || null,
              convention: lotConv?.convention || null
            };
          })
        },
        assignments: {
          create: input.bucheronIds.map(bucheronId => ({
            userId: bucheronId
          }))
        },
        debardeurAssignments: input.debardeurIds ? {
          create: input.debardeurIds.map(debardeurId => ({
            userId: debardeurId
          }))
        } : undefined
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            createdAt: true,
          }
        },
        qualityGroups: {
          include: {
            qualityGroup: {
              include: {
                qualite: true,
                scieur: true,
                essences: {
                  include: {
                    essence: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: true
          }
        },
        debardeurAssignments: {
          include: {
            user: true
          }
        }
      }
    });

    return {
      id: chantier.id,
      numeroCoupe: chantier.numeroCoupe,
      section: chantier.section,
      parcel: chantier.parcel,
      createdAt: chantier.createdAt,
      client: chantier.client ? {
        id: chantier.client.id,
        firstName: chantier.client.firstName,
        lastName: chantier.client.lastName,
        email: chantier.client.email,
        phone: chantier.client.phone,
        street: chantier.client.street,
        postalCode: chantier.client.postalCode,
        city: chantier.client.city
      } : null,
      qualityGroups: chantier.qualityGroups.map(cqg => ({
        id: cqg.qualityGroup.id,
        name: cqg.qualityGroup.name,
        category: cqg.qualityGroup.category,
        pourcentageEcorce: cqg.qualityGroup.pourcentageEcorce,
        qualite: {
          id: cqg.qualityGroup.qualite.id,
          name: cqg.qualityGroup.qualite.name
        },
        scieur: {
          id: cqg.qualityGroup.scieur.id,
          name: cqg.qualityGroup.scieur.name
        },
        essences: cqg.qualityGroup.essences.map(e => ({
          id: e.essence.id,
          name: e.essence.name
        })),
        lot: cqg.lot || null,
        convention: cqg.convention || null
      })),
      bucherons: chantier.assignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      }))
    };
  } catch (error) {
    console.error('Error in createChantierService:', error);
    throw error;
  }
}

export async function updateChantierService(
  user: {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  },
  chantierId: string,
  input: {
    numeroCoupe?: string;
    clientId?: string;
    propertyId?: string;
    qualityGroupIds?: string[];
    bucheronIds?: string[];
    debardeurIds?: string[];
    lotConventions?: Array<{
      qualityGroupId: string;
      lot?: string;
      convention?: string;
    }>;
  }
) {
  try {
    // Vérifier que le chantier existe
    const existingChantier = await prisma.chantier.findUnique({
      where: { id: chantierId }
    });

    if (!existingChantier) {
      throw new Error("Chantier introuvable");
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (input.numeroCoupe !== undefined) updateData.numeroCoupe = input.numeroCoupe;
    if (input.clientId !== undefined) updateData.clientId = input.clientId;
    if (input.propertyId !== undefined) updateData.propertyId = input.propertyId;

    // Mettre à jour le chantier
    const updatedChantier = await prisma.chantier.update({
      where: { id: chantierId },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            createdAt: true,
          }
        },
        qualityGroups: {
          include: {
            qualityGroup: {
              include: {
                qualite: true,
                scieur: true,
                essences: {
                  include: {
                    essence: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: true
          }
        },
        debardeurAssignments: {
          include: {
            user: true
          }
        },
        property: true
      }
    });

    // Mettre à jour les groupes de qualité si fournis
    if (input.qualityGroupIds) {
      // Supprimer les anciennes relations
      await prisma.chantierQualityGroup.deleteMany({
        where: { chantierId }
      });

      // Créer les nouvelles relations avec lot/convention
      for (const qualityGroupId of input.qualityGroupIds) {
        const lotConv = input.lotConventions?.find(lc => lc.qualityGroupId === qualityGroupId);
        await prisma.chantierQualityGroup.create({
          data: {
            chantierId,
            qualityGroupId,
            lot: lotConv?.lot || null,
            convention: lotConv?.convention || null
          }
        });
      }
    }

    // Mettre à jour les bûcherons si fournis
    if (input.bucheronIds) {
      // Supprimer les anciennes assignations
      await prisma.assignment.deleteMany({
        where: { chantierId }
      });

      // Créer les nouvelles assignations
      await prisma.assignment.createMany({
        data: input.bucheronIds.map(bucheronId => ({
          chantierId,
          userId: bucheronId
        }))
      });
    }

    // Mettre à jour les débardeurs si fournis
    if (input.debardeurIds) {
      // Supprimer les anciennes assignations de débardeurs
      await prisma.debardeurAssignment.deleteMany({
        where: { chantierId }
      });

      // Créer les nouvelles assignations de débardeurs
      await prisma.debardeurAssignment.createMany({
        data: input.debardeurIds.map(debardeurId => ({
          chantierId,
          userId: debardeurId
        }))
      });
    }

    // Récupérer le chantier mis à jour avec toutes les relations
    const finalChantier = await prisma.chantier.findUnique({
      where: { id: chantierId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            street: true,
            postalCode: true,
            city: true,
            createdAt: true,
          }
        },
        qualityGroups: {
          include: {
            qualityGroup: {
              include: {
                qualite: true,
                scieur: true,
                essences: {
                  include: {
                    essence: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          include: {
            user: true
          }
        },
        debardeurAssignments: {
          include: {
            user: true
          }
        },
        property: true
      }
    });

    if (!finalChantier) {
      throw new Error("Erreur lors de la récupération du chantier mis à jour");
    }

    return {
      id: finalChantier.id,
      numeroCoupe: finalChantier.numeroCoupe,
      section: finalChantier.section,
      parcel: finalChantier.parcel,
      createdAt: finalChantier.createdAt,
      client: finalChantier.client ? {
        id: finalChantier.client.id,
        firstName: finalChantier.client.firstName,
        lastName: finalChantier.client.lastName,
        email: finalChantier.client.email,
        phone: finalChantier.client.phone,
        street: finalChantier.client.street,
        postalCode: finalChantier.client.postalCode,
        city: finalChantier.client.city
      } : null,
      property: finalChantier.property ? {
        id: finalChantier.property.id,
        commune: finalChantier.property.commune,
        lieuDit: finalChantier.property.lieuDit,
        section: finalChantier.property.section,
        parcelle: finalChantier.property.parcelle,
        surfaceCadastrale: finalChantier.property.surfaceCadastrale
      } : null,
      qualityGroups: finalChantier.qualityGroups.map(cqg => ({
        id: cqg.qualityGroup.id,
        name: cqg.qualityGroup.name,
        category: cqg.qualityGroup.category,
        pourcentageEcorce: cqg.qualityGroup.pourcentageEcorce,
        qualite: {
          id: cqg.qualityGroup.qualite.id,
          name: cqg.qualityGroup.qualite.name
        },
        scieur: {
          id: cqg.qualityGroup.scieur.id,
          name: cqg.qualityGroup.scieur.name
        },
        essences: cqg.qualityGroup.essences.map(e => ({
          id: e.essence.id,
          name: e.essence.name
        })),
        lot: cqg.lot || null,
        convention: cqg.convention || null
      })),
      bucherons: finalChantier.assignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      })),
      debardeurAssignments: finalChantier.debardeurAssignments.map(a => ({
        id: a.user.id,
        firstName: a.user.firstName,
        lastName: a.user.lastName
      }))
    };
  } catch (error) {
    console.error('Error in updateChantierService:', error);
    throw error;
  }
}

export async function deleteChantierService(
  user: {
    userId: string;
    roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  },
  chantierId: string,
) {
  try {
    // Vérifier que le chantier existe
    const chantier = await prisma.chantier.findUnique({
      where: { id: chantierId }
    });

    if (!chantier) {
      throw new Error("Chantier introuvable");
    }

    // Supprimer toutes les données liées au chantier dans l'ordre correct
    // 1. Supprimer les saisies
    await prisma.saisie.deleteMany({
      where: { chantierId }
    });

    // 2. Supprimer les assignations (bûcherons)
    await prisma.assignment.deleteMany({
      where: { chantierId }
    });

    // 3. Supprimer les relations quality groups
    await prisma.chantierQualityGroup.deleteMany({
      where: { chantierId }
    });

    // 4. Les états de numérotation seront supprimés automatiquement
    // car ils sont liés aux saisies qui sont déjà supprimées

    // 5. Enfin, supprimer le chantier lui-même
    await prisma.chantier.delete({
      where: { id: chantierId }
    });

    return true;
  } catch (error) {
    console.error('Error in deleteChantierService:', error);
    throw error;
  }
}

export async function getChantierFicheService(chantierId: string): Promise<ChantierFicheData | null> {
  try {
    const fiche = await prisma.chantierFiche.findUnique({
      where: { chantierId },
    });

    if (!fiche) {
      return null;
    }

    return {
      aFacturerValues: fiche.aFacturerValues as Record<string, { abattage: string; debardage: string }>,
      fraisGestionValues: fiche.fraisGestionValues as Record<number, string>,
      prixUHT: fiche.prixUHT as { aba: string; deb: string },
      volumeMoulinValues: fiche.volumeMoulinValues as Record<string, string> | undefined,
      facturationValues: fiche.facturationValues as Record<string, boolean> | undefined,
    };
  } catch (error) {
    console.error("Error in getChantierFicheService:", error);
    throw error;
  }
}

export async function saveChantierFicheService(
  chantierId: string,
  data: ChantierFicheData
): Promise<ChantierFicheData> {
  try {
    const fiche = await prisma.chantierFiche.upsert({
      where: { chantierId },
      create: {
        chantierId,
        aFacturerValues: data.aFacturerValues,
        fraisGestionValues: data.fraisGestionValues,
        prixUHT: data.prixUHT,
        ...(data.volumeMoulinValues !== undefined && { volumeMoulinValues: data.volumeMoulinValues }),
        ...(data.facturationValues !== undefined && { facturationValues: data.facturationValues }),
      },
      update: {
        aFacturerValues: data.aFacturerValues,
        fraisGestionValues: data.fraisGestionValues,
        prixUHT: data.prixUHT,
        ...(data.volumeMoulinValues !== undefined && { volumeMoulinValues: data.volumeMoulinValues }),
        ...(data.facturationValues !== undefined && { facturationValues: data.facturationValues }),
      },
    });

    return {
      aFacturerValues: fiche.aFacturerValues as Record<string, { abattage: string; debardage: string }>,
      fraisGestionValues: fiche.fraisGestionValues as Record<number, string>,
      prixUHT: fiche.prixUHT as { aba: string; deb: string },
      volumeMoulinValues: fiche.volumeMoulinValues as Record<string, string> | undefined,
      facturationValues: fiche.facturationValues as Record<string, boolean> | undefined,
    };
  } catch (error) {
    console.error("Error in saveChantierFicheService:", error);
    throw error;
  }
}
