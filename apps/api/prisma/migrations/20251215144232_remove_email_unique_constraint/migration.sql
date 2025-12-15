-- Remove unique constraint on Client.email
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";
