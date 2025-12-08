-- Populate SRP table with prices for all product types
-- This script assigns Suggested Retail Prices for each productTypeId in PRODUCT_TYPE table

-- Note: If you get authorization errors, you may need to:
-- 1. Run srp_prices_policies.sql first to set up RLS policies
-- 2. Execute this script as a service_role or authenticated user
-- 3. Or temporarily disable RLS with: ALTER TABLE public."SRP" DISABLE ROW LEVEL SECURITY;

-- Insert SRP prices for all products in PRODUCT_TYPE table
INSERT INTO public."SRP" ("productTypeId", "Price")
SELECT 
    "productTypeId", 
    CASE 
        -- Dairy Products (₱20-120)
        WHEN "Name" = 'Milk' AND "Unit" = 'liter' THEN 85.00
        WHEN "Name" = 'Milk' AND "Unit" LIKE '%can%' THEN 25.00
        WHEN "Name" = 'Milk' AND "Unit" LIKE '%pack%' THEN 45.00
        WHEN "Name" = 'Cheese' THEN 65.00
        WHEN "Name" = 'Butter' THEN 55.00
        WHEN "Name" = 'Yogurt' THEN 35.00
        WHEN "Name" = 'Condensed Milk' THEN 45.00
        WHEN "Name" = 'Evaporated Milk' THEN 35.00
        
        -- Meat Products (₱140-650/kg)
        WHEN "Name" = 'Chicken' AND "Variant" = 'Whole Chicken' THEN 180.00
        WHEN "Name" = 'Chicken' AND "Variant" = 'Chicken Breast' THEN 220.00
        WHEN "Name" = 'Chicken' AND "Variant" = 'Chicken Thigh' THEN 190.00
        WHEN "Name" = 'Pork' AND "Variant" = 'Pork Belly' THEN 320.00
        WHEN "Name" = 'Pork' AND "Variant" = 'Pork Shoulder' THEN 280.00
        WHEN "Name" = 'Beef' THEN 450.00
        WHEN "Name" = 'Fish' AND "Variant" = 'Bangus' THEN 160.00
        WHEN "Name" = 'Fish' AND "Variant" = 'Tilapia' THEN 140.00
        WHEN "Name" = 'Hotdog' THEN 95.00
        WHEN "Name" = 'Bacon' THEN 120.00
        
        -- Rice and Grains (₱25-85)
        WHEN "Name" = 'Rice' AND "Variant" = 'Premium' THEN 65.00
        WHEN "Name" = 'Rice' AND "Variant" = 'Fragrant Rice' THEN 55.00
        WHEN "Name" = 'Rice' AND "Variant" = 'Well Milled' THEN 45.00
        WHEN "Name" = 'Oats' THEN 85.00
        WHEN "Name" = 'Bread' THEN 55.00
        WHEN "Name" = 'Pandesal' THEN 25.00
        
        -- Fruits (₱35-200/kg)
        WHEN "Name" = 'Apple' THEN 180.00
        WHEN "Name" = 'Banana' AND "Variant" = 'Saba' THEN 40.00
        WHEN "Name" = 'Banana' AND "Variant" = 'Lakatan' THEN 60.00
        WHEN "Name" = 'Orange' THEN 120.00
        WHEN "Name" = 'Mango' THEN 150.00
        WHEN "Name" = 'Grapes' THEN 200.00
        WHEN "Name" = 'Pineapple' THEN 80.00
        WHEN "Name" = 'Watermelon' THEN 35.00
        WHEN "Name" = 'Papaya' THEN 45.00
        
        -- Vegetables (₱30-140/kg)
        WHEN "Name" = 'Onion' AND "Variant" = 'Red Onion' THEN 80.00
        WHEN "Name" = 'Onion' AND "Variant" = 'White Onion' THEN 70.00
        WHEN "Name" = 'Garlic' THEN 140.00
        WHEN "Name" = 'Tomato' THEN 60.00
        WHEN "Name" = 'Potato' THEN 50.00
        WHEN "Name" = 'Carrot' THEN 65.00
        WHEN "Name" = 'Cabbage' THEN 45.00
        WHEN "Name" = 'Lettuce' THEN 35.00
        WHEN "Name" = 'Bell Pepper' THEN 120.00
        WHEN "Name" = 'Eggplant' THEN 55.00
        
        -- Canned Goods (₱15-85)
        WHEN "Name" = 'Corned Beef' AND "Brand" = 'Argentina' THEN 55.00
        WHEN "Name" = 'Corned Beef' AND "Brand" = 'Libby''s' THEN 65.00
        WHEN "Name" = 'Sardines' AND "Brand" = 'Ligo' THEN 25.00
        WHEN "Name" = 'Sardines' AND "Brand" = 'Century' THEN 28.00
        WHEN "Name" = 'Tuna' THEN 35.00
        WHEN "Name" = 'Spam' THEN 85.00
        WHEN "Name" = 'Tomato Sauce' THEN 18.00
        WHEN "Name" = 'Tomato Paste' THEN 15.00
        
        -- Condiments (₱12-85)
        WHEN "Name" = 'Soy Sauce' THEN 25.00
        WHEN "Name" = 'Vinegar' THEN 20.00
        WHEN "Name" = 'Fish Sauce' THEN 30.00
        WHEN "Name" = 'Oyster Sauce' THEN 45.00
        WHEN "Name" = 'Ketchup' THEN 35.00
        WHEN "Name" = 'Mayonnaise' THEN 55.00
        WHEN "Name" = 'Salt' THEN 12.00
        WHEN "Name" = 'Sugar' AND "Variant" = 'Muscovado' THEN 85.00
        WHEN "Name" = 'Sugar' AND "Variant" = 'Refined' THEN 55.00
        
        -- Cooking Oil (₱65-250)
        WHEN "Name" = 'Cooking Oil' AND "Brand" = 'Knife' THEN 85.00
        WHEN "Name" = 'Cooking Oil' AND "Brand" = 'Minola' THEN 95.00
        WHEN "Name" = 'Olive Oil' THEN 250.00
        WHEN "Name" = 'Coconut Oil' THEN 120.00
        
        -- Beverages (₱15-85)
        WHEN "Name" = 'Soft Drink' AND "Brand" = 'Coca Cola' THEN 75.00
        WHEN "Name" = 'Soft Drink' AND "Brand" = 'Pepsi' THEN 70.00
        WHEN "Name" = 'Juice' AND "Brand" = 'Del Monte' THEN 28.00
        WHEN "Name" = 'Juice' AND "Brand" = 'Zesto' THEN 15.00
        WHEN "Name" = 'Water' THEN 20.00
        WHEN "Name" = 'Coffee' THEN 85.00
        WHEN "Name" = 'Tea' THEN 65.00
        
        -- Snacks (₱25-95)
        WHEN "Name" = 'Biscuit' AND "Brand" = 'Skyflakes' THEN 55.00
        WHEN "Name" = 'Biscuit' AND "Brand" = 'Fibisco' THEN 65.00
        WHEN "Name" = 'Chocolate' THEN 45.00
        WHEN "Name" = 'Candy' THEN 35.00
        WHEN "Name" = 'Chips' AND "Brand" = 'Nova' THEN 25.00
        WHEN "Name" = 'Chips' AND "Brand" = 'Piattos' THEN 35.00
        
        -- Personal Care (₱35-185)
        WHEN "Name" = 'Shampoo' THEN 185.00
        WHEN "Name" = 'Soap' THEN 35.00
        WHEN "Name" = 'Toothpaste' THEN 85.00
        WHEN "Name" = 'Toothbrush' THEN 45.00
        
        -- Household Items (₱35-125)
        WHEN "Name" = 'Detergent' THEN 85.00
        WHEN "Name" = 'Dishwashing Liquid' THEN 65.00
        WHEN "Name" = 'Tissue Paper' THEN 55.00
        WHEN "Name" = 'Toilet Paper' THEN 35.00
        
        -- Frozen Items (₱85-385)
        WHEN "Name" = 'Ice Cream' THEN 385.00
        WHEN "Name" = 'Frozen Vegetables' THEN 125.00
        WHEN "Name" = 'Fish Fillet' THEN 185.00
        
        -- Baby Products (₱85-850)
        WHEN "Name" = 'Baby Food' THEN 85.00
        WHEN "Name" = 'Diaper' THEN 485.00
        WHEN "Name" = 'Baby Formula' THEN 850.00
        
        -- Pet Food (₱185-285)
        WHEN "Name" = 'Dog Food' THEN 285.00
        WHEN "Name" = 'Cat Food' THEN 185.00
        
        -- Default price based on unit type
        WHEN "Unit" = 'kg' THEN 50.00
        WHEN "Unit" LIKE '%L%' OR "Unit" LIKE '%liter%' THEN 75.00
        WHEN "Unit" LIKE '%ml%' THEN 30.00
        WHEN "Unit" LIKE '%g%' AND "Unit" NOT LIKE '%kg%' THEN 40.00
        ELSE 50.00
    END as calculated_price
FROM public."PRODUCT_TYPE";

-- Display results
SELECT 
    'SRP population completed successfully' as status,
    COUNT(*) as total_records_inserted
FROM public."SRP";

-- Show sample of populated data
SELECT 
    s.*,
    p."Name" as product_name,
    p."Brand",
    p."Variant",
    p."Unit"
FROM public."SRP" s
JOIN public."PRODUCT_TYPE" p ON s."productTypeId" = p."productTypeId"
ORDER BY s."productTypeId"
LIMIT 20;

-- Display price summary by category
SELECT 
    p."Name" as product_category,
    COUNT(*) as count,
    MIN(s."Price") as min_price,
    MAX(s."Price") as max_price,
    ROUND(AVG(s."Price")::numeric, 2) as avg_price
FROM public."SRP" s
JOIN public."PRODUCT_TYPE" p ON s."productTypeId" = p."productTypeId"
GROUP BY p."Name"
ORDER BY avg_price DESC
LIMIT 30;
