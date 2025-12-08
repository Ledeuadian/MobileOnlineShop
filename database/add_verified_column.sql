-- Add verified column to GROCERY_STORE table
-- This column will be used to control store access to the system
-- Default is false, and only admin can set it to true after verification

-- Add the verified column if it doesn't exist
ALTER TABLE "GROCERY_STORE" 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Add a comment to explain the column purpose
COMMENT ON COLUMN "GROCERY_STORE".verified IS 
'Indicates whether the store has been verified by admin. Unverified stores cannot access the system except to submit permits.';

-- Optional: Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_grocery_store_verified 
ON "GROCERY_STORE" (verified);

-- Update existing stores to be unverified by default (if needed)
-- Uncomment the line below if you want to set all existing stores to unverified
-- UPDATE "GROCERY_STORE" SET verified = false WHERE verified IS NULL;

-- Note: The GROCERY_STORE table uses "storeId" as the primary key column name, not "store_id"
