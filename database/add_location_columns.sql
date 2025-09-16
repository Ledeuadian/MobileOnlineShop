-- Add location columns to USER and GROCERY_STORE tables for Suarez, Iligan City coordinates
-- Run this first before populating coordinates

-- Add location columns to USER table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'USER' AND column_name = 'latitude') THEN
        ALTER TABLE public."USER" ADD COLUMN latitude NUMERIC(10, 8);
        RAISE NOTICE 'Added latitude column to USER table';
    ELSE
        RAISE NOTICE 'Latitude column already exists in USER table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'USER' AND column_name = 'longitude') THEN
        ALTER TABLE public."USER" ADD COLUMN longitude NUMERIC(11, 8);
        RAISE NOTICE 'Added longitude column to USER table';
    ELSE
        RAISE NOTICE 'Longitude column already exists in USER table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'USER' AND column_name = 'location_updated_at') THEN
        ALTER TABLE public."USER" ADD COLUMN location_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added location_updated_at column to USER table';
    ELSE
        RAISE NOTICE 'Location_updated_at column already exists in USER table';
    END IF;
END $$;

-- Add location columns to GROCERY_STORE table if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GROCERY_STORE' AND column_name = 'latitude') THEN
        ALTER TABLE public."GROCERY_STORE" ADD COLUMN latitude NUMERIC(10, 8);
        RAISE NOTICE 'Added latitude column to GROCERY_STORE table';
    ELSE
        RAISE NOTICE 'Latitude column already exists in GROCERY_STORE table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GROCERY_STORE' AND column_name = 'longitude') THEN
        ALTER TABLE public."GROCERY_STORE" ADD COLUMN longitude NUMERIC(11, 8);
        RAISE NOTICE 'Added longitude column to GROCERY_STORE table';
    ELSE
        RAISE NOTICE 'Longitude column already exists in GROCERY_STORE table';
    END IF;
END $$;

-- Create indexes for better performance (only if columns were added)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_lat_lng') THEN
        CREATE INDEX idx_user_lat_lng ON public."USER" (latitude, longitude);
        RAISE NOTICE 'Created spatial index on USER table';
    ELSE
        RAISE NOTICE 'Spatial index already exists on USER table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_store_lat_lng') THEN
        CREATE INDEX idx_store_lat_lng ON public."GROCERY_STORE" (latitude, longitude);
        RAISE NOTICE 'Created spatial index on GROCERY_STORE table';
    ELSE
        RAISE NOTICE 'Spatial index already exists on GROCERY_STORE table';
    END IF;
END $$;

-- Show table structures to verify
SELECT 
    'USER' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'USER' 
  AND column_name IN ('latitude', 'longitude', 'location_updated_at')
ORDER BY column_name;

SELECT 
    'GROCERY_STORE' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'GROCERY_STORE' 
  AND column_name IN ('latitude', 'longitude')
ORDER BY column_name;