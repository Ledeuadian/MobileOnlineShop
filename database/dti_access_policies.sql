-- Add DTI access policies to view all stores and items
-- This allows DTI officials to monitor all stores in the system

-- First, we need to create a way to identify DTI users
-- We'll assume DTI users have a specific email domain or role

-- Create policy for DTI to view all grocery stores
CREATE POLICY "DTI can view all stores" ON public.GROCERY_STORE
    FOR SELECT USING (
        -- Allow if user is DTI (you can customize this condition)
        -- For now, we'll allow anyone with 'dti' in their email or a specific DTI role
        auth.jwt() ->> 'email' LIKE '%@dti.gov.ph%' 
        OR auth.jwt() ->> 'role' = 'dti_official'
        -- Or if you want to allow specific user IDs, you can add them here
        -- OR auth.uid()::text IN ('dti-user-id-1', 'dti-user-id-2')
    );

-- Create policy for DTI to view all items in all stores
CREATE POLICY "DTI can view all store items" ON public.ITEMS_IN_STORE
    FOR SELECT USING (
        -- Allow if user is DTI
        auth.jwt() ->> 'email' LIKE '%@dti.gov.ph%' 
        OR auth.jwt() ->> 'role' = 'dti_official'
    );

-- Alternative approach: Create a user_roles table and manage permissions there
-- This is more scalable for managing different types of officials

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
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Alternative DTI policies using the roles table
CREATE POLICY "DTI users can view all stores via roles" ON public.GROCERY_STORE
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('dti_official', 'admin', 'government_monitor')
        )
    );

CREATE POLICY "DTI users can view all items via roles" ON public.ITEMS_IN_STORE
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_roles.user_id = auth.uid() 
            AND user_roles.role IN ('dti_official', 'admin', 'government_monitor')
        )
    );
