-- Test query to check what categories exist in the database
SELECT DISTINCT category, COUNT(*) as product_count 
FROM "ITEMS_IN_STORE" 
WHERE availability > 0 
GROUP BY category 
ORDER BY category;

-- Test query to get all Fruits & Vegetables items
SELECT storeItemId, name, category, price, unit, availability, "storeId"
FROM "ITEMS_IN_STORE" 
WHERE category = 'Fruits & Vegetables' 
AND availability > 0 
ORDER BY name;
