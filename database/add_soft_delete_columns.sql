-- Add soft-delete columns to GROCERY_STORE table
-- This allows stores to be "deleted" without actually removing them from the database

ALTER TABLE public.GROCERY_STORE 
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false;

ALTER TABLE public.GROCERY_STORE 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster filtering of active stores
CREATE INDEX IF NOT EXISTS idx_grocery_store_is_deleted 
ON public.GROCERY_STORE(is_deleted) 
WHERE is_deleted = false;