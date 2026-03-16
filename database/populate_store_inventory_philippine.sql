-- Populate Store Inventory with Philippine Products
-- This script adds Philippine products to ITEMS_IN_STORE for existing stores
-- Run this AFTER populate_philippine_products.sql

-- First, let's check which stores exist
DO $$
DECLARE
    store_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO store_count FROM public."GROCERY_STORE";
    RAISE NOTICE 'Found % stores in database', store_count;
END $$;

-- Insert Philippine products into ITEMS_IN_STORE for all existing stores
-- This will make the products available for purchase

INSERT INTO public."ITEMS_IN_STORE" (
    "storeId",
    "productTypeId",
    "name",
    "description",
    "category",
    "price",
    "availability",
    "unit",
    "brand",
    "variant"
)
SELECT 
    gs."storeId",
    pt."productTypeId",
    pt."Name",
    COALESCE(pt."Variant", 'Standard'),
    CASE 
        -- Condiments
        WHEN pt."Name" IN ('Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt', 'Oyster Sauce') THEN 'Condiments'
        
        -- Fruits & Vegetables (split into separate categories)
        WHEN pt."Name" IN ('Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple', 'Watermelon', 'Papaya') THEN 'Fruits'
        WHEN pt."Name" IN ('Onion', 'Garlic', 'Tomato', 'Potato', 'Carrot', 'Cabbage', 'Lettuce', 'Bell Pepper', 'Eggplant') THEN 'Vegetables'
        
        -- Rice & Grains / Cereal & Breakfast
        WHEN pt."Name" IN ('Rice', 'Oats', 'Corn Flakes', 'Koko Krunch', 'Bread', 'Pandesal') THEN 'Rice & Grains'
        
        -- Beverages
        WHEN pt."Name" IN ('Soft Drink', 'Water', 'Coffee', 'Juice') THEN 'Beverages'
        
        -- Canned Goods
        WHEN pt."Name" IN ('Corned Beef', 'Sardines', 'Tuna', 'Meat Loaf', 'Spam') THEN 'Canned Goods'
        
        -- Snacks
        WHEN pt."Name" IN ('Biscuit', 'Chips', 'Chocolate', 'Candy', 'Cookies') THEN 'Snacks'
        
        ELSE 'Others'
    END as category,
    
    -- Set reasonable prices (30-50 pesos range for most items, adjusted by size)
    CASE 
        -- Condiments pricing
        WHEN pt."Name" = 'Soy Sauce' AND pt."Unit" LIKE '%385ml%' THEN 25.00
        WHEN pt."Name" = 'Soy Sauce' AND pt."Unit" LIKE '%1L%' THEN 55.00
        WHEN pt."Name" = 'Vinegar' AND pt."Unit" LIKE '%385ml%' THEN 20.00
        WHEN pt."Name" = 'Vinegar' AND pt."Unit" LIKE '%1L%' THEN 45.00
        WHEN pt."Name" = 'Vinegar' AND pt."Unit" LIKE '%750ml%' THEN 35.00
        WHEN pt."Name" = 'Fish Sauce' AND pt."Unit" LIKE '%350ml%' THEN 30.00
        WHEN pt."Name" = 'Fish Sauce' AND pt."Unit" LIKE '%750ml%' THEN 60.00
        WHEN pt."Name" = 'Cooking Oil' AND pt."Unit" LIKE '%1L%' THEN 85.00
        WHEN pt."Name" = 'Cooking Oil' AND pt."Unit" LIKE '%2L%' THEN 160.00
        WHEN pt."Name" = 'Ketchup' AND pt."Unit" LIKE '%320g%' THEN 35.00
        WHEN pt."Name" = 'Ketchup' AND pt."Unit" LIKE '%550g%' THEN 55.00
        WHEN pt."Name" = 'Ketchup' AND pt."Unit" LIKE '%1kg%' THEN 95.00
        WHEN pt."Name" = 'Salt' AND pt."Unit" LIKE '%150g%' THEN 12.00
        WHEN pt."Name" = 'Salt' AND pt."Unit" LIKE '%300g%' THEN 20.00
        WHEN pt."Name" = 'Salt' AND pt."Unit" LIKE '%1kg%' THEN 55.00
        WHEN pt."Name" = 'Oyster Sauce' AND pt."Unit" LIKE '%255g%' THEN 40.00
        WHEN pt."Name" = 'Oyster Sauce' AND pt."Unit" LIKE '%510g%' THEN 75.00
        
        -- Fresh produce (per kg)
        WHEN pt."Name" IN ('Apple', 'Orange', 'Grapes') THEN 150.00
        WHEN pt."Name" IN ('Banana', 'Papaya') THEN 60.00
        WHEN pt."Name" = 'Mango' THEN 120.00
        WHEN pt."Name" = 'Pineapple' THEN 80.00
        WHEN pt."Name" = 'Watermelon' THEN 45.00
        WHEN pt."Name" IN ('Onion', 'Garlic', 'Tomato', 'Potato', 'Carrot') THEN 80.00
        WHEN pt."Name" IN ('Cabbage', 'Lettuce', 'Bell Pepper', 'Eggplant') THEN 70.00
        
        -- Rice (per kg or pack)
        WHEN pt."Name" = 'Rice' AND pt."Unit" = 'kg' THEN 55.00
        WHEN pt."Name" = 'Rice' AND pt."Unit" LIKE '%5kg%' THEN 270.00
        WHEN pt."Name" = 'Rice' AND pt."Unit" LIKE '%10kg%' THEN 520.00
        
        -- Oats
        WHEN pt."Name" = 'Oats' AND pt."Unit" LIKE '%200g%' THEN 55.00
        WHEN pt."Name" = 'Oats' AND pt."Unit" LIKE '%400g%' THEN 105.00
        WHEN pt."Name" = 'Oats' AND pt."Unit" LIKE '%800g%' THEN 195.00
        
        -- Cereal
        WHEN pt."Name" = 'Corn Flakes' AND pt."Unit" LIKE '%275g%' THEN 120.00
        WHEN pt."Name" = 'Corn Flakes' AND pt."Unit" LIKE '%500g%' THEN 210.00
        WHEN pt."Name" = 'Koko Krunch' AND pt."Unit" LIKE '%170g%' THEN 95.00
        WHEN pt."Name" = 'Koko Krunch' AND pt."Unit" LIKE '%330g%' THEN 175.00
        
        -- Bread
        WHEN pt."Name" = 'Bread' THEN 55.00
        WHEN pt."Name" = 'Pandesal' THEN 35.00
        
        -- Soft drinks
        WHEN pt."Name" = 'Soft Drink' AND pt."Unit" LIKE '%can%' THEN 25.00
        WHEN pt."Name" = 'Soft Drink' AND pt."Unit" LIKE '%350ml%' THEN 20.00
        WHEN pt."Name" = 'Soft Drink' AND pt."Unit" LIKE '%1L%' THEN 45.00
        WHEN pt."Name" = 'Soft Drink' AND pt."Unit" LIKE '%1.5L%' THEN 65.00
        
        -- Water
        WHEN pt."Name" = 'Water' AND pt."Unit" LIKE '%350ml%' THEN 12.00
        WHEN pt."Name" = 'Water' AND pt."Unit" LIKE '%500ml%' THEN 15.00
        WHEN pt."Name" = 'Water' AND pt."Unit" LIKE '%1L%' THEN 25.00
        WHEN pt."Name" = 'Water' AND pt."Unit" LIKE '%gallon%' THEN 35.00
        
        -- Coffee
        WHEN pt."Name" = 'Coffee' AND pt."Unit" LIKE '%10sachets%' THEN 60.00
        WHEN pt."Name" = 'Coffee' AND pt."Unit" LIKE '%30sachets%' THEN 165.00
        
        -- Juice
        WHEN pt."Name" = 'Juice' AND pt."Unit" LIKE '%can 240ml%' THEN 30.00
        WHEN pt."Name" = 'Juice' AND pt."Unit" LIKE '%bottle 230ml%' THEN 25.00
        WHEN pt."Name" = 'Juice' AND pt."Unit" LIKE '%bottle 1L%' THEN 75.00
        
        -- Canned goods
        WHEN pt."Name" = 'Corned Beef' AND pt."Unit" LIKE '%150g%' THEN 55.00
        WHEN pt."Name" = 'Corned Beef' AND pt."Unit" LIKE '%175g%' THEN 65.00
        WHEN pt."Name" = 'Corned Beef' AND pt."Unit" LIKE '%210g%' THEN 75.00
        WHEN pt."Name" = 'Sardines' AND pt."Unit" LIKE '%155g%' THEN 25.00
        WHEN pt."Name" = 'Sardines' AND pt."Unit" LIKE '%425g%' THEN 65.00
        WHEN pt."Name" = 'Tuna' AND pt."Unit" LIKE '%180g%' THEN 35.00
        WHEN pt."Name" = 'Tuna' AND pt."Unit" LIKE '%420g%' THEN 85.00
        WHEN pt."Name" = 'Meat Loaf' THEN 45.00
        WHEN pt."Name" = 'Spam' THEN 120.00
        
        -- Snacks
        WHEN pt."Name" = 'Biscuit' AND pt."Unit" LIKE '%250g%' THEN 40.00
        WHEN pt."Name" = 'Biscuit' AND pt."Unit" LIKE '%300g%' THEN 45.00
        WHEN pt."Name" = 'Biscuit' AND pt."Unit" LIKE '%800g%' THEN 110.00
        WHEN pt."Name" = 'Chips' AND pt."Unit" LIKE '%40g%' THEN 15.00
        WHEN pt."Name" = 'Chips' AND pt."Unit" LIKE '%60g%' THEN 20.00
        WHEN pt."Name" = 'Chips' AND pt."Unit" LIKE '%85g%' THEN 25.00
        WHEN pt."Name" = 'Chips' AND pt."Unit" LIKE '%90g%' THEN 28.00
        WHEN pt."Name" = 'Chips' AND pt."Unit" LIKE '%100g%' THEN 30.00
        WHEN pt."Name" = 'Chocolate' THEN 35.00
        WHEN pt."Name" = 'Candy' AND pt."Unit" LIKE '%roll%' THEN 10.00
        WHEN pt."Name" = 'Candy' AND pt."Unit" LIKE '%pack%' THEN 35.00
        WHEN pt."Name" = 'Cookies' THEN 30.00
        
        ELSE 50.00
    END as price,
    
    -- Set availability (stock quantity)
    CASE 
        WHEN pt."Name" IN ('Apple', 'Banana', 'Orange', 'Mango', 'Onion', 'Garlic', 'Tomato', 'Potato') THEN 100
        WHEN pt."Name" IN ('Rice', 'Water', 'Soft Drink') THEN 150
        ELSE 50
    END as availability,
    
    pt."Unit",
    pt."Brand",
    pt."Variant"
FROM 
    public."GROCERY_STORE" gs
CROSS JOIN 
    public."PRODUCT_TYPE" pt
WHERE 
    -- Only insert products that were just added (Philippine products)
    pt."Name" IN (
        'Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt', 'Oyster Sauce',
        'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple', 'Watermelon', 'Papaya',
        'Onion', 'Garlic', 'Tomato', 'Potato', 'Carrot', 'Cabbage', 'Lettuce', 'Bell Pepper', 'Eggplant',
        'Rice', 'Oats', 'Corn Flakes', 'Koko Krunch', 'Bread', 'Pandesal',
        'Soft Drink', 'Water', 'Coffee', 'Juice',
        'Corned Beef', 'Sardines', 'Tuna', 'Meat Loaf', 'Spam',
        'Biscuit', 'Chips', 'Chocolate', 'Candy', 'Cookies'
    )
    -- Only if this product isn't already in the store's inventory
    AND NOT EXISTS (
        SELECT 1 
        FROM public."ITEMS_IN_STORE" iis 
        WHERE iis."storeId" = gs."storeId" 
        AND iis."productTypeId" = pt."productTypeId"
    );

-- Display results
SELECT 
    'Products Added to Store Inventory' as info,
    COUNT(*) as total_items_added
FROM public."ITEMS_IN_STORE"
WHERE "productTypeId" IN (
    SELECT "productTypeId" 
    FROM public."PRODUCT_TYPE" 
    WHERE "Name" IN (
        'Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt', 'Oyster Sauce',
        'Apple', 'Banana', 'Orange', 'Mango', 'Grapes', 'Pineapple', 'Watermelon', 'Papaya',
        'Onion', 'Garlic', 'Tomato', 'Potato', 'Carrot', 'Cabbage', 'Lettuce', 'Bell Pepper', 'Eggplant',
        'Rice', 'Oats', 'Corn Flakes', 'Koko Krunch', 'Bread', 'Pandesal',
        'Soft Drink', 'Water', 'Coffee', 'Juice',
        'Corned Beef', 'Sardines', 'Tuna', 'Meat Loaf', 'Spam',
        'Biscuit', 'Chips', 'Chocolate', 'Candy', 'Cookies'
    )
);

-- Show sample of what was added
SELECT 
    'Sample Products by Category' as info,
    category,
    COUNT(*) as product_count
FROM public."ITEMS_IN_STORE"
WHERE "productTypeId" IN (
    SELECT "productTypeId" 
    FROM public."PRODUCT_TYPE" 
    WHERE "Name" IN (
        'Soy Sauce', 'Vinegar', 'Fish Sauce', 'Cooking Oil', 'Ketchup', 'Salt'
    )
)
GROUP BY category
ORDER BY category;
