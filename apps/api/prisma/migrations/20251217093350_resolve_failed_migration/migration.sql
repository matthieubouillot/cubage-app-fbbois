-- This migration resolves the failed migration 20251217092848_force_remove_client_email_unique_all
-- by manually dropping the constraint if it still exists
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";

