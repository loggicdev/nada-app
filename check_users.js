const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url');

  if (error) {
    console.log('Erro:', error.message);
    return;
  }

  console.log('Total de usuários:', data.length);
  console.log('Usuários sem avatar:', data.filter(u => !u.avatar_url).length);
  console.log('Primeiros 5 usuários:');
  data.slice(0, 5).forEach(u => console.log(' -', u.name, ':', u.avatar_url || 'sem avatar'));
}

checkUsers();