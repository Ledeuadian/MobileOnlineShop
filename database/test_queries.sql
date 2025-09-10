-- Test queries to check the ITEMS_IN_STORE table structure and data

-- 1. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ITEMS_IN_STORE'
ORDER BY ordinal_position;

-- 2. Check available categories
SELECT DISTINCT category, COUNT(*) as item_count
FROM "ITEMS_IN_STORE"
GROUP BY category
ORDER BY category;

-- 3. Check for Beverages specifically
SELECT storeItemId, name, description, price, unit, availability, category
FROM "ITEMS_IN_STORE"
WHERE category = 'Beverages'
ORDER BY name;

-- 4. Check a few sample records
SELECT storeItemId, name, description, price, unit, availability, category
FROM "ITEMS_IN_STORE"
LIMIT 10;
