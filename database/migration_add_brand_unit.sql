-- Add brand column to ITEMS_IN_STORE table
ALTER TABLE public.ITEMS_IN_STORE 
ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- Add unit column if it doesn't exist (for completeness)
ALTER TABLE public.ITEMS_IN_STORE 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
