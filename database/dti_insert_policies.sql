-- Add INSERT policy for DTI to create new products
-- This policy allows DTI users to insert new products into PRODUCT_TYPE and SRP tables

-- Drop existing insert policies if they exist
DROP POLICY IF EXISTS "DTI can insert products" ON public."PRODUCT_TYPE";
DROP POLICY IF EXISTS "Authenticated users can insert product types" ON public."PRODUCT_TYPE";

-- Policy: Allow DTI users to INSERT new products (using email domain or role)
CREATE POLICY "DTI can insert products" 
ON public."PRODUCT_TYPE"
FOR INSERT 
WITH CHECK (
    -- Allow authenticated users to insert products
    auth.role() = 'authenticated'
);

-- Grant insert permission to authenticated users
GRANT INSERT ON public."PRODUCT_TYPE" TO authenticated;
GRANT INSERT ON public."PRODUCT_TYPE" TO service_role;

-- Also add update policy for SRP (for DTI to update SRP prices)
DROP POLICY IF EXISTS "DTI can update SRP prices" ON public."SRP";

CREATE POLICY "DTI can update SRP prices" 
ON public."SRP"
FOR UPDATE 
USING (
    -- Allow DTI users with specific email domain
    auth.jwt() ->> 'email' LIKE '%@dti.gov.ph%' 
    OR auth.jwt() ->> 'role' = 'dti_official'
    -- Or allow based on user_roles table
    OR EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_roles.user_id = auth.uid() 
        AND user_roles.role IN ('dti_official', 'admin', 'government_monitor')
    )
);

GRANT UPDATE ON public."SRP" TO authenticated;
GRANT UPDATE ON public."SRP" TO service_role;

-- Also add insert policy for SRP (for DTI to add SRP entries)
DROP POLICY IF EXISTS "DTI can insert SRP prices" ON public."SRP";

CREATE POLICY "DTI can insert SRP prices" 
ON public."SRP"
FOR INSERT 
WITH CHECK (
    -- Allow authenticated users to insert SRP prices
    auth.role() = 'authenticated'
);

GRANT INSERT ON public."SRP" TO authenticated;
GRANT INSERT ON public."SRP" TO service_role;

-- Display confirmation
SELECT 'INSERT policies for PRODUCT_TYPE and SRP created successfully' as status;