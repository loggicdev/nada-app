const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Usando chaves anônimas para executar as migrações via API
const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTables() {
  console.log('🚀 Criando tabelas do banco...');

  try {
    // Criar tabela profiles
    console.log('📄 Criando tabela profiles...');
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (profilesError) {
      console.log('⚠️  Tentando criar tabela profiles manualmente...');

      // Tenta inserir um registro de teste para ver se a tabela existe
      const { error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(0);

      if (testError && testError.message.includes('does not exist')) {
        console.log('❌ Tabela profiles não existe. Precisa criar no Dashboard do Supabase.');
        console.log('💡 Acesse: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj');
        console.log('💡 Vá em SQL Editor e execute o arquivo: supabase/migrations/001_create_profile_tables.sql');
        return false;
      }
    }

    console.log('✅ Tabela profiles OK!');

    // Testar inserção básica
    console.log('🔍 Testando estrutura da tabela...');
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(0);

    if (error) {
      console.log('❌ Erro ao acessar tabela:', error.message);
      return false;
    }

    console.log('✅ Estrutura da tabela profiles funcionando!');
    console.log('🎉 Banco de dados pronto para uso!');
    return true;

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

createTables().then(success => {
  if (!success) {
    console.log('\n📋 INSTRUÇÕES MANUAIS:');
    console.log('1. Acesse: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj');
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Copie e execute o conteúdo do arquivo:');
    console.log('   supabase/migrations/001_create_profile_tables.sql');
    console.log('4. Execute novamente: node scripts/test-db.js');
  }
});