-- Seed 10 items for storeId = 4 based on PRODUCT_TYPE table entries
-- This script creates items that link to existing product types

-- Step 1: Clear existing items for storeId = 4 to avoid duplicates
DELETE FROM public."ITEMS_IN_STORE" WHERE "storeId" = 4;

-- Step 2: Insert 10 items for storeId = 4 based on specific PRODUCT_TYPE entries
-- These productTypeIds correspond to actual entries in PRODUCT_TYPE table
INSERT INTO public."ITEMS_IN_STORE" (
    "storeId",
    "productTypeId",
    "name",
    "description",
    "category",
    "price",
    "availability"
)
-- Dairy Products
SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Dairy',
       89.00,
       50
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Milk' AND pt."Brand" = 'Alaska'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Dairy',
       27.00,
       100
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Milk' AND pt."Brand" = 'Bear Brand'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Meat',
       185.00,
       30
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Chicken' AND pt."Variant" = 'Whole Chicken'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Rice & Grains',
       68.00,
       200
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Rice' AND pt."Brand" = 'Dinorado'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Fruits',
       155.00,
       50
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Mango' AND pt."Brand" = 'Fresh'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Vegetables',
       82.00,
       100
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Onion' AND pt."Variant" = 'Red Onion'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Rice & Grains',
       57.00,
       40
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Bread' AND pt."Brand" = 'Gardenia'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Canned Goods',
       42.00,
       80
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Corned Beef' AND pt."Brand" = 'Argentina'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Condiments',
       78.00,
       60
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Soy Sauce' AND pt."Brand" = 'Silver Swan'

UNION ALL

SELECT 4, pt."productTypeId", pt."Name" || ' - ' || pt."Brand", 
       pt."Variant" || ' (' || pt."Unit" || ')',
       'Meat',
       165.00,
       15
FROM public."PRODUCT_TYPE" pt
WHERE pt."Name" = 'Fish' AND pt."Variant" = 'Bangus';

-- Step 3: Verify insertion - show all items with their productTypeIds
SELECT 
    i."storeItemId",
    i."productTypeId",
    i."name",
    i."category",
    i."price",
    i."availability"
FROM public."ITEMS_IN_STORE" i
WHERE i."storeId" = 4
ORDER BY i."storeItemId";
