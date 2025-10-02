import { useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

type Profile = Database['public']['Tables']['user_profiles']['Row'];

/**
 * Hook de autenticação - Gerencia sessão e perfil do usuário
 *
 * Arquitetura:
 * 1. Quando usuário faz signUp, trigger no DB cria perfil automaticamente
 * 2. Este hook apenas BUSCA o perfil (nunca cria)
 * 3. Profile é single source of truth para onboarding
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar perfil do usuário
  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    console.log('🔍 Buscando perfil para userId:', userId);

    // Tentar 3 vezes antes de desistir
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔍 Tentativa ${attempt}/3 de buscar perfil...`);

        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (error) {
          console.error(`❌ Erro na tentativa ${attempt}:`, error.message, error);
          if (attempt < 3) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          return null;
        }

        console.log('✅ Perfil carregado na tentativa', attempt, ':', {
          userId,
          step: data.onboarding_current_step,
          completed: data.onboarding_completed_at
        });

        return data;
      } catch (error) {
        console.error(`❌ Exception na tentativa ${attempt}:`, error);
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        return null;
      }
    }

    return null;
  }, []);

  // Inicializar auth state
  useEffect(() => {
    let mounted = true;

    console.log('🔧 useAuth: Inicializando...');

    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;

      console.log('🔧 useAuth: Sessão inicial carregada:', session?.user?.id ? 'com user' : 'sem user');

      setSession(session);
      setUser(session?.user ?? null);

      if (!session?.user) {
        setLoading(false);
      }
    });

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        console.log('🔐 Auth event:', event);

        setSession(session);
        setUser(session?.user ?? null);

        // NÃO fazer chamadas async aqui - causa deadlock!
        // Apenas atualizar o estado, o useEffect abaixo vai buscar o profile
        if (!session?.user) {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Buscar profile quando user mudar (SEPARADO do onAuthStateChange para evitar deadlock)
  useEffect(() => {
    if (!user) return;

    console.log('🔍 User mudou, buscando profile...');
    fetchProfile(user.id).then(profile => {
      console.log('✅ Profile carregado:', profile ? 'existe' : 'null');
      setProfile(profile);
      setLoading(false);
    });
  }, [user, fetchProfile]);

  // Atualizar perfil
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<Profile> => {
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('❌ Erro ao atualizar perfil:', error);
      throw error;
    }

    console.log('✅ Perfil atualizado:', updates);
    setProfile(data);
    return data;
  }, [user]);

  // Login
  const signIn = useCallback(async (email: string, password: string) => {
    console.log('🔐 Fazendo login...');
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('❌ Erro ao fazer login:', error);
      throw error;
    }

    console.log('✅ Login realizado:', data.user.id);
    return data;
  }, []);

  // Logout
  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Erro ao fazer logout:', error);
      throw error;
    }
    console.log('👋 Logout realizado');
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    signIn,
    updateProfile,
    signOut,
  };
}
