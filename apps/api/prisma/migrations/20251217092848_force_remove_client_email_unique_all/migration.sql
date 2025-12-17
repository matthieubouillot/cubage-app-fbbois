-- Remove all possible unique constraints on Client.email
-- This handles different constraint names that might exist in production

-- Method 1: Drop by standard Prisma constraint name
ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS "Client_email_key";

-- Method 2: Drop by finding and dropping any unique constraint on email column
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the constraint name for email unique constraint
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'Client'::regclass
      AND contype = 'u'
      AND conkey::text = (
          SELECT array_agg(attnum::text)::text
          FROM pg_attribute
          WHERE attrelid = 'Client'::regclass
            AND attname = 'email'
      );
    
    -- Drop the constraint if found
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE "Client" DROP CONSTRAINT IF EXISTS %I', constraint_name);
    END IF;
END $$;

