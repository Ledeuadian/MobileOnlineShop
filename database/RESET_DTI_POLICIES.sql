-- RESET ALL GROCERY_STORE AND ITEMS_IN_STORE POLICIES
-- Run this to completely reset policies

-- 1. Drop ALL existing policies on GROCERY_STORE
DROP POLICY IF EXISTS "Users can view their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can insert their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can update their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can delete their own store" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Users can view all stores" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Owners can insert stores" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Owners can update stores" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Owners can delete stores" ON public."GROCERY_STORE";
DROP POLICY IF EXISTS "Allow view all stores" ON public."GROCERY_STORE";

-- 2. Drop ALL existing policies on ITEMS_IN_STORE
DROP POLICY IF EXISTS "Users can view items from their store" ON public."ITEMS_IN_STORE";
DROP POLICY IF EXISTS "Users can view all store items" ON public."ITEMS_IN_STORE";
DROP POLICY IF EXISTS "Owners can update store items" ON public."ITEMS_IN_STORE";

-- 3. Create new PERMISSIVE policies for GROCERY_STORE
CREATE POLICY "Allow all authenticated users to view stores" ON public."GROCERY_STORE"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow store owners to insert stores" ON public."GROCERY_STORE"
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Allow store owners to update stores" ON public."GROCERY_STORE"
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Allow store owners to delete stores" ON public."GROCERY_STORE"
    FOR DELETE USING (auth.uid() = owner_id);

-- 4. Create new PERMISSIVE policies for ITEMS_IN_STORE
CREATE POLICY "Allow all authenticated users to view items" ON public."ITEMS_IN_STORE"
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow store owners to update items" ON public."ITEMS_IN_STORE"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public."GROCERY_STORE" 
            WHERE "GROCERY_STORE"."storeId" = "ITEMS_IN_STORE"."storeId" 
            AND "GROCERY_STORE"."owner_id" = auth.uid()
        )
    );

-- 5. Verify policies were created
SELECT tablename, policyname, permissive, cmd 
FROM pg_policies 
WHERE tablename IN ('GROCERY_STORE', 'ITEMS_IN_STORE')
ORDER BY tablename, policyname;