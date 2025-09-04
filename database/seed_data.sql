-- Seed data for GROCERY_STORE and ITEMS_IN_STORE tables
-- This script creates 3 store accounts and populates them with grocery products

-- First, let's create some auth users for the stores (you'll need to adjust the UUIDs to match actual auth.users)
-- Note: These UUIDs are placeholders - replace with actual auth.users IDs from your Supabase Auth

-- Insert 3 grocery stores
INSERT INTO public.GROCERY_STORE (
    storeName, 
    storeDescription, 
    store_address, 
    store_phone, 
    store_email, 
    owner_id,
    created_at,
    updated_at
) VALUES 
(
    'Fresh Valley Market',
    'Your neighborhood grocery store specializing in fresh produce and organic foods. We pride ourselves on quality and customer service.',
    '123 Main Street, Downtown District, Metro City, MC 12345',
    '+1 (555) 123-4567',
    'store1@test.com',
    'c4ff0e66-0581-4784-b222-5e234abdcf5c', -- Replace with actual auth user ID
    NOW(),
    NOW()
),
(
    'Ocean View Grocers',
    'Premium grocery store offering the finest selection of seafood, international foods, and gourmet ingredients.',
    '456 Ocean Boulevard, Seaside Heights, Metro City, MC 67890',
    '+1 (555) 987-6543',
    'store2@test.com',
    '169415f1-0354-45a6-8f3d-4574a279302d', -- Replace with actual auth user ID
    NOW(),
    NOW()
),
(
    'Mountain Fresh Foods',
    'Family-owned grocery store serving the community for over 20 years. Specializing in local produce and farm-fresh dairy.',
    '789 Highland Avenue, Mountain View, Metro City, MC 54321',
    '+1 (555) 456-7890',
    'store3@test.com',
    '946b8659-84bb-4d1f-b576-b685ccef68ff', -- Replace with actual auth user ID
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Now let's get the store IDs for our inserted stores
-- We'll use the store names to find the IDs since we don't know the auto-generated storeIds

-- Insert products for Fresh Valley Market (Store 1)
WITH store_ids AS (
    SELECT storeId FROM public.GROCERY_STORE WHERE storeName = 'Fresh Valley Market'
)
INSERT INTO public.ITEMS_IN_STORE (
    storeId,
    item_name,
    item_description,
    item_price,
    item_quantity,
    item_category,
    created_at,
    updated_at
)
SELECT 
    store_ids.storeId,
    item_data.item_name,
    item_data.item_description,
    item_data.item_price,
    item_data.item_quantity,
    item_data.item_category,
    NOW(),
    NOW()
FROM store_ids,
(VALUES
    ('Organic Bananas', 'Fresh organic bananas from local farms', 2.99, 150, 'Fruits & Vegetables'),
    ('Red Delicious Apples', 'Crispy and sweet red apples, perfect for snacking', 3.49, 200, 'Fruits & Vegetables'),
    ('Fresh Spinach', 'Organic baby spinach leaves, pre-washed', 4.99, 80, 'Fruits & Vegetables'),
    ('Whole Milk', 'Fresh whole milk from local dairy farms', 3.79, 50, 'Dairy & Eggs'),
    ('Free-Range Eggs', 'Farm-fresh free-range chicken eggs (dozen)', 5.99, 75, 'Dairy & Eggs'),
    ('Sharp Cheddar Cheese', 'Aged sharp cheddar cheese block', 6.49, 30, 'Dairy & Eggs'),
    ('Artisan Sourdough Bread', 'Freshly baked sourdough bread loaf', 4.99, 25, 'Bakery'),
    ('Chocolate Croissants', 'Buttery croissants filled with dark chocolate', 7.99, 20, 'Bakery'),
    ('Organic Chicken Breast', 'Boneless, skinless organic chicken breast', 12.99, 40, 'Meat & Seafood'),
    ('Wild Salmon Fillet', 'Fresh Atlantic salmon fillet', 18.99, 15, 'Meat & Seafood'),
    ('Quinoa', 'Organic tri-color quinoa', 8.99, 35, 'Pantry'),
    ('Extra Virgin Olive Oil', 'Cold-pressed extra virgin olive oil', 12.99, 25, 'Pantry'),
    ('Green Tea', 'Premium green tea bags (20 count)', 6.99, 45, 'Beverages'),
    ('Sparkling Water', 'Natural sparkling water (12 pack)', 8.99, 60, 'Beverages'),
    ('Dark Chocolate Bar', 'Organic 70% dark chocolate bar', 4.99, 55, 'Snacks'),
    ('Mixed Nuts', 'Roasted mixed nuts (unsalted)', 9.99, 40, 'Snacks')
) AS item_data(item_name, item_description, item_price, item_quantity, item_category);

-- Insert products for Ocean View Grocers (Store 2)
WITH store_ids AS (
    SELECT storeId FROM public.GROCERY_STORE WHERE storeName = 'Ocean View Grocers'
)
INSERT INTO public.ITEMS_IN_STORE (
    storeId,
    item_name,
    item_description,
    item_price,
    item_quantity,
    item_category,
    created_at,
    updated_at
)
SELECT 
    store_ids.storeId,
    item_data.item_name,
    item_data.item_description,
    item_data.item_price,
    item_data.item_quantity,
    item_data.item_category,
    NOW(),
    NOW()
FROM store_ids,
(VALUES
    ('Lobster Tails', 'Fresh Maine lobster tails (2 pieces)', 24.99, 12, 'Meat & Seafood'),
    ('King Crab Legs', 'Alaskan king crab legs (1 lb)', 32.99, 8, 'Meat & Seafood'),
    ('Fresh Tuna Steaks', 'Sushi-grade yellowfin tuna steaks', 22.99, 10, 'Meat & Seafood'),
    ('Wagyu Beef', 'Premium wagyu beef ribeye steak', 45.99, 6, 'Meat & Seafood'),
    ('Imported Brie Cheese', 'French brie cheese wheel', 15.99, 20, 'Dairy & Eggs'),
    ('Truffle Honey', 'Italian truffle-infused honey', 18.99, 15, 'Pantry'),
    ('Saffron Threads', 'Premium Spanish saffron threads', 24.99, 5, 'Pantry'),
    ('Japanese Rice', 'Premium short-grain Japanese rice', 12.99, 30, 'Pantry'),
    ('French Champagne', 'Vintage French champagne bottle', 89.99, 10, 'Beverages'),
    ('Italian Prosecco', 'Sparkling Italian prosecco', 19.99, 25, 'Beverages'),
    ('Artisan Croissants', 'French butter croissants (6 pack)', 12.99, 18, 'Bakery'),
    ('Macarons', 'Assorted French macarons (12 pack)', 16.99, 15, 'Bakery'),
    ('Exotic Fruit Mix', 'Dragon fruit, rambutan, and lychee', 14.99, 25, 'Fruits & Vegetables'),
    ('Organic Kale', 'Fresh organic kale bunches', 3.99, 40, 'Fruits & Vegetables'),
    ('Gourmet Chocolate Truffles', 'Handcrafted chocolate truffles (8 pieces)', 22.99, 30, 'Snacks'),
    ('Imported Prosciutto', 'Italian prosciutto di Parma (sliced)', 28.99, 12, 'Meat & Seafood')
) AS item_data(item_name, item_description, item_price, item_quantity, item_category);

-- Insert products for Mountain Fresh Foods (Store 3)
WITH store_ids AS (
    SELECT storeId FROM public.GROCERY_STORE WHERE storeName = 'Mountain Fresh Foods'
)
INSERT INTO public.ITEMS_IN_STORE (
    storeId,
    item_name,
    item_description,
    item_price,
    item_quantity,
    item_category,
    created_at,
    updated_at
)
SELECT 
    store_ids.storeId,
    item_data.item_name,
    item_data.item_description,
    item_data.item_price,
    item_data.item_quantity,
    item_data.item_category,
    NOW(),
    NOW()
FROM store_ids,
(VALUES
    ('Farm Fresh Carrots', 'Locally grown organic carrots (2 lb bag)', 2.49, 100, 'Fruits & Vegetables'),
    ('Heirloom Tomatoes', 'Mixed heirloom tomatoes from local farms', 5.99, 75, 'Fruits & Vegetables'),
    ('Sweet Corn', 'Fresh sweet corn on the cob (6 ears)', 4.99, 90, 'Fruits & Vegetables'),
    ('Farm Butter', 'Creamy farm-fresh butter (unsalted)', 4.99, 60, 'Dairy & Eggs'),
    ('Goat Cheese', 'Creamy local goat cheese log', 8.99, 25, 'Dairy & Eggs'),
    ('Raw Honey', 'Unfiltered raw honey from mountain apiaries', 9.99, 35, 'Pantry'),
    ('Whole Wheat Flour', 'Stone-ground whole wheat flour (5 lb)', 6.99, 40, 'Pantry'),
    ('Mountain Spring Water', 'Natural mountain spring water (6 pack)', 5.99, 80, 'Beverages'),
    ('Apple Cider', 'Fresh pressed apple cider (64 oz)', 7.99, 30, 'Beverages'),
    ('Homemade Granola', 'House-made granola with nuts and dried fruit', 8.99, 45, 'Snacks'),
    ('Local Beef Jerky', 'Handcrafted beef jerky (original flavor)', 12.99, 35, 'Snacks'),
    ('Farm Bread', 'Fresh-baked farmhouse bread loaf', 3.99, 50, 'Bakery'),
    ('Blueberry Muffins', 'Fresh blueberry muffins (6 pack)', 6.99, 25, 'Bakery'),
    ('Ground Turkey', 'Lean ground turkey (1 lb package)', 7.99, 30, 'Meat & Seafood'),
    ('Frozen Berries', 'Mixed frozen berries (organic)', 6.99, 55, 'Frozen Foods'),
    ('Laundry Detergent', 'Eco-friendly laundry detergent (64 oz)', 11.99, 20, 'Household Items')
) AS item_data(item_name, item_description, item_price, item_quantity, item_category);

-- Display summary of what was inserted
SELECT 
    'GROCERY_STORE' as table_name,
    COUNT(*) as records_inserted,
    'stores created' as description
FROM public.GROCERY_STORE 
WHERE storeName IN ('Fresh Valley Market', 'Ocean View Grocers', 'Mountain Fresh Foods')

UNION ALL

SELECT 
    'ITEMS_IN_STORE' as table_name,
    COUNT(*) as records_inserted,
    'products added across all stores' as description
FROM public.ITEMS_IN_STORE i
JOIN public.GROCERY_STORE g ON i.storeId = g.storeId
WHERE g.storeName IN ('Fresh Valley Market', 'Ocean View Grocers', 'Mountain Fresh Foods');

-- Show store summary with product counts
SELECT 
    g.storeName,
    g.storeDescription,
    g.store_address,
    g.store_phone,
    COUNT(i.storeItemId) as total_products,
    ROUND(AVG(i.item_price), 2) as avg_price
FROM public.GROCERY_STORE g
LEFT JOIN public.ITEMS_IN_STORE i ON g.storeId = i.storeId
WHERE g.storeName IN ('Fresh Valley Market', 'Ocean View Grocers', 'Mountain Fresh Foods')
GROUP BY g.storeId, g.storeName, g.storeDescription, g.store_address, g.store_phone
ORDER BY g.storeName;
