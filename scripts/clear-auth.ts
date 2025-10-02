/**
 * Script para limpar autenticação do AsyncStorage
 * Use quando deletar usuário do banco mas app ainda tem sessão
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export async function clearAuth() {
  try {
    console.log('🗑️ Limpando autenticação...');

    // Limpar todas as chaves do Supabase
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key =>
      key.startsWith('sb-') ||
      key.includes('supabase') ||
      key.includes('auth')
    );

    if (supabaseKeys.length > 0) {
      await AsyncStorage.multiRemove(supabaseKeys);
      console.log(`✅ Removidas ${supabaseKeys.length} chaves:`, supabaseKeys);
    }

    console.log('✅ Autenticação limpa!');
    console.log('🔄 Reinicie o app agora.');
  } catch (error) {
    console.error('❌ Erro ao limpar auth:', error);
  }
}

// Se executar direto
if (require.main === module) {
  clearAuth();
}
