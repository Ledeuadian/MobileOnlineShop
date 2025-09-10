-- Populate ITEMS_IN_STORE with random grocery products for stores 1, 2, and 3
-- Run this script in your Supabase SQL Editor

-- Clear existing items (optional - remove this if you want to keep existing data)
-- DELETE FROM "ITEMS_IN_STORE";

-- Insert grocery items for Store 1
INSERT INTO "ITEMS_IN_STORE" (name, description, price, availability, category, unit, "storeId", item_image_url) VALUES
-- Fruits & Vegetables for Store 1
('Fresh Bananas', 'Sweet and ripe bananas, perfect for snacking', 2.50, 150, 'Fruits & Vegetables', 'kg', 1, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300'),
('Red Apples', 'Crisp and juicy Gala apples', 4.00, 80, 'Fruits & Vegetables', 'kg', 1, 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300'),
('Carrots', 'Fresh orange carrots, great for cooking', 3.25, 60, 'Fruits & Vegetables', 'kg', 1, 'https://images.unsplash.com/photo-1445282768818-728615cc910a?w=300'),
('Tomatoes', 'Ripe red tomatoes for salads and cooking', 5.50, 45, 'Fruits & Vegetables', 'kg', 1, 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300'),
('Lettuce', 'Fresh green lettuce heads', 2.75, 30, 'Fruits & Vegetables', 'pcs', 1, 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=300'),

-- Meat & Seafood for Store 1
('Chicken Breast', 'Boneless skinless chicken breast', 12.99, 25, 'Meat & Seafood', 'kg', 1, 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300'),
('Ground Beef', 'Fresh lean ground beef', 15.50, 20, 'Meat & Seafood', 'kg', 1, 'https://images.unsplash.com/photo-1588347818113-0c3dc4d08bb7?w=300'),
('Salmon Fillet', 'Fresh Atlantic salmon', 22.00, 15, 'Meat & Seafood', 'kg', 1, 'https://images.unsplash.com/photo-1574781330855-d0db3580ce38?w=300'),

-- Dairy & Eggs for Store 1
('Whole Milk', 'Fresh whole milk 1 liter', 3.50, 40, 'Dairy & Eggs', 'liter', 1, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300'),
('Cheddar Cheese', 'Sharp cheddar cheese block', 8.25, 25, 'Dairy & Eggs', 'pack', 1, 'https://images.unsplash.com/photo-1552767059-ce182ead6c1b?w=300'),
('Free Range Eggs', 'Farm fresh free range eggs', 4.75, 35, 'Dairy & Eggs', 'pack', 1, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300'),

-- Bakery for Store 1
('White Bread', 'Fresh baked white bread loaf', 2.25, 20, 'Bakery', 'pcs', 1, 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300'),
('Croissants', 'Buttery French croissants', 6.50, 15, 'Bakery', 'pack', 1, 'https://images.unsplash.com/photo-1555507036-ab794f374caa?w=300'),

-- Pantry for Store 1
('Basmati Rice', 'Premium long grain basmati rice', 8.99, 50, 'Pantry', 'kg', 1, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'),
('Olive Oil', 'Extra virgin olive oil', 12.50, 30, 'Pantry', 'liter', 1, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'),
('Pasta', 'Italian spaghetti pasta', 3.75, 40, 'Pantry', 'pack', 1, 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=300');

-- Insert grocery items for Store 2
INSERT INTO "ITEMS_IN_STORE" (name, description, price, availability, category, unit, "storeId", item_image_url) VALUES
-- Fruits & Vegetables for Store 2
('Green Mangoes', 'Fresh green mangoes, perfect for cooking', 6.50, 45, 'Fruits & Vegetables', 'kg', 2, 'https://images.unsplash.com/photo-1605027990121-3b2c6c4dd1db?w=300'),
('Pineapple', 'Sweet tropical pineapple', 4.25, 25, 'Fruits & Vegetables', 'pcs', 2, 'https://images.unsplash.com/photo-1490885578174-acda8905c2c6?w=300'),
('Bell Peppers', 'Colorful bell peppers mix', 7.75, 35, 'Fruits & Vegetables', 'kg', 2, 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300'),
('Onions', 'Yellow cooking onions', 2.99, 80, 'Fruits & Vegetables', 'kg', 2, 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300'),
('Spinach', 'Fresh baby spinach leaves', 4.50, 20, 'Fruits & Vegetables', 'pack', 2, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300'),

-- Meat & Seafood for Store 2
('Pork Chops', 'Bone-in pork chops', 13.75, 18, 'Meat & Seafood', 'kg', 2, 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300'),
('Shrimp', 'Fresh large shrimp', 25.00, 12, 'Meat & Seafood', 'kg', 2, 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300'),
('Tilapia', 'Fresh tilapia fillets', 18.50, 22, 'Meat & Seafood', 'kg', 2, 'https://images.unsplash.com/photo-1544943910-4c1dc44aab44?w=300'),

-- Dairy & Eggs for Store 2
('Greek Yogurt', 'Creamy Greek yogurt', 5.25, 30, 'Dairy & Eggs', 'pack', 2, 'https://images.unsplash.com/photo-1571212515416-43a990a4bf7d?w=300'),
('Butter', 'Unsalted butter', 6.75, 25, 'Dairy & Eggs', 'pack', 2, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=300'),
('Mozzarella', 'Fresh mozzarella cheese', 9.50, 20, 'Dairy & Eggs', 'pack', 2, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=300'),

-- Beverages for Store 2
('Orange Juice', 'Fresh squeezed orange juice', 4.99, 35, 'Beverages', 'liter', 2, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=300'),
('Green Tea', 'Premium green tea bags', 8.25, 40, 'Beverages', 'pack', 2, 'https://images.unsplash.com/photo-1594631661960-e27a0b2507dc?w=300'),
('Coconut Water', 'Natural coconut water', 3.75, 50, 'Beverages', 'liter', 2, 'https://images.unsplash.com/photo-1481671703460-040cb8a2d909?w=300'),

-- Snacks for Store 2
('Mixed Nuts', 'Roasted mixed nuts', 12.99, 25, 'Snacks', 'pack', 2, 'https://images.unsplash.com/photo-1599599810769-bcde5a160d32?w=300'),
('Potato Chips', 'Crispy potato chips', 3.50, 45, 'Snacks', 'pack', 2, 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300'),

-- Frozen Foods for Store 2
('Frozen Berries', 'Mixed frozen berries', 7.25, 30, 'Frozen Foods', 'pack', 2, 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300'),
('Ice Cream', 'Vanilla ice cream tub', 8.99, 20, 'Frozen Foods', 'pack', 2, 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300');

-- Insert grocery items for Store 3
INSERT INTO "ITEMS_IN_STORE" (name, description, price, availability, category, unit, "storeId", item_image_url) VALUES
-- Fruits & Vegetables for Store 3
('Avocados', 'Ripe Hass avocados', 8.50, 40, 'Fruits & Vegetables', 'kg', 3, 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=300'),
('Broccoli', 'Fresh green broccoli', 5.25, 30, 'Fruits & Vegetables', 'kg', 3, 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=300'),
('Sweet Potatoes', 'Orange sweet potatoes', 3.75, 55, 'Fruits & Vegetables', 'kg', 3, 'https://images.unsplash.com/photo-1629818950833-d1ddc1f5b96e?w=300'),
('Grapes', 'Red seedless grapes', 9.99, 25, 'Fruits & Vegetables', 'kg', 3, 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300'),
('Cucumber', 'Fresh cucumbers', 2.50, 60, 'Fruits & Vegetables', 'kg', 3, 'https://images.unsplash.com/photo-1604977042946-1eecc30f269e?w=300'),

-- Meat & Seafood for Store 3
('Beef Steak', 'Premium ribeye steak', 28.99, 10, 'Meat & Seafood', 'kg', 3, 'https://images.unsplash.com/photo-1558030006-450675393462?w=300'),
('Lamb Chops', 'Fresh lamb chops', 32.50, 8, 'Meat & Seafood', 'kg', 3, 'https://images.unsplash.com/photo-1544025162-d76694265947?w=300'),
('Cod Fillet', 'Fresh cod fish fillet', 24.75, 15, 'Meat & Seafood', 'kg', 3, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=300'),

-- Dairy & Eggs for Store 3
('Almond Milk', 'Unsweetened almond milk', 4.25, 35, 'Dairy & Eggs', 'liter', 3, 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300'),
('Goat Cheese', 'Creamy goat cheese', 11.50, 15, 'Dairy & Eggs', 'pack', 3, 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=300'),
('Organic Eggs', 'Organic free range eggs', 6.25, 25, 'Dairy & Eggs', 'pack', 3, 'https://images.unsplash.com/photo-1566430790154-cece5ce0dbde?w=300'),

-- Health & Beauty for Store 3
('Honey', 'Pure organic honey', 9.75, 20, 'Health & Beauty', 'pack', 3, 'https://images.unsplash.com/photo-1587049016823-7a87b8cc03db?w=300'),
('Vitamin C', 'Vitamin C supplements', 15.99, 30, 'Health & Beauty', 'pack', 3, 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300'),
('Green Juice', 'Cold-pressed green juice', 7.50, 15, 'Health & Beauty', 'liter', 3, 'https://images.unsplash.com/photo-1570197788417-0e82375c9371?w=300'),

-- Pantry for Store 3
('Quinoa', 'Organic quinoa grains', 12.25, 25, 'Pantry', 'kg', 3, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300'),
('Coconut Oil', 'Virgin coconut oil', 14.75, 20, 'Pantry', 'pack', 3, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300'),
('Almond Flour', 'Gluten-free almond flour', 16.50, 18, 'Pantry', 'pack', 3, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300'),

-- Beverages for Store 3
('Kombucha', 'Probiotic kombucha drink', 5.99, 25, 'Beverages', 'liter', 3, 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300'),
('Sparkling Water', 'Natural sparkling water', 2.75, 60, 'Beverages', 'liter', 3, 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=300');

-- Display success message
SELECT 'Successfully populated ITEMS_IN_STORE table with grocery products for stores 1, 2, and 3!' as message;
