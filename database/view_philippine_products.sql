-- View Philippine Products in Database
-- This script helps you see the products despite RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- METHOD 1: View PRODUCT_TYPE entries (bypassing RLS)
-- ============================================

-- Disable RLS temporarily for viewing
SET LOCAL ROLE postgres;

SELECT 
    'PRODUCT_TYPE Table - Philippine Products' as table_name,
    COUNT(*) as total_count
FROM public."PRODUCT_TYPE"
WHERE "Name" IN (
    'Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt', 'Oyster Sauce',
    'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple', 'Watermelon', 'Papaya',
    'Onion', 'Garlic', 'Tomato', 'Potato', 'Carrot', 'Cabbage', 'Lettuce', 'Bell Pepper', 'Eggplant',
    'Rice', 'Oats', 'Corn Flakes', 'Koko Krunch', 'Bread', 'Pandesal',
    'Soft Drink', 'Water', 'Coffee', 'Juice',
    'Corned Beef', 'Sardines', 'Tuna', 'Meat Loaf', 'Spam',
    'Biscuit', 'Chips', 'Chocolate', 'Candy', 'Cookies'
);

-- View some sample products from PRODUCT_TYPE
SELECT 
    "productTypeId",
    "Name",
    "Brand",
    "Variant",
    "Unit",
    "Quantity"
FROM public."PRODUCT_TYPE"
WHERE "Name" IN ('Soy Sauce', 'Salt', 'Cooking Oil', 'Soft Drink')
ORDER BY "Name", "Unit"
LIMIT 20;

-- ============================================
-- METHOD 2: View ITEMS_IN_STORE entries (bypassing RLS)
-- ============================================

SELECT 
    'ITEMS_IN_STORE Table - Philippine Products' as table_name,
    COUNT(*) as total_count
FROM public."ITEMS_IN_STORE"
WHERE "productTypeId" IN (
    SELECT "productTypeId" 
    FROM public."PRODUCT_TYPE" 
    WHERE "Name" IN (
        'Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt'
    )
);

-- View sample store inventory items
SELECT 
    iis."storeItemId",
    iis."storeId",
    iis."name",
    iis."brand",
    iis."unit",
    iis."price",
    iis."availability",
    iis."category",
    iis."productTypeId"
FROM public."ITEMS_IN_STORE" iis
WHERE iis."productTypeId" IN (
    SELECT "productTypeId" 
    FROM public."PRODUCT_TYPE" 
    WHERE "Name" IN ('Soy Sauce', 'Salt', 'Cooking Oil', 'Soft Drink')
)
ORDER BY iis."name", iis."unit"
LIMIT 30;

-- ============================================
-- METHOD 3: View products grouped by name and sizes
-- ============================================

SELECT 
    pt."Name" as product_name,
    pt."Brand",
    COUNT(DISTINCT pt."productTypeId") as size_options,
    STRING_AGG(DISTINCT pt."Unit", ', ' ORDER BY pt."Unit") as available_sizes,
    COUNT(DISTINCT iis."storeItemId") as stores_carrying
FROM public."PRODUCT_TYPE" pt
LEFT JOIN public."ITEMS_IN_STORE" iis ON pt."productTypeId" = iis."productTypeId"
WHERE pt."Name" IN (
    'Soy Sauce', 'Vinegar', 'Salt', 'Cooking Oil', 'Soft Drink', 'Water', 
    'Rice', 'Corned Beef', 'Sardines', 'Chips'
)
GROUP BY pt."Name", pt."Brand"
ORDER BY pt."Name", pt."Brand"
LIMIT 30;

-- ============================================
-- ALTERNATIVE: If above doesn't work, use this
-- ============================================

-- Check total counts without RLS
SELECT 
    (SELECT COUNT(*) FROM public."PRODUCT_TYPE") as total_product_types,
    (SELECT COUNT(*) FROM public."ITEMS_IN_STORE") as total_store_items,
    (SELECT COUNT(*) FROM public."GROCERY_STORE") as total_stores;

-- View latest products added
SELECT 
    "productTypeId",
    "Name",
    "Brand",
    "Unit",
    "created_at"
FROM public."PRODUCT_TYPE"
ORDER BY "created_at" DESC
LIMIT 30;

-- View latest store items added
SELECT 
    "storeItemId",
    "name",
    "brand",
    "unit",
    "price",
    "category",
    "created_at"
FROM public."ITEMS_IN_STORE"
ORDER BY "created_at" DESC
LIMIT 30;
