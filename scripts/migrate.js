const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  try {
    const migrationFile = path.join(__dirname, '../supabase/migrations/001_create_profile_tables.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    console.log('Executando migração...');

    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Erro na migração:', error);
    } else {
      console.log('Migração executada com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao executar migração:', error);
  }
}

runMigrations();