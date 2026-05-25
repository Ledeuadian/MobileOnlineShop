-- Debug: Check existing RLS policies on GROCERY_STORE
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'GROCERY_STORE';

-- Debug: Check if GROCERY_STORE has any data at all (bypassing RLS for testing)
SELECT COUNT(*) as total_stores FROM public."GROCERY_STORE";

-- Debug: Check RLS status on GROCERY_STORE
SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'GROCERY_STORE';

-- Debug: Check current policies on USER table (needed for DTI lookup)
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'USER';