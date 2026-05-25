-- DIAGNOSTIC: Check GROCERY_STORE table content and policies
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if table has data (requires service_role or bypass RLS)
SELECT COUNT(*) as store_count FROM public."GROCERY_STORE";

-- 2. Check all policies on GROCERY_STORE
SELECT 
    policyname,
    permissive,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'GROCERY_STORE';

-- 3. Check if RLS is enabled
SELECT 
    relname,
    relrowsecurity
FROM pg_class 
WHERE relname = 'GROCERY_STORE';

-- 4. Check tables in public schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;