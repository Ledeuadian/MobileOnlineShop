-- Create and populate PRODUCT_TYPE table with Filipino grocery market products
-- This includes common brands and variants found in Philippine supermarkets

-- First, create the PRODUCT_TYPE table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.PRODUCT_TYPE (
    ProductTypeId SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    Name VARCHAR NOT NULL,
    Brand VARCHAR,
    Variant VARCHAR,
    Unit VARCHAR
);

-- Enable Row Level Security if needed
-- ALTER TABLE public.PRODUCT_TYPE ENABLE ROW LEVEL SECURITY;

-- Rice Products
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Rice', 'Sinandomeng', 'Premium', 'kg'),
('Rice', 'Sinandomeng', 'Regular', 'kg'),
('Rice', 'Jasmine', 'Premium', 'kg'),
('Rice', 'Dinorado', 'Premium', 'kg'),
('Rice', 'C2', 'Classic White', 'kg'),
('Rice', 'Doña Maria', 'Jasponica', 'kg'),
('Rice', 'Angelica', 'Premium', 'kg');

-- Cooking Oil
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Cooking Oil', 'Knife', 'Vegetable Oil', 'liter'),
('Cooking Oil', 'Minola', 'Premium', 'liter'),
('Cooking Oil', 'Baguio', 'Vegetable Oil', 'liter'),
('Cooking Oil', 'Golden Fiesta', 'Palm Oil', 'liter'),
('Cooking Oil', 'Coconut Oil', 'Pure', 'liter'),
('Cooking Oil', 'Capulong', 'Coconut Oil', 'liter');

-- Instant Noodles
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Instant Noodles', 'Lucky Me!', 'Chicken', 'pcs'),
('Instant Noodles', 'Lucky Me!', 'Beef', 'pcs'),
('Instant Noodles', 'Lucky Me!', 'Pork', 'pcs'),
('Instant Noodles', 'Pancit Canton', 'Original', 'pcs'),
('Instant Noodles', 'Pancit Canton', 'Sweet Style', 'pcs'),
('Instant Noodles', 'Pancit Canton', 'Spicy', 'pcs'),
('Instant Noodles', 'Payless', 'Chicken', 'pcs'),
('Instant Noodles', 'Nissin', 'Seafood', 'pcs'),
('Instant Noodles', 'Maggi', 'Chicken', 'pcs');

-- Canned Goods - Corned Beef
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Corned Beef', 'Libby''s', 'Original', 'can'),
('Corned Beef', 'Argentina', 'Classic', 'can'),
('Corned Beef', 'Purefoods', 'Chunky', 'can'),
('Corned Beef', 'CDO', 'Premium', 'can'),
('Corned Beef', 'Palm', 'Original', 'can');

-- Canned Goods - Sardines
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Sardines', 'Ligo', 'Tomato Sauce', 'can'),
('Sardines', 'Ligo', 'Spanish Style', 'can'),
('Sardines', 'Young''s Town', 'Tomato Sauce', 'can'),
('Sardines', 'Mega', 'Tomato Sauce', 'can'),
('Sardines', 'San Marino', 'Corned Tuna', 'can'),
('Sardines', '555', 'Spanish Style', 'can');

-- Milk Products
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Milk', 'Alaska', 'Condensed', 'can'),
('Milk', 'Carnation', 'Evaporated', 'can'),
('Milk', 'Nestle', 'All Purpose Cream', 'can'),
('Milk', 'Bear Brand', 'Sterilized', 'can'),
('Milk', 'Magnolia', 'Fresh Milk', 'liter'),
('Milk', 'Anchor', 'Powdered', 'pack'),
('Milk', 'Nido', 'Fortified', 'pack');

-- Coffee
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Coffee', 'Nescafe', '3-in-1 Original', 'pack'),
('Coffee', 'Nescafe', '3-in-1 Brown & Creamy', 'pack'),
('Coffee', 'Kopiko', '3-in-1', 'pack'),
('Coffee', 'Great Taste', '3-in-1 Original', 'pack'),
('Coffee', 'Blend 45', 'Iced Coffee', 'pack'),
('Coffee', 'San Mig Coffee', '3-in-1', 'pack');

-- Sugar and Sweeteners
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Sugar', 'Domino', 'White', 'kg'),
('Sugar', 'Muscovado', 'Brown', 'kg'),
('Sugar', 'Crystal', 'Refined White', 'kg'),
('Sugar', 'Equal', 'Artificial Sweetener', 'pack');

-- Salt and Seasonings
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Salt', 'Supura', 'Iodized', 'pack'),
('Seasoning', 'Maggi', 'Magic Sarap', 'pack'),
('Seasoning', 'Ajinomoto', 'Umami', 'pack'),
('Seasoning', 'Knorr', 'Chicken Cubes', 'pack'),
('Seasoning', 'Mama Sita''s', 'Oyster Sauce', 'bottle');

-- Soap and Detergent
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Laundry Soap', 'Tide', 'Original', 'pack'),
('Laundry Soap', 'Ariel', 'Color & Style', 'pack'),
('Laundry Soap', 'Surf', 'Bango', 'pack'),
('Bath Soap', 'Safeguard', 'Classic White', 'pcs'),
('Bath Soap', 'Dove', 'Moisturizing', 'pcs'),
('Dishwashing Liquid', 'Joy', 'Lemon', 'bottle'),
('Fabric Conditioner', 'Downy', 'Antibac', 'bottle');

-- Shampoo and Personal Care
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Shampoo', 'Pantene', 'Pro-V', 'bottle'),
('Shampoo', 'Head & Shoulders', 'Classic Clean', 'bottle'),
('Shampoo', 'Sunsilk', 'Damage Restore', 'bottle'),
('Toothpaste', 'Colgate', 'Total', 'tube'),
('Toothpaste', 'Close Up', 'Red Hot', 'tube'),
('Deodorant', 'Rexona', 'Men', 'bottle');

-- Bread and Bakery
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Bread', 'Gardenia', 'Classic White', 'loaf'),
('Bread', 'Pinoy Tasty', 'White Bread', 'loaf'),
('Bread', 'Neubake', 'Whole Wheat', 'loaf'),
('Pandesal', 'Local Bakery', 'Traditional', 'pcs');

-- Snacks
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Chips', 'Chippy', 'Barbecue', 'pack'),
('Chips', 'Nova', 'Multigrain Snack', 'pack'),
('Biscuits', 'Skyflakes', 'Crackers', 'pack'),
('Biscuits', 'Fita', 'Crackers', 'pack'),
('Candy', 'Ricola', 'Menthol', 'pack');

-- Beverages
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Soft Drinks', 'Coca-Cola', 'Original', 'bottle'),
('Soft Drinks', 'Pepsi', 'Original', 'bottle'),
('Soft Drinks', 'Sprite', 'Lemon-Lime', 'bottle'),
('Soft Drinks', 'Royal', 'Orange', 'bottle'),
('Juice', 'Del Monte', 'Pineapple', 'can'),
('Juice', 'Zesto', 'Orange', 'bottle'),
('Energy Drink', 'Red Bull', 'Original', 'can'),
('Water', 'Nature''s Spring', 'Purified', 'bottle'),
('Water', 'Absolute', 'Distilled', 'bottle');

-- Eggs and Dairy
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Eggs', 'Country Eggs', 'Large', 'tray'),
('Eggs', 'Farm Fresh', 'Medium', 'tray'),
('Cheese', 'Eden', 'Cheddar', 'pack'),
('Cheese', 'Kraft', 'Singles', 'pack'),
('Butter', 'Anchor', 'Salted', 'pack'),
('Margarine', 'Star', 'Original', 'pack');

-- Vegetables (Fresh)
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Onion', 'Local', 'Red', 'kg'),
('Onion', 'Local', 'White', 'kg'),
('Garlic', 'Local', 'Native', 'kg'),
('Tomato', 'Local', 'Fresh', 'kg'),
('Potato', 'Local', 'Red', 'kg'),
('Carrot', 'Local', 'Fresh', 'kg'),
('Cabbage', 'Local', 'Fresh', 'head');

-- Fruits (Fresh)
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Banana', 'Local', 'Saba', 'kg'),
('Banana', 'Local', 'Lakatan', 'kg'),
('Apple', 'Imported', 'Red Delicious', 'kg'),
('Orange', 'Local', 'Dalandan', 'kg'),
('Mango', 'Local', 'Carabao', 'kg'),
('Pineapple', 'Local', 'Sweet', 'pcs');

-- Meat Products
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Pork', 'Local', 'Kasim', 'kg'),
('Pork', 'Local', 'Liempo', 'kg'),
('Chicken', 'Magnolia', 'Whole', 'kg'),
('Chicken', 'Bounty Fresh', 'Breast Fillet', 'kg'),
('Beef', 'Local', 'Chuck', 'kg'),
('Fish', 'Local', 'Tilapia', 'kg'),
('Fish', 'Local', 'Bangus', 'kg');

-- Frozen Products
INSERT INTO public.PRODUCT_TYPE (Name, Brand, Variant, Unit) VALUES
('Hotdog', 'Purefoods', 'Tender Juicy', 'pack'),
('Hotdog', 'CDO', 'Idol', 'pack'),
('Bacon', 'Purefoods', 'Honeycured', 'pack'),
('Ice Cream', 'Selecta', 'Vanilla', 'liter'),
('Ice Cream', 'Magnolia', 'Chocolate', 'liter'),
('Frozen Fish', 'Local', 'Galunggong', 'kg');
