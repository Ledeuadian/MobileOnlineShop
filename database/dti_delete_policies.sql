-- Add DELETE policy for DTI to manage SRP products
-- This policy allows DTI users to delete products from PRODUCT_TYPE and SRP tables

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Enable RLS on PRODUCT_TYPE if not already enabled
ALTER TABLE public."PRODUCT_TYPE" ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies if they exist
-- IMPORTANT: Must match EXACT policy names from create_product_type_table.sql
DROP POLICY IF EXISTS "Public can view products" ON public."PRODUCT_TYPE";
DROP POLICY IF EXISTS "Authenticated can view products" ON public."PRODUCT_TYPE";
DROP POLICY IF EXISTS "Public can view product types" ON public."PRODUCT_TYPE";

-- Policy: Allow all users to view (SELECT) products for SRP display
CREATE POLICY "Public can view products" 
ON public."PRODUCT_TYPE"
FOR SELECT 
USING (true);

-- Grant select permission
GRANT SELECT ON public."PRODUCT_TYPE" TO authenticated;
GRANT SELECT ON public."PRODUCT_TYPE" TO anon;
GRANT SELECT ON public."PRODUCT_TYPE" TO service_role;

-- Drop existing delete policies if they exist
-- IMPORTANT: Must match EXACT policy names from create_product_type_table.sql
DROP POLICY IF EXISTS "DTI can delete products" ON public."PRODUCT_TYPE";
DROP POLICY IF EXISTS "Authenticated can delete products" ON public."PRODUCT_TYPE";
DROP POLICY IF EXISTS "Authenticated users can delete product types" ON public."PRODUCT_TYPE";

-- First, add CASCADE delete to SRP foreign key (if not already exists)
-- This ensures that when a product is deleted from PRODUCT_TYPE, its SRP entry is also deleted
DO $$ 
BEGIN
    -- Check if the constraint exists and doesn't have ON DELETE CASCADE
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'srp_productTypeId_fkey' 
        AND table_name = 'SRP'
    ) THEN
        -- Drop the existing constraint
        ALTER TABLE public."SRP" DROP CONSTRAINT "srp_productTypeId_fkey";
        -- Re-add with ON DELETE CASCADE
        ALTER TABLE public."SRP" ADD CONSTRAINT "srp_productTypeId_fkey" 
            FOREIGN KEY ("productTypeId") 
            REFERENCES public."PRODUCT_TYPE"("productTypeId") 
            ON DELETE CASCADE;
    ELSE
        -- If constraint doesn't exist, add it
        ALTER TABLE public."SRP" ADD CONSTRAINT IF NOT EXISTS "srp_productTypeId_fkey" 
            FOREIGN KEY ("productTypeId") 
            REFERENCES public."PRODUCT_TYPE"("productTypeId") 
            ON DELETE CASCADE;
    END IF;
END $$;

-- Policy: Allow DTI users to delete products (using email domain or role)
-- For DTI users with @dti.gov.ph email or dti_official role
CREATE POLICY "DTI can delete products" 
ON public."PRODUCT_TYPE"
FOR DELETE 
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

-- Grant delete permission to authenticated users
GRANT DELETE ON public."PRODUCT_TYPE" TO authenticated;
GRANT DELETE ON public."PRODUCT_TYPE" TO service_role;

-- Also ensure SRP table has proper select policy
ALTER TABLE public."SRP" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view SRP prices" ON public."SRP";
DROP POLICY IF EXISTS "Authenticated can view SRP prices" ON public."SRP";

CREATE POLICY "Public can view SRP prices" 
ON public."SRP"
FOR SELECT 
USING (true);

GRANT SELECT ON public."SRP" TO authenticated;
GRANT SELECT ON public."SRP" TO anon;
GRANT SELECT ON public."SRP" TO service_role;

-- Also ensure SRP table has proper delete policy
DROP POLICY IF EXISTS "DTI can delete SRP entries" ON public."SRP";

CREATE POLICY "DTI can delete SRP entries" 
ON public."SRP"
FOR DELETE 
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

GRANT DELETE ON public."SRP" TO authenticated;
GRANT DELETE ON public."SRP" TO service_role;

-- Display confirmation
SELECT 'Delete and select policies for DTI created successfully' as status;