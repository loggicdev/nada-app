const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If no service key, try with anon key (limited permissions)
const supabaseKey = supabaseServiceKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

const supabase = createClient(supabaseUrl, supabaseKey);

// Your exact SQL from the request
const onboardingSQL = `
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  bio TEXT,
  location TEXT,
  gender TEXT CHECK (gender IN ('feminine', 'masculine', 'non-binary')),
  looking_for TEXT CHECK (looking_for IN ('women', 'men', 'everyone')),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal TEXT CHECK (goal IN ('dating', 'serious', 'marriage', 'friendship')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal)
);

-- Create astrological_profiles table
CREATE TABLE IF NOT EXISTS astrological_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  zodiac_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_place TEXT,
  personality_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lifestyle_preferences table
CREATE TABLE IF NOT EXISTS lifestyle_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alcohol TEXT CHECK (alcohol IN ('never', 'socially', 'regularly')),
  smoking TEXT CHECK (smoking IN ('never', 'socially', 'regularly')),
  exercise TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own astrological profile" ON astrological_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lifestyle preferences" ON lifestyle_preferences FOR ALL USING (auth.uid() = user_id);
`;

async function executeOnboardingTables() {
  console.log('🚀 Starting Onboarding System Tables Creation');
  console.log('================================================');

  if (supabaseServiceKey) {
    console.log('✅ Using Service Role Key - Full Permissions');
  } else {
    console.log('⚠️  Using Anonymous Key - Limited Permissions');
    console.log('   If this fails, you need to set SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  console.log('');

  try {
    // Method 1: Try using exec_sql RPC function
    console.log('📡 Attempting to execute SQL via RPC...');
    const { error } = await supabase.rpc('exec_sql', { sql: onboardingSQL });

    if (error) {
      console.log('❌ RPC execution failed:', error.message);
      console.log('');

      // Method 2: Try executing individual table checks
      console.log('🔍 Falling back to table verification...');
      await verifyTables();
    } else {
      console.log('✅ SQL executed successfully via RPC!');
      console.log('');
      await verifyTables();
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
    console.log('');

    // Still try to verify what exists
    await verifyTables();
  }
}

async function verifyTables() {
  const tables = [
    'profiles',
    'user_interests',
    'user_goals',
    'astrological_profiles',
    'lifestyle_preferences'
  ];

  console.log('📋 VERIFICATION REPORT:');
  console.log('======================');

  const results = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ Table '${table}': Does not exist`);
          results[table] = 'MISSING';
        } else {
          console.log(`⚠️  Table '${table}': ${error.message}`);
          results[table] = 'ERROR';
        }
      } else {
        console.log(`✅ Table '${table}': Exists and accessible`);
        results[table] = 'EXISTS';
      }
    } catch (err) {
      console.log(`❌ Table '${table}': Exception - ${err.message}`);
      results[table] = 'EXCEPTION';
    }
  }

  console.log('');
  console.log('📊 SUMMARY:');
  console.log('===========');

  const existingTables = Object.values(results).filter(status => status === 'EXISTS').length;
  const totalTables = tables.length;

  console.log(`Tables Created: ${existingTables}/${totalTables}`);

  if (existingTables === totalTables) {
    console.log('🎉 All onboarding system tables are ready!');
  } else {
    console.log('');
    console.log('⚠️  MANUAL ACTION REQUIRED:');
    console.log('==========================');
    console.log('Some tables are missing. Please execute the SQL manually:');
    console.log('');
    console.log('1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj');
    console.log('2. Navigate to "SQL Editor"');
    console.log('3. Copy and paste the SQL from this script');
    console.log('4. Click "Run"');
    console.log('');
    console.log('Or use the existing migration file:');
    console.log('   supabase/migrations/001_create_profile_tables.sql');
  }

  return results;
}

// Execute the script
executeOnboardingTables().then(() => {
  console.log('');
  console.log('🏁 Script execution completed.');
}).catch(err => {
  console.error('💥 Script failed:', err);
  process.exit(1);
});