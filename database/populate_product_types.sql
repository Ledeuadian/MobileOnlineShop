-- Populate PRODUCT_TYPE table with realistic grocery products
-- This file contains a comprehensive list of common grocery items across different categories

-- Insert Dairy Products
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Milk', 'Alaska', 'Fresh Milk', 'liter', 1),
('Milk', 'Bear Brand', 'Sterilized Milk', 'can 300ml', 1),
('Milk', 'Nestle', 'All Purpose Cream', 'pack 250ml', 1),
('Cheese', 'Eden', 'Processed Cheese', 'pack 200g', 1),
('Cheese', 'Kraft', 'Cheddar Cheese', 'pack 165g', 1),
('Butter', 'Star Margarine', 'Regular', 'pack 200g', 1),
('Yogurt', 'Nestle', 'Greek Style', 'cup 150g', 1),
('Condensed Milk', 'Alaska', 'Sweetened', 'can 300ml', 1),
('Evaporated Milk', 'Carnation', 'Regular', 'can 370ml', 1),

-- Insert Meat Products
('Chicken', 'Fresh', 'Whole Chicken', 'kg', 1),
('Chicken', 'Fresh', 'Chicken Breast', 'kg', 1),
('Chicken', 'Fresh', 'Chicken Thigh', 'kg', 1),
('Pork', 'Fresh', 'Pork Belly', 'kg', 1),
('Pork', 'Fresh', 'Pork Shoulder', 'kg', 1),
('Beef', 'Fresh', 'Ground Beef', 'kg', 1),
('Fish', 'Fresh', 'Bangus', 'kg', 1),
('Fish', 'Fresh', 'Tilapia', 'kg', 1),
('Hotdog', 'CDO', 'Tender Juicy', 'pack 500g', 1),
('Bacon', 'Purefoods', 'Sliced Bacon', 'pack 200g', 1),

-- Insert Rice and Grains
('Rice', 'Dinorado', 'Premium', 'kg', 1),
('Rice', 'Jasmine', 'Fragrant Rice', 'kg', 1),
('Rice', 'Sinandomeng', 'Well Milled', 'kg', 1),
('Oats', 'Quaker', 'Quick Cooking', 'pack 400g', 1),
('Bread', 'Gardenia', 'Classic White', 'loaf', 1),
('Bread', 'Gardenia', 'Wheat Bread', 'loaf', 1),
('Pandesal', 'Local Bakery', 'Fresh Baked', 'pack 10pcs', 1),

-- Insert Fruits
('Apple', 'Fresh', 'Red Delicious', 'kg', 1),
('Banana', 'Fresh', 'Saba', 'kg', 1),
('Banana', 'Fresh', 'Lakatan', 'kg', 1),
('Orange', 'Fresh', 'Valencia', 'kg', 1),
('Mango', 'Fresh', 'Carabao', 'kg', 1),
('Grapes', 'Fresh', 'Red Globe', 'kg', 1),
('Pineapple', 'Fresh', 'Sweet Del Monte', 'pc', 1),
('Watermelon', 'Fresh', 'Regular', 'kg', 1),
('Papaya', 'Fresh', 'Ripe', 'kg', 1),

-- Insert Vegetables
('Onion', 'Fresh', 'Red Onion', 'kg', 1),
('Onion', 'Fresh', 'White Onion', 'kg', 1),
('Garlic', 'Fresh', 'Native', 'kg', 1),
('Tomato', 'Fresh', 'Regular', 'kg', 1),
('Potato', 'Fresh', 'Regular', 'kg', 1),
('Carrot', 'Fresh', 'Regular', 'kg', 1),
('Cabbage', 'Fresh', 'Regular', 'kg', 1),
('Lettuce', 'Fresh', 'Iceberg', 'head', 1),
('Bell Pepper', 'Fresh', 'Green', 'kg', 1),
('Eggplant', 'Fresh', 'Regular', 'kg', 1),

-- Insert Canned Goods
('Corned Beef', 'Argentina', 'Original', 'can 175g', 1),
('Corned Beef', 'Libby''s', 'Regular', 'can 175g', 1),
('Sardines', 'Ligo', 'in Tomato Sauce', 'can 155g', 1),
('Sardines', 'Century', 'in Natural Oil', 'can 155g', 1),
('Tuna', 'Century', 'Flakes in Oil', 'can 180g', 1),
('Spam', 'Hormel', 'Classic', 'can 340g', 1),
('Tomato Sauce', 'Del Monte', 'Sweet Style', 'pack 250g', 1),
('Tomato Paste', 'Hunt''s', 'Regular', 'can 70g', 1),

-- Insert Condiments and Seasonings
('Soy Sauce', 'Silver Swan', 'Special', 'bottle 385ml', 1),
('Vinegar', 'Datu Puti', 'Spiced', 'bottle 385ml', 1),
('Fish Sauce', 'Rufina', 'Patis', 'bottle 350ml', 1),
('Oyster Sauce', 'Lee Kum Kee', 'Premium', 'bottle 510g', 1),
('Ketchup', 'Del Monte', 'Sweet Style', 'bottle 320g', 1),
('Mayonnaise', 'Lady''s Choice', 'Real', 'bottle 220ml', 1),
('Salt', 'Tide', 'Iodized', 'pack 500g', 1),
('Sugar', 'Brown Sugar', 'Muscovado', 'kg', 1),
('Sugar', 'White Sugar', 'Refined', 'kg', 1),

-- Insert Cooking Oil and Fat
('Cooking Oil', 'Knife', 'Vegetable Oil', 'bottle 1L', 1),
('Cooking Oil', 'Minola', 'Gold', 'bottle 1L', 1),
('Olive Oil', 'Bertolli', 'Extra Virgin', 'bottle 500ml', 1),
('Coconut Oil', 'Barrio Fiesta', 'Pure', 'bottle 500ml', 1),

-- Insert Beverages
('Soft Drink', 'Coca Cola', 'Regular', 'bottle 1.5L', 1),
('Soft Drink', 'Pepsi', 'Regular', 'bottle 1.5L', 1),
('Juice', 'Del Monte', 'Pineapple', 'can 240ml', 1),
('Juice', 'Zesto', 'Orange', 'bottle 200ml', 1),
('Water', 'Nature''s Spring', 'Purified', 'bottle 500ml', 1),
('Coffee', 'Nescafe', '3 in 1 Original', 'pack 10sachets', 1),
('Tea', 'Lipton', 'Yellow Label', 'pack 25bags', 1),

-- Insert Snacks and Sweets
('Biscuit', 'Skyflakes', 'Crackers', 'pack 800g', 1),
('Biscuit', 'Fibisco', 'Choco Mallows', 'pack 300g', 1),
('Chocolate', 'Ricoa', 'Flat Tops', 'pack 24pcs', 1),
('Candy', 'Ricola', 'Original', 'pack 50g', 1),
('Chips', 'Nova', 'Multigrain Snack', 'pack 78g', 1),
('Chips', 'Piattos', 'Cheese', 'pack 85g', 1),

-- Insert Personal Care
('Shampoo', 'Pantene', 'Hair Fall Control', 'bottle 340ml', 1),
('Soap', 'Safeguard', 'White', 'bar 135g', 1),
('Toothpaste', 'Colgate', 'Total', 'tube 150g', 1),
('Toothbrush', 'Oral-B', 'Soft', 'pc', 1),

-- Insert Household Items
('Detergent', 'Tide', 'Powder', 'pack 500g', 1),
('Dishwashing Liquid', 'Joy', 'Lemon', 'bottle 485ml', 1),
('Tissue Paper', 'Scott', 'Facial Tissue', 'box 150sheets', 1),
('Toilet Paper', 'Charm', 'Soft Touch', 'roll 2ply', 1),

-- Insert Frozen Items
('Ice Cream', 'Selecta', 'Cookies & Cream', 'tub 1.5L', 1),
('Frozen Vegetables', 'Tropicana', 'Mixed Vegetables', 'pack 400g', 1),
('Fish Fillet', 'San Marino', 'Cream Dory', 'pack 500g', 1),

-- Insert Baby Products
('Baby Food', 'Gerber', 'Stage 1 Banana', 'jar 113g', 1),
('Diaper', 'Pampers', 'Baby Dry Medium', 'pack 64pcs', 1),
('Baby Formula', 'Similac', 'Gain Plus', 'can 900g', 1),

-- Insert Pet Food
('Dog Food', 'Pedigree', 'Adult Complete', 'pack 1.5kg', 1),
('Cat Food', 'Whiskas', 'Tuna', 'can 400g', 1);

-- Insert SRP (Suggested Retail Price) entries for each product
-- This assumes you have an SRP table that references PRODUCT_TYPE
INSERT INTO public."SRP" ("productTypeId", "Price")
SELECT "productTypeId", 
  CASE 
    -- Dairy Products (₱20-120)
    WHEN "Name" = 'Milk' AND "Unit" = 'liter' THEN 85.00
    WHEN "Name" = 'Milk' AND "Unit" = 'can 300ml' THEN 25.00
    WHEN "Name" = 'Milk' AND "Unit" = 'pack 250ml' THEN 45.00
    WHEN "Name" = 'Cheese' THEN 65.00
    WHEN "Name" = 'Butter' THEN 55.00
    WHEN "Name" = 'Yogurt' THEN 35.00
    WHEN "Name" = 'Condensed Milk' THEN 45.00
    WHEN "Name" = 'Evaporated Milk' THEN 35.00
    
    -- Meat Products (₱150-650/kg)
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
    
    -- Rice and Grains (₱25-85/kg)
    WHEN "Name" = 'Rice' AND "Variant" = 'Premium' THEN 65.00
    WHEN "Name" = 'Rice' AND "Variant" = 'Fragrant Rice' THEN 55.00
    WHEN "Name" = 'Rice' AND "Variant" = 'Well Milled' THEN 45.00
    WHEN "Name" = 'Oats' THEN 85.00
    WHEN "Name" = 'Bread' THEN 55.00
    WHEN "Name" = 'Pandesal' THEN 25.00
    
    -- Fruits (₱40-180/kg)
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
    
    -- Condiments (₱12-75)
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
    
    ELSE 50.00  -- Default price
  END
FROM public."PRODUCT_TYPE";