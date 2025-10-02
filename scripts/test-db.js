const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('Testando conexão com Supabase...');

    // Tenta listar tabelas do schema public
    const { data, error } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.log('❌ Tabela profiles não existe ainda. Erro:', error.message);
      console.log('📄 Execute as migrações no Supabase Dashboard primeiro!');
    } else {
      console.log('✅ Conexão com Supabase funcionando!');
      console.log('✅ Tabela profiles existe!');
    }

    // Testa autenticação básica
    const { data: authData, error: authError } = await supabase.auth.getSession();

    if (authError) {
      console.log('❌ Erro na autenticação:', authError.message);
    } else {
      console.log('✅ Sistema de autenticação funcionando!');
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testConnection();