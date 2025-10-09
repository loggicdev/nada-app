import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '../types/database';

console.log('🔥 lib/supabase.ts CARREGADO - VERSÃO COM TIMEOUT');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Missing Supabase credentials in .env file');
}

// Guardar referência ao fetch original
const originalFetch = global.fetch;

// Custom fetch com timeout e retry para React Native
const fetchWithTimeout: typeof fetch = async (input, init?) => {
  const timeout = 30000; // 30 segundos
  const maxRetries = 2; // Máximo de 2 tentativas extras

  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

  // Log apenas requisições que não sejam de busca comum (reduzir spam)
  if (__DEV__ && !url.includes('/rest/v1/user_profiles') && !url.includes('/rest/v1/messages') && !url.includes('/rest/v1/matches')) {
    console.log('🌐 fetchWithTimeout chamado para:', url);
  }

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race([
        originalFetch(input, init),
        new Promise<Response>((_, reject) =>
          setTimeout(() => {
            // Log apenas timeouts críticos (não requisições comuns)
            if (__DEV__ && !url.includes('/rest/v1/user_profiles') && !url.includes('/rest/v1/messages') && !url.includes('/rest/v1/matches')) {
              console.log(`⏱️ TIMEOUT após 30s para (tentativa ${attempt + 1}):`, url);
            }
            reject(new Error(`Request timeout after 30s (attempt ${attempt + 1})`));
          }, timeout)
        ),
      ]);

      // Se chegou aqui, a requisição foi bem-sucedida
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        // Última tentativa falhou, rejeitar
        throw error;
      }

      // Aguardar com exponential backoff antes da próxima tentativa
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5s
      if (__DEV__) {
        console.log(`🔄 Retry em ${delay}ms para:`, url);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // Nunca deveria chegar aqui, mas TypeScript reclama
  throw new Error('Unexpected error in fetchWithTimeout');
};

// SUBSTITUIR o fetch global
global.fetch = fetchWithTimeout as any;
console.log('✅ Global fetch substituído com timeout');

console.log('🔧 Criando cliente Supabase');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('✅ Cliente Supabase criado');