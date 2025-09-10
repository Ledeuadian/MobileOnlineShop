-- Add brand column to ITEMS_IN_STORE table
ALTER TABLE public.ITEMS_IN_STORE 
ADD COLUMN IF NOT EXISTS brand VARCHAR(255);

-- Create index for brand column for better search performance
CREATE INDEX IF NOT EXISTS idx_items_in_store_brand ON public.ITEMS_IN_STORE(brand);
