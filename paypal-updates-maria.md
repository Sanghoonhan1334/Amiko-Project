# PayPal Payment System Updates - Maria

## Overview
This document outlines the comprehensive PayPal payment system implementation for the Amiko project, including all changes, features, and database migration procedures.

**Current Status**: ✅ Production Ready with manual status updates (webhook integration pending PayPal dashboard configuration)

## 📅 Implementation Timeline
- **Date**: December 13, 2025
- **Version**: v1.3.1 (Payment History + Pending Status Display)
- **Status**: Production Ready (Manual Status Updates)
- **Developer**: Global Dv, Maria Arevalo


## 🎯 What Was Implemented

### 1. Payment System Architecture
- **Multi-Product Support**: Coupons, VIP Subscriptions, and Online Lectures
- **PayPal Integration**: Complete payment processing with webhooks
- **Database Schema**: Comprehensive tables for all payment types
- **Security**: Row Level Security (RLS) policies
- **Automation**: Triggers for automatic updates and participant counting

### 2. UI/UX Improvements (v1.2)
- **Consistent Layout**: All payment cards now have uniform description heights
- **Dropdown-Based Selection**: Clean dropdown interfaces for all product categories
- **Default Descriptions**: Placeholder descriptions shown when no option is selected
- **Visual Hierarchy**: Improved spacing and alignment across all payment options
- **Responsive Design**: Better mobile and desktop experience

### 3. Payment History Display (v1.3.1)
- **Shows All Transactions**: Displays both paid and pending purchases
- **Status Indicators**: Visual badges showing payment status (완료/처리중)
- **Grouped by Product Type**: Clean organization by coupons, VIP subscriptions, and courses
- **Real-time Data**: Uses React Query for automatic updates and caching
- **Enhanced UX**: Users can see all their payment attempts and current status
- **Loading States**: Proper loading indicators while fetching data

### 4. Manual Status Management (v1.3)
- **Current Limitation**: Payment status updates require manual database intervention
- **Webhook Code Ready**: Handler exists but not configured in PayPal dashboard
- **SQL Commands**: Documented procedures for manual status updates

### 3. Product Categories

#### 🏷️ Sistema de Cupones (Coupon System)
- **20 minutes**: $1.99 (1 coupon)
- **100 minutes**: $9.45 (1 coupon)
- **200 minutes**: $17.90 (1 coupon)
- **400 minutes**: $33.80 (1 coupon)
- **Features**: Automatic coupon creation, expiration management

#### 👑 VIP Subscription System
- **Monthly**: $30 (1 month access)
- **Yearly**: $300 (12 months access)
- **Lifetime**: $1000 (permanent access)
- **Features**: Auto-renewal, feature management, subscription history

#### 📚 Online Courses/Lectures
- **Course 1**: $55 - Korean Culture Basics (10 participants max)
- **Course 2**: $75 - Advanced Korean (8 participants max)
- **Course 3**: $65 - K-Pop & Entertainment (12 participants max)
- **Features**: Enrollment tracking, capacity management, instructor assignment

## 🗄️ Database Changes

### Tables Created/Updated

#### 1. Purchases Table (Enhanced)
```sql
ALTER TABLE public.purchases
ADD CONSTRAINT purchases_product_type_check
CHECK (product_type IN ('coupon', 'vip_subscription', 'lecture'));

-- Added columns:
- product_data JSONB DEFAULT '{}'  -- Product-specific data
- paypal_data JSONB               -- PayPal response data
```

#### 2. Lectures Table (New)
```sql
CREATE TABLE public.lectures (
    id UUID PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price_usd NUMERIC(10, 2) NOT NULL,
    price_krw NUMERIC(10, 2),
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    instructor_id UUID REFERENCES users(id),
    schedule_date TIMESTAMP WITH TIME ZONE,
    status TEXT CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Lecture Enrollments Table (New)
```sql
CREATE TABLE public.lecture_enrollments (
    id UUID PRIMARY KEY,
    lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    purchase_id UUID REFERENCES purchases(id) ON DELETE SET NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('enrolled', 'attended', 'absent', 'cancelled'))
);
```

#### 4. VIP Subscriptions Table (New)
```sql
CREATE TABLE public.vip_subscriptions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT CHECK (plan_type IN ('monthly', 'yearly', 'lifetime')),
    status TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'suspended')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE,
    price NUMERIC(10, 2) NOT NULL,
    payment_method TEXT,
    features JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. VIP Features Table (New)
```sql
CREATE TABLE public.vip_features (
    id UUID PRIMARY KEY,
    feature_key TEXT UNIQUE NOT NULL,
    feature_name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE
);
```

#### 6. Coupons Table (Enhanced)
```sql
-- Added columns:
ALTER TABLE public.coupons ADD COLUMN source TEXT DEFAULT 'purchase';
ALTER TABLE public.coupons ADD COLUMN description TEXT;
```

### Indexes Created
- Performance indexes on all foreign keys
- GIN indexes for JSONB columns
- Composite indexes for common queries
- Status and date-based indexes

### Security Policies (RLS)
- Users can only view their own purchases, subscriptions, coupons
- Public read access for lectures and VIP features
- Proper cascading deletes and data isolation

### Triggers and Functions
- **Participant Counter**: Automatic lecture participant counting
- **Timestamp Updates**: Automatic `updated_at` column updates
- **VIP History Tracking**: Subscription status change logging

## 🔧 How to Apply Database Changes

### Method 1: Supabase Dashboard (Recommended)
1. **Access SQL Editor**:
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor" in the left sidebar

2. **Run the Migration Script**:
   - Copy the entire contents of `update-payment-system-tables.sql`
   - Paste into the SQL Editor
   - Click "Run" to execute

3. **Verify Success**:
   - Check the results panel for any errors
   - Run verification queries (see below)

### Method 2: Supabase CLI
```bash
# If using CLI
supabase db push

# Or reset and apply all migrations
supabase db reset
```

### Method 3: Direct PostgreSQL
```bash
# Using psql
psql -h your-db-host -U your-username -d your-database -f update-payment-system-tables.sql
```

## ✅ Verification Queries

Run these queries after migration to verify everything is working:

### Check Table Existence
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'vip_features', 'vip_subscription_history', 'coupons', 'coupon_usage');
```

### Check RLS Status
```sql
SELECT schemaname, tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'coupons');
```

### Check Product Types
```sql
SELECT DISTINCT product_type FROM purchases;
```

### Check Sample Data
```sql
-- Check lectures
SELECT title, price_usd, max_participants, current_participants FROM lectures;

-- Check VIP features
SELECT feature_key, feature_name, is_active FROM vip_features;
```

## 🚀 API Integration

### PayPal API Routes

#### 1. Create Order (`/api/paypal/create-order`)
- **Purpose**: Initiates PayPal payment
- **Input**: `amount`, `orderId`, `userId`, `productType`, `productData`
- **Output**: PayPal order ID and purchase record ID
- **Creates**: Purchase record with 'pending' status

#### 2. Approve Order (`/api/paypal/approve-order`)
- **Purpose**: Completes payment and fulfills products
- **Input**: PayPal order ID
- **Output**: Success confirmation with product type
- **Actions**:
  - Updates purchase status to 'paid'
  - Creates coupons for coupon purchases
  - Creates VIP subscriptions
  - Creates lecture enrollments

### Frontend Components

#### PayPalPaymentButton Component
```tsx
<PayPalPaymentButton
  amount={option.amount}
  orderId={option.orderId}
  orderName={option.orderName}
  customerName={user?.user_metadata?.full_name || user?.email}
  customerEmail={user?.email}
  userId={user?.id}
  productType={option.productType}
  productData={option.productData}
  className="w-full"
/>
```

#### PaymentsTab Component
- Displays all payment options in organized sections with consistent card layouts
- Handles user authentication checks
- Integrates with PayPal buttons
- Supports Korean and Spanish translations
- **New in v1.2**: Consistent description containers with minimum height, default placeholder descriptions, and improved visual alignment
- **New in v1.3**: Payment history display showing all paid purchases grouped by product type

#### Payment History Feature
- **Location**: PaymentsTab component, bottom section
- **Functionality**: Displays all user's purchases (both paid and pending) grouped by product type
- **Data Source**: `purchases` table with `status IN ('paid', 'pending')`
- **Grouping**: 
  - Coupons (`product_type = 'coupon'`)
  - VIP Subscriptions (`product_type = 'vip_subscription'`)
  - Lectures/Courses (`product_type = 'lecture'`)
- **Display**: Purchase date, amount, order ID, and product information
- **Status Indicators**: Green "완료" badge for paid, yellow "처리중" badge for pending
- **Real-time**: Uses React Query for automatic updates

### Current Status: Manual Payment Updates
⚠️ **Important Note**: Payment status updates are currently **manual** because PayPal webhooks are not configured in production.

**Current Flow**:
1. User completes PayPal payment
2. PayPal processes payment successfully
3. Purchase record created with `status = 'pending'`
4. **Manual step required**: Admin must manually update status to `'paid'` in database
5. Payment history will then show the purchase

**To manually update a purchase status**:
```sql
UPDATE purchases 
SET status = 'paid', updated_at = NOW() 
WHERE status = 'pending' 
AND payment_id = 'YOUR_PAYMENT_ID_HERE';
```

**Webhook Implementation Status**:
- ✅ Webhook handler code exists (`/api/paypal/webhook/route.ts`)
- ✅ Handles `PAYMENT.CAPTURE.COMPLETED` events
- ✅ Automatically updates purchase status to `'paid'`
- ❌ Not configured in PayPal Developer Dashboard
- ❌ Webhook URL not set in production environment

## 🌐 Translation Support

### Languages Supported
- **Korean (ko)**: Complete translations for all payment options
- **Spanish (es)**: Complete translations for all payment options
- **English (en)**: Default/fallback language

### Translation Keys Added
```typescript
// Korean translations
'payments.coupon20min': '쿠폰 시스템 - 20분',
'payments.vipMonthly': 'VIP 월간 구독',
'payments.course1': '한국 문화 기초 강의',

// Spanish translations
'payments.coupon20min': 'Sistema de Cupones - 20 Minutos',
'payments.vipMonthly': 'Suscripción VIP Mensual',
'payments.course1': 'Curso Básico de Cultura Coreana',
```

## 🔒 Security Features

### Row Level Security (RLS)
- **Purchases**: Users can only see their own purchases
- **Subscriptions**: Users can only see their own subscriptions
- **Coupons**: Users can only see their own coupons
- **Enrollments**: Users can only see their own enrollments

### Data Validation
- **Product Types**: Strict CHECK constraints
- **Foreign Keys**: Proper referential integrity
- **Amount Validation**: Numeric constraints on prices
- **Status Validation**: Controlled vocabularies for status fields

## 🐛 Troubleshooting

### Common Issues

#### 1. UUID Casting Error
**Error**: `column "instructor_id" is of type uuid but expression is of type text`
**Solution**: Script now uses `NULL::uuid` for proper type casting

#### 2. UI Layout Issues (v1.2)
**Issue**: Inconsistent description heights across payment cards
**Solution**: Implemented `min-h-[3rem]` containers and default descriptions for uniform alignment

#### 3. Permission Errors
**Error**: `permission denied for table`
**Solution**: Ensure you're running as database admin or have proper privileges

#### 3. RLS Policy Conflicts
**Error**: `policy already exists`
**Solution**: Script drops existing policies before recreating them

#### 4. Transaction Failures
**Issue**: Script fails midway through execution
**Solution**: Script runs in transaction - either all succeeds or all fails. Re-run after fixing issues.

### Recovery Procedures

#### If Migration Fails:
1. Check Supabase logs for specific error messages
2. Verify database permissions
3. Ensure no conflicting table structures exist
4. Re-run the script (it's safe to re-run)

#### If Data Appears Incorrect:
1. Check verification queries above
2. Verify RLS policies are applied correctly
3. Check trigger functions are working
4. Review sample data insertion

## 📊 Monitoring and Maintenance

### Key Metrics to Monitor
- **Purchase Success Rate**: `SELECT status, COUNT(*) FROM purchases GROUP BY status;`
- **Popular Products**: `SELECT product_type, COUNT(*) FROM purchases GROUP BY product_type;`
- **Lecture Capacity**: `SELECT title, current_participants, max_participants FROM lectures;`
- **VIP Subscription Status**: `SELECT status, COUNT(*) FROM vip_subscriptions GROUP BY status;`
- **Pending Purchases**: `SELECT COUNT(*) FROM purchases WHERE status = 'pending';` (should be 0 when webhook is active)

### Regular Maintenance Tasks
1. **Clean up expired coupons**: Monthly cleanup of expired coupon records
2. **Monitor subscription renewals**: Check for subscriptions needing renewal
3. **Review failed payments**: Investigate and resolve failed payment records
4. **Update lecture schedules**: Keep course schedules current
5. **Check pending purchases**: When webhook is inactive, manually update completed payments

## 🎯 Testing the System

### Manual Testing Steps

1. **Test Payment Flow**:
   - Login as a user
   - Navigate to Payments tab
   - Select a payment option
   - Complete PayPal payment
   - Verify product fulfillment

2. **Test Different Product Types**:
   - Purchase coupons → Check coupon creation
   - Purchase VIP subscription → Check subscription creation
   - Purchase course → Check enrollment creation

3. **Test Capacity Limits**:
   - Fill a course to capacity
   - Attempt additional enrollment
   - Verify rejection

### Automated Testing
- API endpoint testing for PayPal routes
- Database constraint validation
- RLS policy verification
- Trigger function testing

## 🔧 Webhook Configuration (When Ready)

### PayPal Developer Dashboard Setup
1. **Access PayPal Developer Dashboard**: https://developer.paypal.com/
2. **Navigate to Webhooks**: Your App → Webhooks
3. **Add Webhook URL**: `https://yourdomain.com/api/paypal/webhook`
4. **Select Events**:
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `PAYMENT.CAPTURE.FAILED`
   - `PAYMENT.CAPTURE.CANCELLED`
5. **Save Configuration**

### Environment Variables Needed
```bash
# Add to your .env.local or production environment
PAYPAL_WEBHOOK_ID=your_webhook_id_from_paypal_dashboard
```

### Testing Webhook Integration
1. Complete a test payment
2. Check webhook logs in PayPal dashboard
3. Verify purchase status automatically updates to 'paid'
4. Confirm product fulfillment (coupons created, subscriptions activated, etc.)

## 🛠️ Manual Status Update Procedures

### For Production Support
When webhook is not configured, use these SQL commands to manually update purchase statuses:

```sql
-- Update specific purchase to paid
UPDATE purchases 
SET status = 'paid', updated_at = NOW() 
WHERE payment_id = 'PAYPAL_PAYMENT_ID_HERE';

-- Update all pending purchases to paid (use with caution)
UPDATE purchases 
SET status = 'paid', updated_at = NOW() 
WHERE status = 'pending';

-- Check purchase status
SELECT id, payment_id, order_id, status, product_type, amount, created_at 
FROM purchases 
WHERE user_id = 'USER_ID_HERE' 
ORDER BY created_at DESC;
```

### Troubleshooting Manual Updates
1. **Verify Payment ID**: Ensure the PayPal payment ID matches exactly
2. **Check User Permissions**: Only update purchases for the correct user
3. **Product Fulfillment**: After status update, manually create coupons/subscriptions if needed
4. **Audit Trail**: Always check the `updated_at` timestamp was modified

## 📈 Future Enhancements

### Planned Features
- **Webhook Integration**: Real-time payment status updates (code exists, needs PayPal dashboard configuration)
- **Refund System**: Automated refund processing
- **Subscription Management**: User dashboard for subscription control

### Scalability Considerations
- **Partitioning**: For large purchase tables
- **Caching**: For frequently accessed course data
- **Queue System**: For high-volume payment processing
- **Backup Strategy**: Regular database backups

## 📞 Support and Contact

### For Issues:
1. Check this documentation first
2. Review Supabase logs for errors
3. Run verification queries
4. Check recent fixes section

### Documentation Updates:
- Keep this document current with any schema changes
- Update verification queries as needed
- Document any new troubleshooting procedures

---

## 📋 Quick Reference

### Database Migration
```bash
# File: update-payment-system-tables.sql
# Run in: Supabase SQL Editor
# Expected runtime: 30-60 seconds
```

### Verification Commands
```sql
-- Quick check
SELECT COUNT(*) as tables_ready FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('purchases', 'lectures', 'lecture_enrollments', 'vip_subscriptions', 'coupons');
```

### Key Files Modified
- `database/update-payment-system-tables.sql` - Migration script
- `src/components/main/app/payments/PaymentsTab.tsx` - Frontend component (UI layout improvements in v1.2, payment history in v1.3)
- `src/components/payments/PayPalPaymentButton.tsx` - PayPal integration
- `src/app/api/paypal/create-order/route.ts` - Order creation API
- `src/app/api/paypal/approve-order/route.ts` - Payment approval API
- `src/app/api/paypal/webhook/route.ts` - Webhook handler (implemented but not configured)
- `src/lib/translations.ts` - Translation updates

**Last Updated**: December 13, 2025
**Version**: v1.3.1
**Status**: ✅ Production Ready (Manual Status Updates)</content>
<parameter name="filePath">/home/andres/vsCodeProjects/Amiko/Amiko-Project/paypal-updates-maria.md
