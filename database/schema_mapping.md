# Database Schema Mapping

## USER Table Column Structure

### Correct Column Mapping:
- `userId` (INTEGER, PRIMARY KEY, AUTO-INCREMENT) - Unique identifier for the USER table
- `auth_user_id` (UUID, FOREIGN KEY) - References `auth.users.id` from Supabase Auth
- `email` (TEXT, UNIQUE) - User's email address (used as lookup key)
- `firstname` (TEXT) - User's first name
- `lastname` (TEXT) - User's last name
- `contactNumber` (TEXT) - User's contact number
- `userTypeCode` (INTEGER) - References USER_TYPE table (1=Admin, 2=DTI, 3=Store)
- `approval_status` (TEXT) - Status: 'pending', 'approved', 'rejected'
- `created_at` (TIMESTAMP) - Record creation timestamp

### Fixed Issues:
1. **Registration Process**: Now correctly inserts `auth_user_id` (from Supabase Auth) instead of trying to set `userId` manually
2. **Auto-increment**: `userId` is now auto-generated as an integer primary key
3. **Foreign Key**: `auth_user_id` properly references `auth.users.id` for authentication linkage

### Lookup Strategy:
- **Primary Lookup**: Use `email` for all user operations (login checks, approval status, etc.)
- **Auth Integration**: Use `auth_user_id` when joining with Supabase Auth data
- **Store/Dashboard Operations**: Use `auth.users.id` directly for owner_id fields in related tables

### Related Tables:
- `GROCERY_STORE.owner_id` → References `auth.users.id` (not USER.userId)
- `ITEMS_IN_STORE` → Uses storeId from GROCERY_STORE table
