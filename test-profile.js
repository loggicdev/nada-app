import { supabase } from '../lib/supabase';

export async function testProfileCreation() {
  try {
    // Simular criação de usuário
    const testUserId = '550e8400-e29b-41d4-a716-446655440000';

    console.log('Testando criação de perfil...');

    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: testUserId,
        name: null,
        age: null,
        gender: null,
        looking_for: null
      });

    if (error) {
      console.error('Erro ao criar perfil:', error);
      return false;
    } else {
      console.log('Perfil criado com sucesso:', data);
      return true;
    }
  } catch (err) {
    console.error('Erro inesperado:', err);
    return false;
  }
}