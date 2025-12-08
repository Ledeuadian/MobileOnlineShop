# Store Verification Feature

## Overview
Implemented a comprehensive store verification system that blocks unverified stores from accessing the system until their BIR and DTI permits are approved by an admin.

## Changes Made

### 1. Database Schema
**File**: `database/add_verified_column.sql`
- Added `verified` column to `GROCERY_STORE` table (BOOLEAN, default: false)
- Added index for better query performance
- Includes comments for documentation

**To apply**: Run this SQL file in your Supabase SQL Editor

### 2. Store Dashboard (StoreDashboard.tsx)

#### Interface Updates
- Added `verified?: boolean` to `StoreInfo` interface
- Updated initial state to include `verified: false`

#### New State
- Added `isVerificationModalOpen` state for controlling the blocker modal

#### New Functions
- `handleSubmitVerification()`: Submits BIR and DTI permit numbers to database
  - Validates that both permits are filled
  - Updates GROCERY_STORE table with permit information
  - Shows success/error messages

#### Verification Blocker Modal
A modal that appears when `storeInfo.verified === false`:
- **Cannot be dismissed** (backdropDismiss={false})
- Displays alert icon with pulse animation
- Shows warning message about store not being visible
- Includes input fields for:
  - BIR Permit Number
  - DTI Permit Number
- "Get verified" button to submit permits for approval
- Styled to match the design mockup

#### Store Info Display
- Separated permits into their own card section
- "Permits" section appears at the top
- "Store Information" section below it
- Both show current permit values or "Not set"

### 3. Admin Dashboard (AdminDashboard.tsx)

#### Interface Updates
- Added `pendingStoreVerifications` to `DashboardStats` interface
- Added permit fields to `User` interface:
  - `bir_permit?: string`
  - `dti_permit?: string`
  - `verified?: boolean`
  - `store_id?: number`

#### New Statistics
- Query to count stores with permits but not verified
- Displayed in a new stats card on the dashboard

#### New Functions
- `fetchPendingVerifications()`: Retrieves stores awaiting verification
  - Filters for `verified = false`
  - Requires both BIR and DTI permits to be filled
  - Joins with USER table to get owner information
  
- `handleVerifyStore(storeId, approve)`: Approves or rejects store verification
  - Updates `verified` field in GROCERY_STORE table
  - Refreshes the pending list and dashboard stats
  - Shows success/error alerts

#### UI Updates
- New stats card: "Pending Store Verifications"
  - Shows count of stores awaiting approval
  - "Action Required" badge when count > 0
  - Clickable to open verification list
  
- Updated modal display:
  - Shows BIR and DTI permit numbers in expanded view
  - "Verify Store" button (green) to approve
  - "Reject" button (red outline) to reject
  - Only visible when viewing pending verifications

### 4. Styling (StoreDashboard.css)

#### New Styles
- `.verification-modal` styles for background
- `@keyframes pulse` animation for the alert icon
  - Scales from 1 to 1.1 and back
  - Opacity transitions for attention-grabbing effect
  - 2-second loop

## User Flow

### Store Owner Flow
1. Store owner logs in
2. If `verified = false`, blocker modal appears immediately
3. Owner cannot access any features except:
   - Viewing the verification message
   - Entering BIR Permit number
   - Entering DTI Permit number
   - Clicking "Get verified" button
4. After submitting permits, modal stays visible with message to wait for admin
5. Once admin verifies, `verified` becomes `true`
6. On next login/refresh, blocker disappears and full access is granted

### Admin Flow
1. Admin views dashboard
2. "Pending Store Verifications" card shows count
3. Click card to view list of stores awaiting verification
4. Expand each store to see:
   - Store name and contact details
   - BIR Permit number
   - DTI Permit number
5. Click "Verify Store" to approve → `verified = true`
6. Click "Reject" to deny → `verified = false` (permits stay for resubmission)

## Security Considerations
- Store owners can only update their own permit information
- Only admins can change the `verified` status
- Verification modal cannot be closed or bypassed
- All database queries use Supabase RLS policies

## Database Migration Required

Before this feature works, you must:
1. Run `database/add_verified_column.sql` in Supabase SQL Editor
2. Optionally set existing stores to unverified if needed
3. Ensure RLS policies allow:
   - Store owners to UPDATE their own GROCERY_STORE record (bir_permit, dti_permit)
   - Only admins to UPDATE the verified field
   - Store owners to SELECT their own store data

## Testing Checklist

### Store Owner Testing
- [ ] Unverified store shows blocker modal on login
- [ ] Cannot dismiss modal by clicking outside
- [ ] Can enter BIR permit number
- [ ] Can enter DTI permit number
- [ ] Submit button validates both fields are filled
- [ ] Success message appears after submission
- [ ] Modal remains after submission (waiting for admin)
- [ ] After admin approval, modal disappears
- [ ] Can access all features after verification

### Admin Testing
- [ ] Dashboard shows count of pending verifications
- [ ] Card is clickable and opens modal
- [ ] Modal lists all stores with permits but unverified
- [ ] Can expand each store to see details
- [ ] BIR and DTI permits are visible
- [ ] "Verify Store" button works and updates database
- [ ] "Reject" button works
- [ ] Count updates after approval/rejection
- [ ] Store list refreshes after action

## Future Enhancements
- Email notification to store owner when verified
- Ability to upload permit images/PDFs
- Permit expiration date tracking
- Verification history/audit log
- Bulk verification for multiple stores
- Rejection reason/notes field
