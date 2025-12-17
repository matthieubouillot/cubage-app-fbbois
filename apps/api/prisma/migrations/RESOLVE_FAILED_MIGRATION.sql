-- Script SQL à exécuter manuellement en production pour résoudre la migration échouée
-- 
-- Ce script doit être exécuté directement dans la base de données PostgreSQL de production
-- pour marquer la migration échouée comme résolue.
--
-- Instructions:
-- 1. Connectez-vous à votre base de données PostgreSQL de production
-- 2. Exécutez ce script SQL
-- 3. Relancez le déploiement

-- Supprimer la contrainte unique si elle existe encore
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";

-- Marquer la migration comme résolue dans la table _prisma_migrations
-- Remplacez '20251217092848_force_remove_client_email_unique_all' par le nom exact de la migration si différent
UPDATE "_prisma_migrations"
SET finished_at = NOW(),
    applied_steps_count = 1
WHERE migration_name = '20251217092848_force_remove_client_email_unique_all'
  AND finished_at IS NULL;

