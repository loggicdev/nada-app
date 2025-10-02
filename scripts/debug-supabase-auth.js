const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjc1NTM1NDQsImV4cCI6MjA0MzEyOTU0NH0.BsXMTpOB9yLU8M4y6Ol5B7RxDrFxr8ZtRkSv4WPV7tE';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugAuth() {
  console.log('🔍 Testando configurações de autenticação...\n');

  // Test 1: Conexão básica
  console.log('1. Testando conexão básica...');
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.log('❌ Erro na conexão:', error.message);
    } else {
      console.log('✅ Conexão OK - Sessão atual:', data.session ? 'Logado' : 'Não logado');
    }
  } catch (err) {
    console.log('❌ Erro de conexão:', err.message);
  }

  // Test 2: Tentar signup com email de teste
  console.log('\n2. Testando signup...');
  try {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'teste123456';

    console.log(`Tentando criar conta com: ${testEmail}`);

    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
    });

    if (error) {
      console.log('❌ Erro no signup:', error.message);
      console.log('📋 Status:', error.status);
      console.log('📋 Code:', error.__isAuthError ? 'Auth Error' : 'Other Error');

      if (error.message.includes('Invalid API key')) {
        console.log('\n💡 SOLUÇÃO POSSÍVEL:');
        console.log('- Verifique se o signup está habilitado no Supabase Dashboard');
        console.log('- Acesse: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/auth/users');
        console.log('- Vá em "Settings" → "Authentication" → "Enable email confirmations"');
      }
    } else {
      console.log('✅ Signup funcionou!');
      console.log('👤 Usuário criado:', data.user ? data.user.email : 'Sem dados');
      console.log('🎫 Sessão criada:', data.session ? 'Sim' : 'Não');
    }
  } catch (err) {
    console.log('❌ Erro inesperado no signup:', err.message);
  }

  // Test 3: Verificar URL e chaves
  console.log('\n3. Verificando configurações...');
  console.log('🔗 URL:', supabaseUrl);
  console.log('🔑 Anon Key válida:', supabaseAnonKey.length > 100 ? 'Sim' : 'Não');

  // Decode JWT to check expiration
  try {
    const payload = JSON.parse(Buffer.from(supabaseAnonKey.split('.')[1], 'base64').toString());
    const now = Math.floor(Date.now() / 1000);
    const isExpired = payload.exp < now;

    console.log('⏰ Token expira em:', new Date(payload.exp * 1000).toLocaleString());
    console.log('⏰ Token expirado:', isExpired ? '❌ Sim' : '✅ Não');
    console.log('🏗️ Projeto:', payload.ref);
    console.log('👤 Papel:', payload.role);
  } catch (err) {
    console.log('❌ Erro ao decodificar token');
  }

  console.log('\n📋 DIAGNÓSTICO COMPLETO');
  console.log('=====================================');
  console.log('Se o signup não funcionar:');
  console.log('1. Execute as migrações SQL primeiro');
  console.log('2. Verifique configurações de Auth no Dashboard');
  console.log('3. Verifique se email confirmations estão configurados');
}

debugAuth().catch(console.error);