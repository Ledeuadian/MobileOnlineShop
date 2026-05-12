-- Quick Setup: Philippine Market Products with Size Options
-- 
-- This script will add realistic Philippine grocery products
-- with multiple size options (like the Salt example in your design)
--
-- HOW TO RUN:
-- 1. Open Supabase Dashboard (https://supabase.com/dashboard)
-- 2. Go to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run"
--
-- OR use PostgreSQL CLI:
-- psql -h your-host.supabase.co -U postgres -d postgres < database/populate_philippine_products.sql

\echo '=================================================='
\echo 'Philippine Grocery Products - Installation'
\echo '=================================================='
\echo 'Adding products with multiple size options...'
\echo ''

-- First, show current product count
SELECT COUNT(*) as current_products FROM public."PRODUCT_TYPE";

-- Now run the main population script
\i populate_philippine_products.sql

\echo ''
\echo '✅ Installation Complete!'
\echo ''
\echo 'Products added include:'
\echo '  • Condiments (Soy sauce, Vinegar, Salt, etc.) - Multiple sizes'
\echo '  • Produce (Fruits & Vegetables)'
\echo '  • Cereal (Rice, Oats, Bread, etc.) - Multiple sizes'
\echo '  • Beverages (Soft drinks, Water, Coffee, etc.) - Multiple sizes'
\echo '  • Canned Goods (Corned beef, Sardines, Tuna, etc.) - Multiple sizes'
\echo '  • Snacks (Chips, Biscuits, Cookies, etc.) - Multiple sizes'
\echo ''
\echo 'Products with size selection (examples):'
\echo '  • Mc Cormick Salt: 150g, 300g, 1kg'
\echo '  • Coca Cola: 350ml, 1L, 1.5L bottles + 330ml cans'
\echo '  • Quaker Oats: 200g, 400g, 800g packs'
\echo '  • Skyflakes Biscuits: 250g, 800g packs'
\echo ''

-- Show summary
SELECT 
    'Total Products Now' as info,
    COUNT(*) as count
FROM public."PRODUCT_TYPE";

\echo ''
\echo 'To see products with multiple sizes:'
SELECT 
    "Name",
    "Brand",
    COUNT(*) as size_options,
    STRING_AGG("Unit", ', ' ORDER BY "Unit") as available_sizes
FROM public."PRODUCT_TYPE"
GROUP BY "Name", "Brand"
HAVING COUNT(*) > 1
ORDER BY "Name"
LIMIT 10;

\echo ''
\echo '=================================================='
\echo 'Next Steps:'
\echo '1. Import ProductSizeSelector component in your pages'
\echo '2. Use ProductVariantService to fetch size options'
\echo '3. See PRODUCT_SIZE_SELECTION_GUIDE.md for examples'
\echo '=================================================='
