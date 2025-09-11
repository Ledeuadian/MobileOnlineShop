# Database SQL Files Safety Analysis

## 🔴 CRITICAL - DO NOT REMOVE (Core System Tables)
These files create essential database tables that your application depends on:

1. **`cart_tables.sql`** - Creates CARTS and CART_ITEMS tables (shopping cart functionality)
2. **`store_tables.sql`** - Creates GROCERY_STORE and ITEMS_IN_STORE tables (core store functionality)
3. **`grocery_list_table.sql`** - Creates grocery list functionality tables
4. **`create_srp_prices_table.sql`** - Creates SRP pricing table for DTI functionality

## 🟡 IMPORTANT - KEEP (Security & Access Control)
These files configure security policies and access control:

5. **`dti_access_policies.sql`** - DTI user access policies
6. **`public_read_policies.sql`** - Public read access policies
7. **`storage_policies.sql`** - File storage access policies
8. **`product_type_public_policy.sql`** - PRODUCT_TYPE table access policies

## 🟢 SAFE TO REMOVE (Duplicate Data Creation - CAUSING THE TRIPLICATION)
These files are the ROOT CAUSE of your triplication issue:

9. **`populate_product_types.sql`** ⚠️ MAIN CULPRIT - Creates ~119 products
10. **`batch_insert_products.sql`** ⚠️ DUPLICATE DATA - Duplicates the same products
11. **`transfer_to_uppercase_table.sql`** ⚠️ ADDS MORE DUPLICATES - Transfers from another table
12. **`populate_items.sql`** - May contain duplicate product data
13. **`seed_data.sql`** - May contain duplicate seed data

## 🔵 SAFE TO REMOVE (Migration & Update Scripts - Already Applied)
These are one-time migration scripts that have likely already been applied:

14. **`add_brand_column.sql`** - Adds Brand column (migration)
15. **`add_unit_column.sql`** - Adds Unit column (migration)
16. **`migration_add_brand_unit.sql`** - Brand/Unit migration
17. **`update_product_quantity.sql`** - Updates quantities (one-time)
18. **`update_quantity_correct_columns.sql`** - Column updates (one-time)

## 🟢 SAFE TO REMOVE (Test & Debug Files)
These are temporary files for testing and debugging:

19. **`test_cart_tables.sql`** - Test file
20. **`test_product_type.sql`** - Test file
21. **`test_queries.sql`** - Test file
22. **`debug_categories.sql`** - Debug file
23. **`check_table_structure.sql`** - Diagnostic file

## 🟢 SAFE TO REMOVE (Analysis & Cleanup Files - Created Today)
These are the files we created to fix the triplication issue:

24. **`analyze_product_type_duplicates.sql`** - Analysis script
25. **`check_duplicates.sql`** - Duplicate checker
26. **`cleanup_duplicates.sql`** - Cleanup script
27. **`comprehensive_cleanup.sql`** - Comprehensive cleanup

## 📋 DOCUMENTATION (KEEP)
28. **`schema_mapping.md`** - Important documentation about table structure

## RECOMMENDED ACTION PLAN

### Step 1: Backup Everything First
```bash
# Create a backup of the entire database folder
cp -r database database_backup_$(date +%Y%m%d)
```

### Step 2: Run Cleanup First (Before Removing Files)
Execute this single cleanup script to fix the triplication:
```sql
-- Run this ONCE to clean up the duplicates
\i database/comprehensive_cleanup.sql
```

### Step 3: Safe Files to Remove (After Cleanup)
```bash
# Remove the duplicate-causing files
rm database/batch_insert_products.sql
rm database/transfer_to_uppercase_table.sql
rm database/populate_items.sql (if it contains duplicates)

# Remove test/debug files
rm database/test_*.sql
rm database/debug_*.sql
rm database/check_table_structure.sql

# Remove migration files (if already applied)
rm database/add_brand_column.sql
rm database/add_unit_column.sql
rm database/migration_add_brand_unit.sql
rm database/update_*_quantity.sql

# Remove today's analysis files (after they've served their purpose)
rm database/analyze_product_type_duplicates.sql
rm database/check_duplicates.sql
rm database/cleanup_duplicates.sql
```

### Step 4: Keep These Essential Files
```
database/
├── cart_tables.sql                    # ✅ KEEP - Core functionality
├── store_tables.sql                   # ✅ KEEP - Core functionality
├── grocery_list_table.sql             # ✅ KEEP - Core functionality
├── create_srp_prices_table.sql        # ✅ KEEP - DTI functionality
├── dti_access_policies.sql            # ✅ KEEP - Security
├── public_read_policies.sql           # ✅ KEEP - Security
├── storage_policies.sql               # ✅ KEEP - Security
├── product_type_public_policy.sql     # ✅ KEEP - Security
├── populate_product_types.sql         # ✅ KEEP - BUT DON'T RUN AGAIN
├── comprehensive_cleanup.sql          # ✅ KEEP - Run once then archive
└── schema_mapping.md                  # ✅ KEEP - Documentation
```

## ⚠️ CRITICAL WARNING
- **DO NOT remove files while your application is running**
- **ALWAYS backup before removing anything**
- **Test your application after cleanup to ensure everything works**
- **The triplication will be fixed by running the cleanup script, not by removing files**

## The Real Fix
The triplication issue is NOT caused by having these files in your folder - it's caused by **running multiple population scripts**. The fix is to:
1. Run the cleanup script to remove duplicates
2. Add unique constraints to prevent future duplicates
3. Only run ONE population script in the future
