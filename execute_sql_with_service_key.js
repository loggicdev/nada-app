const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';

// Check for service role key in environment or allow passing as argument
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

if (!serviceRoleKey) {
  console.log('🚨 ERROR: Service Role Key Required');
  console.log('=================================');
  console.log('');
  console.log('To execute the SQL directly, you need a service role key.');
  console.log('');
  console.log('Option 1: Set environment variable:');
  console.log('  export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"');
  console.log('  node execute_sql_with_service_key.js');
  console.log('');
  console.log('Option 2: Pass as argument:');
  console.log('  node execute_sql_with_service_key.js "your_service_role_key_here"');
  console.log('');
  console.log('Option 3: Manual execution (RECOMMENDED):');
  console.log('  1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/sql');
  console.log('  2. Copy content from: supabase_dashboard_onboarding_tables.sql');
  console.log('  3. Paste and execute in SQL Editor');
  console.log('');
  console.log('To get your service role key:');
  console.log('  1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/settings/api');
  console.log('  2. Copy the "service_role" key (NOT the anon key)');
  console.log('');
  process.exit(1);
}

console.log('🚀 Executing SQL with Service Role Key');
console.log('====================================');

// Create client with service role key
const supabase = createClient(supabaseUrl, serviceRoleKey);

// Read the SQL file
const sqlContent = fs.readFileSync(
  path.join(__dirname, 'supabase_dashboard_onboarding_tables.sql'),
  'utf8'
);

async function executeSQLScript() {
  try {
    console.log('📡 Executing SQL script...');

    // Split SQL into individual statements and execute them
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('SELECT'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec', { query: statement });

        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }

    console.log('');
    console.log('🔍 Verifying tables...');
    await verifyTables();

  } catch (error) {
    console.error('💥 Script execution failed:', error.message);
    console.log('');
    console.log('📋 FALLBACK: Manual Execution Required');
    console.log('====================================');
    console.log('1. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/sql');
    console.log('2. Copy content from: supabase_dashboard_onboarding_tables.sql');
    console.log('3. Paste and execute in SQL Editor');
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

  console.log('📋 VERIFICATION RESULTS:');
  console.log('========================');

  let successCount = 0;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: EXISTS and accessible`);
        successCount++;
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }

  console.log('');
  console.log(`📊 Results: ${successCount}/${tables.length} tables created successfully`);

  if (successCount === tables.length) {
    console.log('🎉 ALL ONBOARDING TABLES CREATED SUCCESSFULLY!');
  } else {
    console.log('⚠️  Some tables are missing - manual execution may be required');
  }
}

// Run the script
executeSQLScript();