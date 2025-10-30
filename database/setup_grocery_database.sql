-- Master script to populate grocery database with realistic products
-- Run this script to set up PRODUCT_TYPE and ITEMS_IN_STORE tables with comprehensive data

-- Step 1: Create PRODUCT_TYPE table (if not exists)
\i create_product_type_table.sql

-- Step 2: Create the main store tables (if not already created)
\i store_tables.sql

-- Step 3: Populate PRODUCT_TYPE with realistic grocery products
\i populate_product_types.sql

-- Step 4: Populate stores and their inventory
\i populate_store_items.sql

-- Step 5: Create SRP prices table (if not already created)
\i create_srp_prices_table.sql

-- Optional: Show some statistics after population
SELECT 
    'PRODUCT_TYPE' as table_name,
    COUNT(*) as total_records
FROM public."PRODUCT_TYPE"
UNION ALL
SELECT 
    'ITEMS_IN_STORE' as table_name,
    COUNT(*) as total_records  
FROM public.ITEMS_IN_STORE
UNION ALL
SELECT 
    'GROCERY_STORE' as table_name,
    COUNT(*) as total_records
FROM public.GROCERY_STORE;

-- Show sample products by category
SELECT 
    "Name",
    "Brand", 
    "Variant",
    "Unit",
    COUNT(*) as variants_count
FROM public."PRODUCT_TYPE"
GROUP BY "Name", "Brand", "Variant", "Unit"
ORDER BY "Name"
LIMIT 20;

-- Show store inventory summary
SELECT 
    gs.storeName,
    COUNT(iis.storeItemId) as total_items,
    AVG(iis.item_price) as avg_price,
    SUM(iis.item_quantity) as total_stock
FROM public.GROCERY_STORE gs
LEFT JOIN public.ITEMS_IN_STORE iis ON gs.storeId = iis.storeId
GROUP BY gs.storeId, gs.storeName
ORDER BY gs.storeName;