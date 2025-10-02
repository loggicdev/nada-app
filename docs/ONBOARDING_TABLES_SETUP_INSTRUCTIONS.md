# NADA App - Onboarding Tables Setup Instructions

## Overview

This document provides step-by-step instructions to create the onboarding system database tables for the NADA app using the Supabase Dashboard.

## Current Status

✅ **Database Connection**: Successfully connected to NADA project (zxdpgfndcgbidtnrrnwj)
❌ **Tables Status**: No onboarding tables found - manual creation required
✅ **SQL Scripts**: Ready for execution

## Required Tables

The onboarding system requires these 5 tables:

1. **`profiles`** - Basic user profile information
2. **`user_interests`** - User interests and hobbies
3. **`user_goals`** - Relationship goals and intentions
4. **`astrological_profiles`** - Zodiac and astrological information
5. **`lifestyle_preferences`** - Lifestyle choices (alcohol, smoking, exercise)

## Step-by-Step Instructions

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/sql
2. Navigate to the "SQL Editor" tab
3. Make sure you're logged into the correct account

### Step 2: Execute the SQL Script
1. Open the file: `supabase_dashboard_onboarding_tables.sql` (in this project root)
2. Copy the entire contents of the file
3. Paste it into the SQL Editor in Supabase Dashboard
4. Click the "Run" button to execute

### Step 3: Verify Table Creation
After running the SQL script, you should see output like:
```
Tables created successfully!
profile | EXISTS
user_interests | EXISTS
user_goals | EXISTS
astrological_profiles | EXISTS
lifestyle_preferences | EXISTS
```

### Step 4: Test the Setup
1. Run the verification script:
   ```bash
   node check_existing_tables.js
   ```
2. You should see: "🎉 ALL ONBOARDING TABLES EXIST"

## What the SQL Script Does

### 1. Creates Tables
- **profiles**: Main user profile with name, age, bio, location, gender preferences
- **user_interests**: Stores user interests with unique constraints
- **user_goals**: Relationship goals (dating, serious, marriage, friendship)
- **astrological_profiles**: Complete astrological information
- **lifestyle_preferences**: Personal lifestyle choices

### 2. Enables Row Level Security (RLS)
- Protects all tables with authentication-based access control
- Users can only access their own data (except viewing other profiles)

### 3. Creates Security Policies
- **Profiles**: Users can view all profiles, but only edit their own
- **Other tables**: Users can only manage their own data
- **Authentication**: All policies use `auth.uid()` for user identification

## Table Relationships

```
auth.users (Supabase Auth)
    ↓
profiles (id → auth.users.id)
    ↓
├── user_interests (user_id → profiles.id)
├── user_goals (user_id → profiles.id)
├── astrological_profiles (user_id → profiles.id)
└── lifestyle_preferences (user_id → profiles.id)
```

## Validation Constraints

### Gender Options
- `'feminine'`, `'masculine'`, `'non-binary'`

### Looking For Options
- `'women'`, `'men'`, `'everyone'`

### Goal Options
- `'dating'`, `'serious'`, `'marriage'`, `'friendship'`

### Lifestyle Options
- **Alcohol/Smoking**: `'never'`, `'socially'`, `'regularly'`
- **Exercise**: `'never'`, `'sometimes'`, `'regularly'`, `'daily'`

## Troubleshooting

### If Table Creation Fails
1. Check if you have the correct permissions
2. Ensure you're in the right project (zxdpgfndcgbidtnrrnwj)
3. Try running the script section by section

### If RLS Policies Fail
1. The script includes DROP POLICY statements to handle existing policies
2. If policies already exist with different names, manually drop them first

### If Verification Script Shows Errors
1. Make sure all tables were created successfully
2. Check that RLS is enabled properly
3. Verify the anonymous key has the correct permissions

## Files Created

- ✅ `/supabase_dashboard_onboarding_tables.sql` - Complete SQL script for manual execution
- ✅ `/check_existing_tables.js` - Verification script
- ✅ `/supabase/migrations/20250925000704_create_onboarding_tables.sql` - Migration file
- ✅ `/create_onboarding_tables.sql` - Original SQL commands
- ✅ `/verify_tables.sql` - Basic verification queries

## Next Steps After Setup

1. **Test Authentication**: Ensure users can create profiles
2. **Test Onboarding Flow**: Verify all tables work together
3. **Validate Constraints**: Test that check constraints work properly
4. **Security Testing**: Confirm RLS policies prevent unauthorized access

## Support

If you encounter issues:
1. Check the Supabase Dashboard logs
2. Verify your account permissions
3. Ensure the project reference ID is correct
4. Contact the development team with specific error messages

---

**Project**: NADA App
**Database**: Supabase (zxdpgfndcgbidtnrrnwj)
**Created**: September 24, 2025
**Status**: Ready for manual execution