import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Força limpeza total e reinício do app (AUTOMÁTICO)
 */
export async function forceAuthReset() {
  console.log('🔄 Forçando reset AUTOMÁTICO de autenticação...');
  
  try {
    // 1. Limpar TODAS as chaves do AsyncStorage
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      if (allKeys.length > 0) {
        await AsyncStorage.multiRemove(allKeys);
        console.log(`✅ Removidas ${allKeys.length} chaves do AsyncStorage`);
      }
    } catch (error) {
      console.log('⚠️ Erro ao limpar AsyncStorage:', error instanceof Error ? error.message : String(error));
    }
    
    // 2. Forçar o cliente Supabase a esquecer a sessão (tentar signOut novamente)
    try {
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ Logout global realizado');
    } catch (error) {
      console.log('⚠️ Erro no logout:', error instanceof Error ? error.message : String(error));
    }
    
    // 3. Aguardar um pouco
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 4. Tentar recarregar o app
    if (__DEV__) {
      console.log('🔄 Tentando recarregar app...');
      try {
        const DevSettings = require('react-native').DevSettings;
        if (DevSettings && DevSettings.reload) {
          DevSettings.reload();
        } else {
          console.log('⚠️ DevSettings.reload não disponível. Reinicie o app manualmente.');
        }
      } catch (reloadError) {
        console.log('⚠️ Não foi possível recarregar:', reloadError);
        console.log('🔄 Reinicie o app manualmente (feche e reabra).');
      }
    }
    
    console.log('✅ Reset automático concluído');
    return true;
  } catch (error) {
    console.error('❌ Erro no reset automático:', error);
    return false;
  }
}

/**
 * Função para debug - listar todas as chaves do AsyncStorage
 */
export async function debugAsyncStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const values = await AsyncStorage.multiGet(keys);
    
    console.log('📱 Conteúdo do AsyncStorage:');
    console.log(`📊 Total de chaves: ${keys.length}`);
    
    values.forEach(([key, value]) => {
      if (key.includes('supabase') || key.includes('sb-') || key.includes('auth') || key.includes('expo')) {
        const displayValue = value ? `${value.substring(0, 100)}${value.length > 100 ? '...' : ''}` : 'null';
        console.log(`  🔑 ${key}: ${displayValue}`);
      }
    });
    
    // Mostrar informações básicas do debug
    console.log('📱 Debug de Cache de Autenticação concluído');
    
    return values;
  } catch (error) {
    console.error('❌ Erro ao debug AsyncStorage:', error);
    return [];
  }
}