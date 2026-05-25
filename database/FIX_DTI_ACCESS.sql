-- Fix DTI Access Policies
-- This allows all authenticated users to view stores (DTI filtering done in app)
-- Simpler approach: permissive policies, app-level filtering for DTI access

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can insert their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can update their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can delete their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can view items from their store" ON public."ITEMS_IN_STORE";

-- Allow all authenticated users to view ALL stores (permissive for DTI monitoring)
CREATE POLICY "Users can view all stores" ON public."GROCERY_STORE"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow store owners to insert their own stores
CREATE POLICY "Owners can insert stores" ON public."GROCERY_STORE"
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Allow store owners to update their own stores
CREATE POLICY "Owners can update stores" ON public."GROCERY_STORE"
    FOR UPDATE USING (auth.uid() = owner_id);

-- Allow store owners to delete their own stores
CREATE POLICY "Owners can delete stores" ON public."GROCERY_STORE"
    FOR DELETE USING (auth.uid() = owner_id);

-- Allow all authenticated users to view ALL store items (permissive for DTI monitoring)
CREATE POLICY "Users can view all store items" ON public."ITEMS_IN_STORE"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow store owners to update their own store items
CREATE POLICY "Owners can update store items" ON public."ITEMS_IN_STORE"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public."GROCERY_STORE" 
            WHERE "GROCERY_STORE"."storeId" = "ITEMS_IN_STORE"."storeId" 
            AND "GROCERY_STORE"."owner_id" = auth.uid()
        )
    );

-- Allow all authenticated users to view SRP prices
CREATE POLICY "Users can view SRP" ON public."SRP"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to view product types
CREATE POLICY "Users can view product types" ON public."PRODUCT_TYPE"
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to view USER table
CREATE POLICY "Users can view user records" ON public."USER"
    FOR SELECT USING (auth.role() = 'authenticated');