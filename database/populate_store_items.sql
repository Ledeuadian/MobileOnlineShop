-- Populate ITEMS_IN_STORE table with realistic grocery store inventory
-- This assumes you have some stores already created in the GROCERY_STORE table

-- First, let's create some sample grocery stores if they don't exist
-- Note: You'll need actual owner_ids from your auth.users table
INSERT INTO public.GROCERY_STORE (storeName, storeDescription, store_address, store_phone, store_email, store_image_url, owner_id) 
VALUES 
('SM Supermarket Suarez', 'Complete supermarket with fresh produce and household items', 'Suarez Street, Iloilo City', '033-123-4567', 'suarez@sm.com.ph', 'https://example.com/sm-suarez.jpg', '00000000-0000-0000-0000-000000000001'),
('Gaisano Grand Mall Grocery', 'One-stop grocery store for all your needs', 'Diversion Road, Iloilo City', '033-234-5678', 'grocery@gaisano.com.ph', 'https://example.com/gaisano-grand.jpg', '00000000-0000-0000-0000-000000000002'),
('Robinsons Supermarket', 'Premium grocery shopping experience', 'Robinsons Place Iloilo', '033-345-6789', 'supermarket@robinsons.com.ph', 'https://example.com/robinsons.jpg', '00000000-0000-0000-0000-000000000003'),
('Metro Supermarket Jaro', 'Local supermarket serving the Jaro district', 'Jaro District, Iloilo City', '033-456-7890', 'jaro@metro.com.ph', 'https://example.com/metro-jaro.jpg', '00000000-0000-0000-0000-000000000004'),
('Pure Gold Supermarket', 'Affordable prices for everyday essentials', 'Gen. Luna Street, Iloilo City', '033-567-8901', 'iloilo@puregold.com.ph', 'https://example.com/puregold.jpg', '00000000-0000-0000-0000-000000000005')
ON CONFLICT (storeId) DO NOTHING;

-- Now populate ITEMS_IN_STORE with realistic inventory
-- Store 1: SM Supermarket Suarez (Premium selection)
INSERT INTO public.ITEMS_IN_STORE (
    storeId, 
    name, 
    description, 
    category, 
    price, 
    availability, 
    item_image_url,
    item_name,
    item_description,
    item_price,
    item_quantity,
    item_category
) VALUES 

-- Dairy Products for Store 1
(1, 'Alaska Fresh Milk 1L', 'Fresh dairy milk, pasteurized and nutritious', 'Dairy', 89.00, 50, 'https://example.com/alaska-milk.jpg', 'Alaska Fresh Milk 1L', 'Fresh dairy milk, pasteurized and nutritious', 89.00, 50, 'Dairy'),
(1, 'Bear Brand Sterilized Milk 300ml', 'Sterilized milk in convenient can packaging', 'Dairy', 27.00, 100, 'https://example.com/bear-brand.jpg', 'Bear Brand Sterilized Milk 300ml', 'Sterilized milk in convenient can packaging', 27.00, 100, 'Dairy'),
(1, 'Eden Processed Cheese 200g', 'Smooth and creamy processed cheese', 'Dairy', 68.00, 75, 'https://example.com/eden-cheese.jpg', 'Eden Processed Cheese 200g', 'Smooth and creamy processed cheese', 68.00, 75, 'Dairy'),
(1, 'Nestle All Purpose Cream 250ml', 'Rich cream perfect for cooking and baking', 'Dairy', 47.00, 60, 'https://example.com/nestle-cream.jpg', 'Nestle All Purpose Cream 250ml', 'Rich cream perfect for cooking and baking', 47.00, 60, 'Dairy'),

-- Meat Products for Store 1
(1, 'Fresh Whole Chicken', 'Farm-fresh whole chicken, cleaned and ready to cook', 'Meat', 185.00, 30, 'https://example.com/whole-chicken.jpg', 'Fresh Whole Chicken', 'Farm-fresh whole chicken, cleaned and ready to cook', 185.00, 30, 'Meat'),
(1, 'Fresh Chicken Breast Fillet', 'Boneless chicken breast, perfect for healthy meals', 'Meat', 225.00, 25, 'https://example.com/chicken-breast.jpg', 'Fresh Chicken Breast Fillet', 'Boneless chicken breast, perfect for healthy meals', 225.00, 25, 'Meat'),
(1, 'Fresh Pork Belly', 'Premium pork belly, ideal for adobo and lechon kawali', 'Meat', 325.00, 20, 'https://example.com/pork-belly.jpg', 'Fresh Pork Belly', 'Premium pork belly, ideal for adobo and lechon kawali', 325.00, 20, 'Meat'),
(1, 'Fresh Bangus (Milkfish)', 'Fresh bangus from local fish farms', 'Meat', 165.00, 15, 'https://example.com/bangus.jpg', 'Fresh Bangus (Milkfish)', 'Fresh bangus from local fish farms', 165.00, 15, 'Meat'),

-- Rice and Grains for Store 1
(1, 'Dinorado Premium Rice', 'Premium quality rice with excellent aroma', 'Rice & Grains', 68.00, 200, 'https://example.com/dinorado-rice.jpg', 'Dinorado Premium Rice', 'Premium quality rice with excellent aroma', 68.00, 200, 'Rice & Grains'),
(1, 'Gardenia Classic White Bread', 'Soft and fluffy white bread loaf', 'Rice & Grains', 57.00, 40, 'https://example.com/gardenia-bread.jpg', 'Gardenia Classic White Bread', 'Soft and fluffy white bread loaf', 57.00, 40, 'Rice & Grains'),
(1, 'Quaker Quick Cooking Oats 400g', 'Nutritious oats for a healthy breakfast', 'Rice & Grains', 88.00, 35, 'https://example.com/quaker-oats.jpg', 'Quaker Quick Cooking Oats 400g', 'Nutritious oats for a healthy breakfast', 88.00, 35, 'Rice & Grains'),

-- Fruits for Store 1
(1, 'Red Delicious Apples', 'Fresh imported red delicious apples', 'Fruits', 185.00, 40, 'https://example.com/red-apples.jpg', 'Red Delicious Apples', 'Fresh imported red delicious apples', 185.00, 40, 'Fruits'),
(1, 'Carabao Mangoes', 'Sweet and juicy Philippine carabao mangoes', 'Fruits', 155.00, 50, 'https://example.com/carabao-mango.jpg', 'Carabao Mangoes', 'Sweet and juicy Philippine carabao mangoes', 155.00, 50, 'Fruits'),
(1, 'Lakatan Bananas', 'Premium lakatan bananas, perfectly ripe', 'Fruits', 62.00, 80, 'https://example.com/lakatan-banana.jpg', 'Lakatan Bananas', 'Premium lakatan bananas, perfectly ripe', 62.00, 80, 'Fruits'),

-- Vegetables for Store 1
(1, 'Fresh Red Onions', 'High-quality red onions, essential for cooking', 'Vegetables', 82.00, 100, 'https://example.com/red-onions.jpg', 'Fresh Red Onions', 'High-quality red onions, essential for cooking', 82.00, 100, 'Vegetables'),
(1, 'Native Garlic', 'Aromatic native garlic, perfect for Filipino dishes', 'Vegetables', 145.00, 60, 'https://example.com/native-garlic.jpg', 'Native Garlic', 'Aromatic native garlic, perfect for Filipino dishes', 145.00, 60, 'Vegetables'),
(1, 'Fresh Tomatoes', 'Ripe and juicy tomatoes for salads and cooking', 'Vegetables', 62.00, 90, 'https://example.com/fresh-tomatoes.jpg', 'Fresh Tomatoes', 'Ripe and juicy tomatoes for salads and cooking', 62.00, 90, 'Vegetables'),
(1, 'Fresh Potatoes', 'High-quality potatoes, perfect for various dishes', 'Vegetables', 52.00, 120, 'https://example.com/fresh-potatoes.jpg', 'Fresh Potatoes', 'High-quality potatoes, perfect for various dishes', 52.00, 120, 'Vegetables'),

-- Canned Goods for Store 1
(1, 'Argentina Corned Beef 175g', 'Premium corned beef in convenient can', 'Canned Goods', 57.00, 150, 'https://example.com/argentina-corned-beef.jpg', 'Argentina Corned Beef 175g', 'Premium corned beef in convenient can', 57.00, 150, 'Canned Goods'),
(1, 'Ligo Sardines in Tomato Sauce 155g', 'Delicious sardines in rich tomato sauce', 'Canned Goods', 27.00, 200, 'https://example.com/ligo-sardines.jpg', 'Ligo Sardines in Tomato Sauce 155g', 'Delicious sardines in rich tomato sauce', 27.00, 200, 'Canned Goods'),
(1, 'Century Tuna Flakes in Oil 180g', 'High-quality tuna flakes in oil', 'Canned Goods', 37.00, 180, 'https://example.com/century-tuna.jpg', 'Century Tuna Flakes in Oil 180g', 'High-quality tuna flakes in oil', 37.00, 180, 'Canned Goods'),

-- Store 2: Gaisano Grand Mall Grocery (Mid-range selection)
(2, 'Jasmine Fragrant Rice', 'Aromatic jasmine rice with excellent quality', 'Rice & Grains', 57.00, 180, 'https://example.com/jasmine-rice.jpg', 'Jasmine Fragrant Rice', 'Aromatic jasmine rice with excellent quality', 57.00, 180, 'Rice & Grains'),
(2, 'Kraft Cheddar Cheese 165g', 'Rich and creamy cheddar cheese', 'Dairy', 67.00, 45, 'https://example.com/kraft-cheese.jpg', 'Kraft Cheddar Cheese 165g', 'Rich and creamy cheddar cheese', 67.00, 45, 'Dairy'),
(2, 'CDO Tender Juicy Hotdogs 500g', 'Premium hotdogs perfect for breakfast', 'Meat', 97.00, 60, 'https://example.com/cdo-hotdog.jpg', 'CDO Tender Juicy Hotdogs 500g', 'Premium hotdogs perfect for breakfast', 97.00, 60, 'Meat'),
(2, 'Saba Bananas', 'Fresh saba bananas, great for cooking', 'Fruits', 42.00, 100, 'https://example.com/saba-banana.jpg', 'Saba Bananas', 'Fresh saba bananas, great for cooking', 42.00, 100, 'Fruits'),
(2, 'Valencia Oranges', 'Sweet and juicy valencia oranges', 'Fruits', 125.00, 60, 'https://example.com/valencia-oranges.jpg', 'Valencia Oranges', 'Sweet and juicy valencia oranges', 125.00, 60, 'Fruits'),
(2, 'Fresh Cabbage', 'Crisp and fresh cabbage heads', 'Vegetables', 47.00, 40, 'https://example.com/fresh-cabbage.jpg', 'Fresh Cabbage', 'Crisp and fresh cabbage heads', 47.00, 40, 'Vegetables'),
(2, 'Green Bell Peppers', 'Fresh green bell peppers for cooking', 'Vegetables', 125.00, 30, 'https://example.com/green-bell-pepper.jpg', 'Green Bell Peppers', 'Fresh green bell peppers for cooking', 125.00, 30, 'Vegetables'),

-- Store 3: Robinsons Supermarket (Premium selection)
(3, 'Sinandomeng Well Milled Rice', 'Well-milled sinandomeng rice', 'Rice & Grains', 47.00, 250, 'https://example.com/sinandomeng-rice.jpg', 'Sinandomeng Well Milled Rice', 'Well-milled sinandomeng rice', 47.00, 250, 'Rice & Grains'),
(3, 'Star Margarine 200g', 'Premium margarine for cooking and baking', 'Dairy', 57.00, 80, 'https://example.com/star-margarine.jpg', 'Star Margarine 200g', 'Premium margarine for cooking and baking', 57.00, 80, 'Dairy'),
(3, 'Purefoods Sliced Bacon 200g', 'Premium sliced bacon for breakfast', 'Meat', 125.00, 35, 'https://example.com/purefoods-bacon.jpg', 'Purefoods Sliced Bacon 200g', 'Premium sliced bacon for breakfast', 125.00, 35, 'Meat'),
(3, 'Red Globe Grapes', 'Sweet and juicy red globe grapes', 'Fruits', 205.00, 25, 'https://example.com/red-grapes.jpg', 'Red Globe Grapes', 'Sweet and juicy red globe grapes', 205.00, 25, 'Fruits'),
(3, 'Sweet Del Monte Pineapple', 'Fresh sweet pineapple from Del Monte', 'Fruits', 85.00, 20, 'https://example.com/del-monte-pineapple.jpg', 'Sweet Del Monte Pineapple', 'Fresh sweet pineapple from Del Monte', 85.00, 20, 'Fruits'),
(3, 'Fresh Carrots', 'Crisp and sweet fresh carrots', 'Vegetables', 67.00, 70, 'https://example.com/fresh-carrots.jpg', 'Fresh Carrots', 'Crisp and sweet fresh carrots', 67.00, 70, 'Vegetables'),
(3, 'Iceberg Lettuce', 'Fresh iceberg lettuce heads', 'Vegetables', 37.00, 25, 'https://example.com/iceberg-lettuce.jpg', 'Iceberg Lettuce', 'Fresh iceberg lettuce heads', 37.00, 25, 'Vegetables'),

-- Condiments and Seasonings across all stores
(1, 'Silver Swan Soy Sauce Special 385ml', 'Premium soy sauce for authentic Filipino taste', 'Condiments', 27.00, 120, 'https://example.com/silver-swan-soy-sauce.jpg', 'Silver Swan Soy Sauce Special 385ml', 'Premium soy sauce for authentic Filipino taste', 27.00, 120, 'Condiments'),
(1, 'Datu Puti Spiced Vinegar 385ml', 'Spiced vinegar perfect for Filipino dishes', 'Condiments', 22.00, 100, 'https://example.com/datu-puti-vinegar.jpg', 'Datu Puti Spiced Vinegar 385ml', 'Spiced vinegar perfect for Filipino dishes', 22.00, 100, 'Condiments'),
(2, 'Del Monte Sweet Style Ketchup 320g', 'Sweet style banana ketchup', 'Condiments', 37.00, 90, 'https://example.com/del-monte-ketchup.jpg', 'Del Monte Sweet Style Ketchup 320g', 'Sweet style banana ketchup', 37.00, 90, 'Condiments'),
(2, 'Rufina Patis Fish Sauce 350ml', 'Traditional fish sauce for authentic flavor', 'Condiments', 32.00, 85, 'https://example.com/rufina-patis.jpg', 'Rufina Patis Fish Sauce 350ml', 'Traditional fish sauce for authentic flavor', 32.00, 85, 'Condiments'),
(3, 'Lee Kum Kee Oyster Sauce 510g', 'Premium oyster sauce for stir-fry dishes', 'Condiments', 47.00, 60, 'https://example.com/lee-kum-kee-oyster-sauce.jpg', 'Lee Kum Kee Oyster Sauce 510g', 'Premium oyster sauce for stir-fry dishes', 47.00, 60, 'Condiments'),

-- Cooking Oil across stores
(1, 'Knife Vegetable Oil 1L', 'Pure vegetable oil for cooking', 'Cooking Oil', 87.00, 80, 'https://example.com/knife-oil.jpg', 'Knife Vegetable Oil 1L', 'Pure vegetable oil for cooking', 87.00, 80, 'Cooking Oil'),
(2, 'Minola Gold Cooking Oil 1L', 'Premium cooking oil with vitamin A', 'Cooking Oil', 97.00, 75, 'https://example.com/minola-oil.jpg', 'Minola Gold Cooking Oil 1L', 'Premium cooking oil with vitamin A', 97.00, 75, 'Cooking Oil'),
(3, 'Bertolli Extra Virgin Olive Oil 500ml', 'Premium extra virgin olive oil', 'Cooking Oil', 255.00, 25, 'https://example.com/bertolli-olive-oil.jpg', 'Bertolli Extra Virgin Olive Oil 500ml', 'Premium extra virgin olive oil', 255.00, 25, 'Cooking Oil'),

-- Beverages across stores
(1, 'Coca Cola 1.5L', 'Classic Coca Cola soft drink', 'Beverages', 77.00, 150, 'https://example.com/coca-cola.jpg', 'Coca Cola 1.5L', 'Classic Coca Cola soft drink', 77.00, 150, 'Beverages'),
(2, 'Pepsi 1.5L', 'Pepsi cola soft drink', 'Beverages', 72.00, 140, 'https://example.com/pepsi.jpg', 'Pepsi 1.5L', 'Pepsi cola soft drink', 72.00, 140, 'Beverages'),
(3, 'Natures Spring Purified Water 500ml', 'Pure and safe drinking water', 'Beverages', 22.00, 200, 'https://example.com/natures-spring.jpg', 'Natures Spring Purified Water 500ml', 'Pure and safe drinking water', 22.00, 200, 'Beverages'),
(1, 'Nescafe 3 in 1 Original 10 sachets', 'Instant coffee with creamer and sugar', 'Beverages', 87.00, 60, 'https://example.com/nescafe-3in1.jpg', 'Nescafe 3 in 1 Original 10 sachets', 'Instant coffee with creamer and sugar', 87.00, 60, 'Beverages'),

-- Snacks across stores
(1, 'Skyflakes Crackers 800g', 'Crispy and delicious crackers', 'Snacks', 57.00, 40, 'https://example.com/skyflakes.jpg', 'Skyflakes Crackers 800g', 'Crispy and delicious crackers', 57.00, 40, 'Snacks'),
(2, 'Piattos Cheese Flavored Chips 85g', 'Cheese flavored potato chips', 'Snacks', 37.00, 80, 'https://example.com/piattos-cheese.jpg', 'Piattos Cheese Flavored Chips 85g', 'Cheese flavored potato chips', 37.00, 80, 'Snacks'),
(3, 'Nova Multigrain Snack 78g', 'Healthy multigrain snack', 'Snacks', 27.00, 100, 'https://example.com/nova-multigrain.jpg', 'Nova Multigrain Snack 78g', 'Healthy multigrain snack', 27.00, 100, 'Snacks'),

-- Personal Care Items
(1, 'Pantene Hair Fall Control Shampoo 340ml', 'Anti-hair fall shampoo', 'Personal Care', 189.00, 30, 'https://example.com/pantene-shampoo.jpg', 'Pantene Hair Fall Control Shampoo 340ml', 'Anti-hair fall shampoo', 189.00, 30, 'Personal Care'),
(2, 'Safeguard White Soap 135g', 'Antibacterial soap bar', 'Personal Care', 37.00, 120, 'https://example.com/safeguard-soap.jpg', 'Safeguard White Soap 135g', 'Antibacterial soap bar', 37.00, 120, 'Personal Care'),
(3, 'Colgate Total Toothpaste 150g', 'Complete oral care toothpaste', 'Personal Care', 87.00, 50, 'https://example.com/colgate-total.jpg', 'Colgate Total Toothpaste 150g', 'Complete oral care toothpaste', 87.00, 50, 'Personal Care'),

-- Household Items
(1, 'Tide Powder Detergent 500g', 'Powerful cleaning detergent', 'Household', 87.00, 70, 'https://example.com/tide-powder.jpg', 'Tide Powder Detergent 500g', 'Powerful cleaning detergent', 87.00, 70, 'Household'),
(2, 'Joy Lemon Dishwashing Liquid 485ml', 'Lemon scented dishwashing liquid', 'Household', 67.00, 80, 'https://example.com/joy-dishwashing.jpg', 'Joy Lemon Dishwashing Liquid 485ml', 'Lemon scented dishwashing liquid', 67.00, 80, 'Household'),
(3, 'Scott Facial Tissue 150 sheets', 'Soft facial tissue box', 'Household', 57.00, 40, 'https://example.com/scott-tissue.jpg', 'Scott Facial Tissue 150 sheets', 'Soft facial tissue box', 57.00, 40, 'Household');

-- Update availability and prices to simulate realistic store inventory
UPDATE public.ITEMS_IN_STORE 
SET item_quantity = availability, 
    item_price = price
WHERE storeId IN (1, 2, 3, 4, 5);