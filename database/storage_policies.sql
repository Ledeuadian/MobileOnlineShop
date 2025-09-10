-- Storage Bucket Policies for Images Upload
-- Run these commands in your Supabase SQL Editor

-- 1. Enable RLS on the storage.objects table (if not already enabled)
-- This is usually enabled by default in Supabase

-- 2. Policy to allow authenticated users to insert (upload) images
CREATE POLICY "Allow authenticated users to upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'Images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 3. Policy to allow authenticated users to view their own uploaded images
CREATE POLICY "Allow users to view their own images" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'Images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Policy to allow public access to view images (optional - for public store images)
CREATE POLICY "Allow public to view store images" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'Images');

-- 5. Policy to allow authenticated users to update their own images
CREATE POLICY "Allow users to update their own images" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'Images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 6. Policy to allow authenticated users to delete their own images
CREATE POLICY "Allow users to delete their own images" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'Images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Alternative simpler policies (use these if the above don't work):

-- Simple policy to allow all authenticated users to upload to Images bucket
-- CREATE POLICY "Allow authenticated upload to Images" ON storage.objects
-- FOR INSERT TO authenticated
-- WITH CHECK (bucket_id = 'Images');

-- Simple policy to allow all authenticated users to view Images
-- CREATE POLICY "Allow authenticated view Images" ON storage.objects
-- FOR SELECT TO authenticated
-- USING (bucket_id = 'Images');

-- Public read access for Images bucket
-- CREATE POLICY "Allow public read Images" ON storage.objects
-- FOR SELECT TO public
-- USING (bucket_id = 'Images');
