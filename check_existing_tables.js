const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
// Using the anonymous key for read-only operations
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkExistingTables() {
  console.log('🔍 Checking existing tables in NADA database');
  console.log('==============================================');

  const tables = [
    'profiles',
    'user_interests',
    'user_goals',
    'astrological_profiles',
    'lifestyle_preferences'
  ];

  const results = {};

  for (const tableName of tables) {
    try {
      // Try to query the table
      const { data, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist') || error.code === 'PGRST116') {
          console.log(`❌ ${tableName}: Table does not exist`);
          results[tableName] = 'MISSING';
        } else {
          console.log(`⚠️  ${tableName}: ${error.message}`);
          results[tableName] = 'ERROR';
        }
      } else {
        console.log(`✅ ${tableName}: Table exists and is accessible`);
        results[tableName] = 'EXISTS';
      }
    } catch (err) {
      console.log(`❌ ${tableName}: Exception - ${err.message}`);
      results[tableName] = 'EXCEPTION';
    }
  }

  console.log('\n📊 SUMMARY:');
  console.log('===========');

  const existing = Object.values(results).filter(status => status === 'EXISTS').length;
  const total = tables.length;

  console.log(`Existing tables: ${existing}/${total}`);

  if (existing === 0) {
    console.log('\n🚨 NO ONBOARDING TABLES FOUND');
    console.log('You need to create the tables manually in Supabase Dashboard');
    console.log('Use the file: supabase_dashboard_onboarding_tables.sql');
  } else if (existing === total) {
    console.log('\n🎉 ALL ONBOARDING TABLES EXIST');
    console.log('The onboarding system is ready to use!');
  } else {
    console.log('\n⚠️  PARTIAL SETUP DETECTED');
    console.log('Some tables exist but others are missing.');
    console.log('Please run the complete SQL script to ensure all tables are created.');
  }

  console.log('\n📋 NEXT STEPS:');
  console.log('==============');
  console.log('1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/sql');
  console.log('2. Copy the content from: supabase_dashboard_onboarding_tables.sql');
  console.log('3. Paste it into the SQL Editor');
  console.log('4. Click "Run" to execute');
  console.log('5. Run this script again to verify success');

  return results;
}

// Execute the check
checkExistingTables().then(() => {
  console.log('\n✅ Table check completed');
}).catch(err => {
  console.error('❌ Error checking tables:', err);
});