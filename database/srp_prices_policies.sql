-- RLS Policies for SRP table
-- This file sets up Row Level Security policies for the SRP table

-- Enable Row Level Security on SRP table
ALTER TABLE public."SRP" ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view SRP prices" ON public."SRP";
DROP POLICY IF EXISTS "Authenticated users can insert SRP prices" ON public."SRP";
DROP POLICY IF EXISTS "Authenticated users can update SRP prices" ON public."SRP";
DROP POLICY IF EXISTS "Service role can manage SRP prices" ON public."SRP";

-- Policy 1: Public can view all SRP prices (for public price display)
CREATE POLICY "Public can view SRP prices" 
ON public."SRP"
FOR SELECT 
USING (true);

-- Policy 2: Authenticated users can insert SRP prices
CREATE POLICY "Authenticated users can insert SRP prices" 
ON public."SRP"
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Authenticated users can update SRP prices
CREATE POLICY "Authenticated users can update SRP prices" 
ON public."SRP"
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Policy 4: Service role has full access (for scripts and admin operations)
CREATE POLICY "Service role can manage SRP prices" 
ON public."SRP"
FOR ALL 
USING (auth.role() = 'service_role');

-- Grant necessary permissions
GRANT SELECT ON public."SRP" TO anon;
GRANT ALL ON public."SRP" TO authenticated;
GRANT ALL ON public."SRP" TO service_role;

-- Display confirmation
SELECT 'RLS policies for SRP created successfully' as status;

-- Show active policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'SRP';
