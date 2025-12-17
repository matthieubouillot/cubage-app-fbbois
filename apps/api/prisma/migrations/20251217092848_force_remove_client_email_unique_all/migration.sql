-- Remove all possible unique constraints on Client.email
-- This handles different constraint names that might exist in production

-- Method 1: Drop by standard Prisma constraint name
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";

-- Method 2: Drop by finding and dropping any unique constraint on email column
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all unique constraints on the Client table that involve the email column
    FOR constraint_record IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'Client'::regclass
          AND contype = 'u'
          AND array_length(conkey, 1) = 1
          AND conkey[1] = (
              SELECT attnum
              FROM pg_attribute
              WHERE attrelid = 'Client'::regclass
                AND attname = 'email'
          )
    LOOP
        EXECUTE format('ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
    END LOOP;
END $$;

