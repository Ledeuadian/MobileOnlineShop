# DTI Clarifications Feature - Database Setup

## Error Fix: Table 'DTI_CLARIFICATIONS' does not exist

You need to create the `DTI_CLARIFICATIONS` table in your Supabase database.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire content from `database/SETUP_DTI_CLARIFICATIONS.sql`
5. Paste it into the SQL editor
6. Click **Run** or press `Ctrl+Enter`
7. Wait for the success message

### Option 2: Using the original file

Alternatively, you can use the file: `database/create_dti_clarifications.sql`

## What this creates:

- **DTI_CLARIFICATIONS table** with columns:
  - clarificationId (Primary Key)
  - storeId (Foreign Key to GROCERY_STORE)
  - itemId (Foreign Key to ITEMS_IN_STORE)
  - dtiUserId (Foreign Key to USER)
  - title (Text)
  - message (Text)
  - attachmentUrl (Text, nullable)
  - status (pending/responded/resolved)
  - storeResponse (Text, nullable)
  - isRead (Boolean)
  - createdAt, updatedAt (Timestamps)

- **Indexes** for better query performance
- **Row Level Security (RLS) policies** for:
  - DTI users can view all clarifications
  - Store owners can view their own clarifications
  - DTI users can insert clarifications
  - Both DTI and stores can update clarifications

## Verification

After running the SQL, verify the table was created:

```sql
SELECT * FROM public."DTI_CLARIFICATIONS" LIMIT 1;
```

You should see an empty result (no rows) but no error.

## Next Steps

After creating the table, restart your application:

```bash
npm run start
```

The Notice of Clarification feature should now work without errors!
