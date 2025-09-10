-- Test if CARTS and CART_ITEMS tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('CARTS', 'CART_ITEMS');

-- If the tables don't exist, you'll need to run the cart_tables.sql script first
