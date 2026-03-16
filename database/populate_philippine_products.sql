-- Populate Philippine Market Products with Multiple Size Options
-- This script adds products commonly found in Philippine grocery stores
-- Different sizes/measurements are stored as separate items with different productTypeIds

-- Insert products into PRODUCT_TYPE table
-- Format: Name, Brand, Variant, Unit (different sizes = different entries)

-- ============================================
-- CONDIMENTS
-- ============================================

-- Soy Sauce (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Soy Sauce', 'Datu Puti', 'Original', 'bottle 385ml', 1),
('Soy Sauce', 'Datu Puti', 'Original', 'bottle 1L', 1),
('Soy Sauce', 'Silver Swan', 'Special', 'bottle 385ml', 1),
('Soy Sauce', 'Silver Swan', 'Special', 'bottle 1L', 1);

-- Vinegar (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Vinegar', 'Datu Puti', 'White', 'bottle 385ml', 1),
('Vinegar', 'Datu Puti', 'White', 'bottle 1L', 1),
('Vinegar', 'Silver Swan', 'Sukang Maasim', 'bottle 385ml', 1),
('Vinegar', 'Cane Vinegar', 'Natural', 'bottle 750ml', 1);

-- Fish Sauce (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Fish Sauce', 'Rufina', 'Patis', 'bottle 350ml', 1),
('Fish Sauce', 'Rufina', 'Patis', 'bottle 750ml', 1),
('Fish Sauce', 'Lorins', 'Premium', 'bottle 350ml', 1);

-- Cooking Oil (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Cooking Oil', 'Baguio Oil', 'Vegetable', 'bottle 1L', 1),
('Cooking Oil', 'Baguio Oil', 'Vegetable', 'bottle 2L', 1),
('Cooking Oil', 'Minola', 'Premium', 'bottle 1L', 1),
('Cooking Oil', 'Minola', 'Premium', 'bottle 2L', 1);

-- Ketchup (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Ketchup', 'Del Monte', 'Sweet Style', 'bottle 320g', 1),
('Ketchup', 'Del Monte', 'Sweet Style', 'bottle 550g', 1),
('Ketchup', 'UFC', 'Banana Ketchup', 'bottle 320g', 1),
('Ketchup', 'UFC', 'Banana Ketchup', 'bottle 1kg', 1);

-- Salt (Multiple sizes) - Like in the image
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 150g', 1),
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 300g', 1),
('Salt', 'Mc Cormick', 'Iodized Salt', 'pack 1kg', 1);

-- Oyster Sauce
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Oyster Sauce', 'Lee Kum Kee', 'Premium', 'bottle 255g', 1),
('Oyster Sauce', 'Lee Kum Kee', 'Premium', 'bottle 510g', 1);

-- ============================================
-- PRODUCE (Fruits & Vegetables)
-- ============================================

-- Fruits
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Apple', 'Fresh', 'Red Delicious', 'kg', 1),
('Apple', 'Fresh', 'Granny Smith', 'kg', 1),
('Banana', 'Fresh', 'Saba', 'kg', 1),
('Banana', 'Fresh', 'Lacatan', 'kg', 1),
('Orange', 'Fresh', 'Valencia', 'kg', 1),
('Mango', 'Fresh', 'Carabao', 'kg', 1),
('Grapes', 'Fresh', 'Red Globe', 'kg', 1),
('Grapes', 'Fresh', 'Green', 'kg', 1),
('Pineapple', 'Fresh', 'Sweet Del Monte', 'pc', 1),
('Watermelon', 'Fresh', 'Regular', 'kg', 1),
('Papaya', 'Fresh', 'Ripe', 'kg', 1);

-- Vegetables
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Onion', 'Fresh', 'Red Onion', 'kg', 1),
('Onion', 'Fresh', 'White Onion', 'kg', 1),
('Garlic', 'Fresh', 'Native', 'kg', 1),
('Tomato', 'Fresh', 'Regular', 'kg', 1),
('Potato', 'Fresh', 'Regular', 'kg', 1),
('Carrot', 'Fresh', 'Regular', 'kg', 1),
('Cabbage', 'Fresh', 'Regular', 'kg', 1),
('Lettuce', 'Fresh', 'Iceberg', 'head', 1),
('Bell Pepper', 'Fresh', 'Green', 'kg', 1),
('Eggplant', 'Fresh', 'Regular', 'kg', 1);

-- ============================================
-- CEREAL & BREAKFAST
-- ============================================

-- Rice (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Rice', 'Dinorado', 'Premium', 'kg', 1),
('Rice', 'Dinorado', 'Premium', 'pack 5kg', 1),
('Rice', 'Dinorado', 'Premium', 'pack 10kg', 1),
('Rice', 'Jasmine', 'Fragrant Rice', 'kg', 1),
('Rice', 'Jasmine', 'Fragrant Rice', 'pack 5kg', 1),
('Rice', 'Sinandomeng', 'Well Milled', 'kg', 1),
('Rice', 'Sinandomeng', 'Well Milled', 'pack 5kg', 1);

-- Oats (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Oats', 'Quaker', 'Quick Cooking', 'pack 200g', 1),
('Oats', 'Quaker', 'Quick Cooking', 'pack 400g', 1),
('Oats', 'Quaker', 'Quick Cooking', 'pack 800g', 1);

-- Cereal
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Corn Flakes', 'Kelloggs', 'Original', 'box 275g', 1),
('Corn Flakes', 'Kelloggs', 'Original', 'box 500g', 1),
('Koko Krunch', 'Nestle', 'Chocolate', 'box 170g', 1),
('Koko Krunch', 'Nestle', 'Chocolate', 'box 330g', 1);

-- Bread
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Bread', 'Gardenia', 'Classic White', 'loaf', 1),
('Bread', 'Gardenia', 'Wheat Bread', 'loaf', 1),
('Pandesal', 'Local Bakery', 'Fresh Baked', 'pack 10pcs', 1);

-- ============================================
-- BEVERAGES
-- ============================================

-- Soft Drinks (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Soft Drink', 'Coca Cola', 'Regular', 'bottle 350ml', 1),
('Soft Drink', 'Coca Cola', 'Regular', 'bottle 1L', 1),
('Soft Drink', 'Coca Cola', 'Regular', 'bottle 1.5L', 1),
('Soft Drink', 'Pepsi', 'Regular', 'bottle 350ml', 1),
('Soft Drink', 'Pepsi', 'Regular', 'bottle 1.5L', 1),
('Soft Drink', 'Sprite', 'Lemon-Lime', 'bottle 350ml', 1),
('Soft Drink', 'Sprite', 'Lemon-Lime', 'bottle 1.5L', 1);

-- Canned Drinks (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Soft Drink', 'Coca Cola', 'Regular', 'can 330ml', 1),
('Soft Drink', 'Pepsi', 'Regular', 'can 330ml', 1);

-- Water (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Water', 'Nature''s Spring', 'Purified', 'bottle 350ml', 1),
('Water', 'Nature''s Spring', 'Purified', 'bottle 500ml', 1),
('Water', 'Nature''s Spring', 'Purified', 'bottle 1L', 1),
('Water', 'Summit', 'Distilled', 'bottle 500ml', 1),
('Water', 'Summit', 'Distilled', 'gallon 5L', 1);

-- Coffee (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Coffee', 'Nescafe', '3 in 1 Original', 'pack 10sachets', 1),
('Coffee', 'Nescafe', '3 in 1 Original', 'pack 30sachets', 1),
('Coffee', 'Great Taste', '3 in 1 White', 'pack 10sachets', 1),
('Coffee', 'Great Taste', '3 in 1 White', 'pack 30sachets', 1);

-- Juice (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Juice', 'Del Monte', 'Pineapple', 'can 240ml', 1),
('Juice', 'Del Monte', 'Pineapple', 'bottle 1L', 1),
('Juice', 'Del Monte', 'Four Seasons', 'can 240ml', 1),
('Juice', 'C2', 'Green Tea', 'bottle 230ml', 1),
('Juice', 'C2', 'Green Tea', 'bottle 1L', 1);

-- ============================================
-- CANNED GOODS
-- ============================================

-- Corned Beef (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Corned Beef', 'Argentina', 'Original', 'can 150g', 1),
('Corned Beef', 'Argentina', 'Original', 'can 175g', 1),
('Corned Beef', 'Argentina', 'Original', 'can 210g', 1),
('Corned Beef', 'Libby''s', 'Regular', 'can 175g', 1),
('Corned Beef', 'Purefoods', 'Chunky', 'can 150g', 1);

-- Sardines (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Sardines', 'Ligo', 'in Tomato Sauce', 'can 155g', 1),
('Sardines', 'Ligo', 'in Tomato Sauce', 'can 425g', 1),
('Sardines', 'Century', 'in Natural Oil', 'can 155g', 1),
('Sardines', 'Mega', 'in Tomato Sauce', 'can 155g', 1);

-- Tuna (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Tuna', 'Century', 'Flakes in Oil', 'can 180g', 1),
('Tuna', 'Century', 'Flakes in Oil', 'can 420g', 1),
('Tuna', '555', 'Fried Sardines', 'can 155g', 1);

-- Meat Loaf
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Meat Loaf', 'Purefoods', 'Chicken', 'can 150g', 1),
('Meat Loaf', 'Purefoods', 'Pork', 'can 150g', 1);

-- Spam
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Spam', 'Hormel', 'Classic', 'can 340g', 1),
('Spam', 'Ma Ling', 'Luncheon Meat', 'can 340g', 1);

-- ============================================
-- SNACKS
-- ============================================

-- Biscuits (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Biscuit', 'Skyflakes', 'Crackers', 'pack 250g', 1),
('Biscuit', 'Skyflakes', 'Crackers', 'pack 800g', 1),
('Biscuit', 'Fita', 'Crackers', 'pack 300g', 1);

-- Chips (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Chips', 'Piattos', 'Cheese', 'pack 40g', 1),
('Chips', 'Piattos', 'Cheese', 'pack 85g', 1),
('Chips', 'Nova', 'BBQ', 'pack 40g', 1),
('Chips', 'Nova', 'BBQ', 'pack 100g', 1),
('Chips', 'Oishi', 'Prawn Crackers', 'pack 60g', 1),
('Chips', 'Oishi', 'Prawn Crackers', 'pack 90g', 1);

-- Chocolate (Multiple sizes)
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Chocolate', 'Flat Tops', 'Milk Chocolate', 'pack 24pcs', 1),
('Chocolate', 'Goya', 'Milk Chocolate', 'bar 50g', 1),
('Chocolate', 'Cloud 9', 'Chocolate Bar', 'bar 45g', 1);

-- Candy
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Candy', 'Mentos', 'Mixed Fruit', 'roll 37g', 1),
('Candy', 'Kopiko', 'Coffee', 'pack 175g', 1);

-- Cookies
INSERT INTO public."PRODUCT_TYPE" ("Name", "Brand", "Variant", "Unit", "Quantity") VALUES
('Cookies', 'Cream-O', 'Vanilla', 'pack 132g', 1),
('Cookies', 'Cream-O', 'Chocolate', 'pack 132g', 1);

-- Display count of inserted products
SELECT 
    'Total Products Inserted' as info,
    COUNT(*) as count
FROM public."PRODUCT_TYPE";

-- Show products grouped by name with different sizes
SELECT 
    "Name",
    "Brand",
    STRING_AGG(DISTINCT "Unit", ', ' ORDER BY "Unit") as available_sizes,
    COUNT(*) as size_options
FROM public."PRODUCT_TYPE"
GROUP BY "Name", "Brand"
HAVING COUNT(*) > 1
ORDER BY "Name", "Brand"
LIMIT 20;
