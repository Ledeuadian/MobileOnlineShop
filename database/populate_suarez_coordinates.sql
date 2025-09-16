-- Populate USER table with coordinates within Barangay Suarez, Iligan City
-- Base coordinates: 8.2° N, 124.22° E
-- This will add random coordinates within approximately 2km radius of Suarez center

-- First, let's check current users without location data
SELECT userId, firstname, lastname, email, userType, latitude, longitude
FROM public."USER"
WHERE latitude IS NULL OR longitude IS NULL
LIMIT 10;

-- Update existing users with coordinates within Suarez area
-- Using small random variations to create realistic distribution
UPDATE public."USER" 
SET 
  latitude = 8.2 + (RANDOM() - 0.5) * 0.02,  -- ±0.01 degrees (~1.1km range)
  longitude = 124.22 + (RANDOM() - 0.5) * 0.02, -- ±0.01 degrees (~0.9km range at this latitude)
  location_updated_at = NOW()
WHERE latitude IS NULL OR longitude IS NULL;

-- Verify the updates
SELECT 
  userId,
  firstname,
  lastname,
  email,
  userType,
  ROUND(latitude::numeric, 6) as latitude,
  ROUND(longitude::numeric, 6) as longitude,
  location_updated_at
FROM public."USER" 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL
ORDER BY location_updated_at DESC
LIMIT 10;

-- Optional: Create some sample coordinates for testing
-- These represent different areas within Suarez, Iligan City

-- Suarez Center (main area)
-- Latitude: 8.200000, Longitude: 124.220000

-- Suarez North (residential area)
-- Latitude: 8.205000, Longitude: 124.218000

-- Suarez South (commercial area)  
-- Latitude: 8.195000, Longitude: 124.222000

-- Suarez East (school/market area)
-- Latitude: 8.202000, Longitude: 124.225000

-- Suarez West (coastal area)
-- Latitude: 8.198000, Longitude: 124.215000

-- If you want to manually assign specific coordinates to test users:
/*
UPDATE public."USER" 
SET 
  latitude = CASE 
    WHEN userType = 'store' THEN 8.200000 + (RANDOM() - 0.5) * 0.008  -- Store owners closer to center
    WHEN userType = 'dti' THEN 8.202000 + (RANDOM() - 0.5) * 0.005    -- DTI officers near government area
    ELSE 8.200000 + (RANDOM() - 0.5) * 0.015  -- Regular customers spread wider
  END,
  longitude = CASE 
    WHEN userType = 'store' THEN 124.220000 + (RANDOM() - 0.5) * 0.008
    WHEN userType = 'dti' THEN 124.222000 + (RANDOM() - 0.5) * 0.005
    ELSE 124.220000 + (RANDOM() - 0.5) * 0.015
  END,
  location_updated_at = NOW()
WHERE latitude IS NULL OR longitude IS NULL;
*/