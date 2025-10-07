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

// Custom fetch com timeout para React Native
const fetchWithTimeout: typeof fetch = (input, init?) => {
  const timeout = 30000; // 30 segundos (aumentado de 10s)

  const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);

  // Apenas log em desenvolvimento
  if (__DEV__) {
    console.log('🌐 fetchWithTimeout chamado para:', url);
  }

  return Promise.race([
    originalFetch(input, init),
    new Promise<Response>((_, reject) =>
      setTimeout(() => {
        if (__DEV__) {
          console.log('⏱️ TIMEOUT após 30s para:', url);
        }
        reject(new Error('Request timeout after 30s'));
      }, timeout)
    ),
  ]);
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