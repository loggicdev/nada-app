const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://zxdpgfndcgbidtnrrnwj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4ZHBnZm5kY2diaWR0bnJybndqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDU3ODUsImV4cCI6MjA3MzUyMTc4NX0.69HHTmUZ98qD8xAI37a4lXmshyJcao3usDfd5BRKH50';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAuth() {
  console.log('🧹 Limpando cache de autenticação...');
  
  try {
    // Fazer logout
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
    } else {
      console.log('✅ Logout realizado com sucesso!');
    }
    
    // Verificar sessão
    const { data: { session } } = await supabase.auth.getSession();
    console.log('📊 Sessão após logout:', session ? 'AINDA EXISTE' : 'LIMPA ✅');
    
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

clearAuth();
