const https = require('https');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

async function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'zxdpgfndcgbidtnrrnwj.supabase.co',
      port: 443,
      path: endpoint,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase Database Status');
  console.log('====================================');

  const tables = ['profiles', 'user_interests', 'user_goals', 'astrological_profiles', 'lifestyle_preferences'];

  for (const table of tables) {
    try {
      console.log(`\n📋 Checking table: ${table}`);

      const response = await makeRequest(`/rest/v1/${table}?select=*&limit=0`);

      console.log(`   Status Code: ${response.statusCode}`);

      if (response.statusCode === 200) {
        console.log(`   ✅ Table '${table}' exists and is accessible`);
      } else if (response.statusCode === 404) {
        console.log(`   ❌ Table '${table}' does not exist`);
      } else if (response.statusCode === 401) {
        console.log(`   🔒 Table '${table}' - Authentication required`);
      } else if (response.statusCode === 403) {
        console.log(`   🚫 Table '${table}' - Access forbidden`);
      } else {
        console.log(`   ⚠️  Table '${table}' - Unexpected status: ${response.statusCode}`);
        console.log(`   Response: ${response.body.substring(0, 200)}`);
      }

    } catch (error) {
      console.log(`   ❌ Error checking table '${table}': ${error.message}`);
    }
  }

  // Check if we can access the auth system
  console.log(`\n🔐 Checking Authentication System`);
  try {
    const authResponse = await makeRequest('/auth/v1/settings');
    console.log(`   Auth Status Code: ${authResponse.statusCode}`);
    if (authResponse.statusCode === 200) {
      console.log(`   ✅ Authentication system is accessible`);
    }
  } catch (error) {
    console.log(`   ❌ Auth check failed: ${error.message}`);
  }

  // Final recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`==================`);
  console.log(`1. The tables need to be created through Supabase Dashboard`);
  console.log(`2. Go to: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj`);
  console.log(`3. Use SQL Editor to run the migration`);
  console.log(`4. Use the complete migration file: supabase/migrations/001_create_profile_tables.sql`);
  console.log(`5. Or run the specific onboarding SQL from the EXECUTAR_MIGRATIONS.md file`);
}

checkSupabaseStatus().catch(console.error);