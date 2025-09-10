-- Add public read policy for GROCERY_STORE so customers can see store names
-- This allows anyone to read basic store information like storeName, which is typically public

CREATE POLICY "Anyone can view basic store info" ON public.GROCERY_STORE
    FOR SELECT USING (true);

-- Also allow public access to view items in stores (for shopping)
CREATE POLICY "Anyone can view items in stores" ON public.ITEMS_IN_STORE
    FOR SELECT USING (true);
