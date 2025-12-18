# Payment System Tables Update Guide

## Overview
This script (`update-payment-system-tables.sql`) updates your existing database tables to support the complete payment system including:

- **Purchases**: Enhanced with all product types (coupons, VIP subscriptions, lectures)
- **Lectures**: Online course management with enrollment tracking
- **VIP Subscriptions**: Subscription management with features and history
- **Coupons**: Enhanced coupon system with purchase integration

## What the Script Does

### 1. Updates Existing Tables
- Modifies `purchases` table to support all product types
- Adds missing columns (`product_data`, `paypal_data`) if needed
- Updates `coupons` table with new fields (`source`, `description`)

### 2. Creates New Tables (if they don't exist)
- `lectures`: Course information and scheduling
- `lecture_enrollments`: Student enrollments with purchase tracking
- `vip_subscriptions`: VIP subscription management
- `vip_features`: Available VIP features
- `vip_subscription_history`: Subscription status changes

### 3. Sets Up Security
- Enables Row Level Security (RLS) on all tables
- Creates appropriate access policies for users

### 4. Adds Automation
- Triggers for automatic participant counting in lectures
- Automatic timestamp updates
- History tracking for VIP subscriptions

### 5. Inserts Sample Data
- Sample lecture courses
- VIP feature definitions

## How to Run the Script

### Option 1: Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `update-payment-system-tables.sql`
4. Click "Run" to execute the script

### Option 2: Using Supabase CLI
```bash
supabase db push
# or if you have the SQL file in your migrations folder
supabase db reset
```

### Option 3: Using psql
```bash
psql -h your-db-host -U your-username -d your-database -f update-payment-system-tables.sql
```

## Verification

After running the script, verify the setup by running these queries in your SQL editor:

```sql
-- Check if all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'vip_features', 'vip_subscription_history', 'coupons', 'coupon_usage');

-- Check RLS status
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'coupons');

-- Check product types in purchases
SELECT DISTINCT product_type FROM purchases;
```

## Expected Results

After successful execution, you should have:

1. ✅ All payment-related tables created/updated
2. ✅ Proper indexes for performance
3. ✅ RLS policies for security
4. ✅ Triggers for automatic updates
5. ✅ Sample data for testing

## Troubleshooting

### If tables already exist with different schemas:
The script uses `IF NOT EXISTS` and `DO $$` blocks to safely handle existing tables without data loss.

### If you get permission errors:
Make sure you're running as a database admin or have the necessary privileges.

### If you get UUID casting errors:
The script now properly casts NULL values to UUID type for foreign key columns.

### If RLS policies conflict:
The script drops existing policies before recreating them.

### If the script fails midway:
The script runs in a transaction (`BEGIN`/`COMMIT`). If it fails, no changes will be applied. You can safely re-run it after fixing the issue.

## Next Steps

After running this script, your payment system should be fully functional. You can:

1. Test the PayPal integration with different product types
2. Verify that purchases create appropriate records
3. Check that enrollments and subscriptions are properly managed
4. Monitor the system using the verification queries above

## Recent Fixes

### v1.1 - UUID Casting Fix (2025-12-12)
- Fixed UUID type casting error when inserting NULL values into foreign key columns
- Added transaction wrapper (`BEGIN`/`COMMIT`) for atomic execution
- All NULL values for UUID columns now properly cast as `NULL::uuid`

### Known Issues Resolved
- ✅ `ERROR: 42804: column "instructor_id" is of type uuid but expression is of type text`
