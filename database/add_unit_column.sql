-- Add missing unit column to ITEMS_IN_STORE table
ALTER TABLE public.ITEMS_IN_STORE 
ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'pcs';

-- Update existing records with default unit
UPDATE public.ITEMS_IN_STORE 
SET unit = 'pcs' 
WHERE unit IS NULL;
