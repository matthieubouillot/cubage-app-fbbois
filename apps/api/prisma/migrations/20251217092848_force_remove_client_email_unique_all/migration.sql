-- Remove unique constraint on Client.email
-- Drop by standard Prisma constraint name
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";

-- Also try to drop any other possible unique constraint names
DO $$
DECLARE
    constraint_record RECORD;
    email_attnum INTEGER;
BEGIN
    -- Get the attribute number for the email column
    SELECT attnum INTO email_attnum
    FROM pg_attribute
    WHERE attrelid = 'Client'::regclass
      AND attname = 'email';
    
    -- Find all unique constraints on the Client table that involve the email column
    IF email_attnum IS NOT NULL THEN
        FOR constraint_record IN
            SELECT conname
            FROM pg_constraint
            WHERE conrelid = 'Client'::regclass
              AND contype = 'u'
              AND array_length(conkey, 1) = 1
              AND conkey[1] = email_attnum
        LOOP
            EXECUTE format('ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
        END LOOP;
    END IF;
END $$;

