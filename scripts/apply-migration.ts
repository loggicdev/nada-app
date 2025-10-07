import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationPath = path.join(__dirname, '../supabase/migrations/20251007000000_create_user_actions.sql');
  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('Aplicando migration...');
  console.log(sql);
  console.log('\nPor favor, execute este SQL manualmente no Dashboard do Supabase:');
  console.log('https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/editor/sql');
}

applyMigration();
