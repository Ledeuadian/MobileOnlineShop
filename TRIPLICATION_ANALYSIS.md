# Triplication Issue Analysis Report

## Problem Statement
Products are appearing 3 times (triplication) in both the Grocery List and DTI SRP list components.

## Root Cause Analysis

### 1. Database Level Issues
**Problem**: The PRODUCT_TYPE table contains duplicate data from multiple SQL script executions.

**Evidence Found**:
- Multiple database population scripts exist:
  - `populate_product_types.sql` - Main population script (~119 products)
  - `batch_insert_products.sql` - Contains similar/duplicate data
  - `transfer_to_uppercase_table.sql` - Transfers data from another table

**Expected vs Actual**:
- Expected: ~119 unique products
- Actual: 359 products (roughly 3x the expected)

### 2. Application Level Issues
**Components Affected**:
1. **GroceryList.tsx**
   - Fetches: `SELECT productTypeId, Name, Brand, Variant, Unit FROM PRODUCT_TYPE`
   - Shows all duplicates in grocery list

2. **DTIDashboard.tsx** 
   - Fetches: `SELECT * FROM PRODUCT_TYPE`
   - Shows all duplicates in SRP pricing section

**Both components are correctly querying the database - the issue is that the database contains duplicate data.**

## Analysis of Query Patterns

### GroceryList Query:
```sql
SELECT productTypeId, Name, Brand, Variant, Unit 
FROM PRODUCT_TYPE 
ORDER BY Name ASC
```

### DTIDashboard Query:
```sql
SELECT * 
FROM PRODUCT_TYPE 
ORDER BY Name ASC
```

**Both queries fetch ALL records without any DISTINCT clause or deduplication.**

## Files Involved in the Issue

### Database Files:
1. `database/populate_product_types.sql` - Primary population script
2. `database/batch_insert_products.sql` - Secondary population script  
3. `database/transfer_to_uppercase_table.sql` - Transfer script from lowercase table

### Application Files:
1. `src/pages/GroceryList.tsx` - Line 67: `.from('PRODUCT_TYPE')`
2. `src/pages/DTIDashboard.tsx` - Line 316: `.from('PRODUCT_TYPE')`  
3. `src/utils/testProductTypes.ts` - Test utility

## Solution Strategies

### Immediate Fix (Database Cleanup):
1. Run duplicate analysis query
2. Remove duplicate records keeping only unique combinations
3. Add unique constraints to prevent future duplicates

### Application Level Safeguards:
1. Add DISTINCT clause to queries if unique records are needed
2. Implement client-side deduplication as backup
3. Add data validation before displaying

### Prevention:
1. Consolidate database population scripts
2. Add unique constraints: `UNIQUE (Name, Brand, Variant, Unit)`
3. Implement proper database seeding strategy

## Recommended Actions

1. **Immediate**: Run cleanup script to remove duplicates
2. **Short-term**: Add DISTINCT to queries or client-side deduplication  
3. **Long-term**: Implement proper database constraints and seeding strategy

## Files to Modify

### For Database Cleanup:
- Run: `database/cleanup_duplicates.sql`
- Run: `database/check_duplicates.sql` (for verification)

### For Application Safeguards:
- Modify: `src/pages/GroceryList.tsx` (add deduplication)
- Modify: `src/pages/DTIDashboard.tsx` (add deduplication)

### For Prevention:
- Consolidate: Database population scripts
- Add: Unique constraints to PRODUCT_TYPE table
