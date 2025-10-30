# Grocery Database Population Scripts

This directory contains SQL scripts to populate your grocery store database with realistic products and inventory data.

## Files Overview

### Core Setup Scripts
- `create_product_type_table.sql` - Creates the PRODUCT_TYPE table with proper schema and policies
- `populate_product_types.sql` - Populates PRODUCT_TYPE with 100+ realistic grocery products
- `populate_store_items.sql` - Creates sample stores and populates ITEMS_IN_STORE with inventory
- `setup_grocery_database.sql` - Master script that runs all setup scripts in order

### Existing Database Scripts
- `store_tables.sql` - Creates GROCERY_STORE and ITEMS_IN_STORE tables
- `create_srp_prices_table.sql` - Creates SRP (Suggested Retail Price) table

## Quick Start

To populate your database with realistic grocery data, run:

```sql
\i setup_grocery_database.sql
```

Or run the scripts individually in this order:

```sql
\i create_product_type_table.sql
\i store_tables.sql
\i populate_product_types.sql
\i populate_store_items.sql
\i create_srp_prices_table.sql
```

## What Gets Created

### PRODUCT_TYPE Table (100+ products)
The script creates a comprehensive catalog of grocery products including:

**Categories:**
- **Dairy Products** (9 items) - Milk, cheese, butter, yogurt, cream
- **Meat Products** (10 items) - Chicken, pork, beef, fish, processed meats
- **Rice & Grains** (7 items) - Various rice types, bread, oats
- **Fruits** (9 items) - Apples, bananas, mangoes, oranges, etc.
- **Vegetables** (10 items) - Onions, garlic, tomatoes, potatoes, etc.
- **Canned Goods** (8 items) - Corned beef, sardines, tuna, sauces
- **Condiments** (9 items) - Soy sauce, vinegar, ketchup, seasonings
- **Cooking Oil** (4 items) - Vegetable oil, olive oil, coconut oil
- **Beverages** (7 items) - Soft drinks, water, coffee, tea, juices
- **Snacks** (6 items) - Biscuits, chips, chocolates, candies
- **Personal Care** (4 items) - Shampoo, soap, toothpaste, toothbrush
- **Household Items** (4 items) - Detergent, dishwashing liquid, tissues
- **Frozen Items** (3 items) - Ice cream, frozen vegetables, fish fillets
- **Baby Products** (3 items) - Baby food, diapers, formula
- **Pet Food** (2 items) - Dog food, cat food

### GROCERY_STORE Table (5 sample stores)
Creates realistic grocery stores in Iloilo City:
1. **SM Supermarket Suarez** - Premium supermarket
2. **Gaisano Grand Mall Grocery** - Mid-range grocery
3. **Robinsons Supermarket** - Premium shopping experience
4. **Metro Supermarket Jaro** - Local district store
5. **Pure Gold Supermarket** - Affordable essentials

### ITEMS_IN_STORE Table (100+ inventory items)
Populates store inventories with:
- Realistic pricing (₱12 - ₱850)
- Appropriate stock quantities (15-250 items)
- Product descriptions and categories
- Store-specific product selections

### SRP Table
Creates suggested retail prices for all products with realistic Philippine pricing.

## Philippine Market Pricing

All prices are set to reflect realistic Philippine grocery prices as of 2024:

- **Rice**: ₱45-68/kg
- **Meat**: ₱140-450/kg
- **Fruits**: ₱35-200/kg
- **Vegetables**: ₱30-145/kg
- **Canned Goods**: ₱15-85
- **Beverages**: ₱15-87
- **Personal Care**: ₱35-189

## Database Schema Notes

### PRODUCT_TYPE Table Structure
```sql
"productTypeId" SERIAL PRIMARY KEY
"Name" VARCHAR(255) NOT NULL
"Brand" VARCHAR(255)
"Variant" VARCHAR(255)
"Unit" VARCHAR(50) NOT NULL
"Quantity" INTEGER DEFAULT 1
"created_at" TIMESTAMP WITH TIME ZONE
"updated_at" TIMESTAMP WITH TIME ZONE
```

### Key Features
- **Row Level Security (RLS)** enabled
- **Public read access** for product catalog
- **Authenticated user policies** for modifications
- **Automatic timestamps** with triggers
- **Performance indexes** on name, brand, and unit
- **Realistic Filipino grocery products** with proper units (kg, pc, bottle, pack, etc.)

## Important Notes

⚠️ **Owner ID Requirement**: The sample stores use placeholder owner_ids. Update these with actual auth.users IDs from your Supabase project.

⚠️ **Run Once**: These scripts insert data. Running multiple times may create duplicates unless you clear tables first.

⚠️ **Supabase Compatibility**: All scripts are designed for Supabase PostgreSQL with proper RLS policies.

## Customization

You can easily customize the data by:
1. Editing product names, brands, and prices in `populate_product_types.sql`
2. Adding more stores in `populate_store_items.sql`
3. Adjusting inventory quantities and pricing
4. Adding more product categories

## Verification

After running the scripts, verify the data with:

```sql
-- Check product count by category
SELECT 
    CASE 
        WHEN "Name" IN ('Milk', 'Cheese', 'Butter', 'Yogurt') THEN 'Dairy'
        WHEN "Name" IN ('Chicken', 'Pork', 'Beef', 'Fish') THEN 'Meat'
        WHEN "Name" IN ('Rice', 'Bread', 'Oats') THEN 'Grains'
        ELSE 'Other'
    END as category,
    COUNT(*) as product_count
FROM public."PRODUCT_TYPE"
GROUP BY category;

-- Check store inventory
SELECT 
    gs.storeName,
    COUNT(iis.storeItemId) as items_count,
    AVG(iis.item_price)::NUMERIC(10,2) as avg_price
FROM public.GROCERY_STORE gs
LEFT JOIN public.ITEMS_IN_STORE iis ON gs.storeId = iis.storeId
GROUP BY gs.storeId, gs.storeName;
```

## Support

If you encounter any issues:
1. Ensure your Supabase project has proper permissions
2. Check that auth.users table exists with valid user IDs
3. Verify RLS policies allow your operations
4. Check for any foreign key constraint violations