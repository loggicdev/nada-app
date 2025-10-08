import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useAuth } from './useAuth';

type Match = Database['public']['Tables']['matches']['Row'] & {
  user_profile?: Database['public']['Tables']['user_profiles']['Row'];
};

export function useRealtimeMatches() {
  const { user } = useAuth();
  const [newMatch, setNewMatch] = useState<Match | null>(null);

  useEffect(() => {
    if (!user?.id) {
      console.log('🔕 [useRealtimeMatches] Usuário não encontrado, não criando subscrição');
      return;
    }

    console.log('🔔 [useRealtimeMatches] Iniciando subscrição para user:', user.id);

    // Callback para processar match
    const processMatch = async (match: Database['public']['Tables']['matches']['Row']) => {
      console.log('🔍 [processMatch] Processando match:', match);
      
      // Verificar se o usuário atual está envolvido no match
      if (match.user1_id !== user.id && match.user2_id !== user.id) {
        console.log('❌ [processMatch] Usuário não envolvido no match');
        return;
      }

      // Apenas mostrar se for mutual
      if (match.status !== 'mutual') {
        console.log('❌ [processMatch] Match não é mutual, status:', match.status);
        return;
      }

      console.log('🎉 [processMatch] Novo match mutual detectado!', match.id);

      // Buscar perfil do outro usuário
      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
      console.log('👤 [processMatch] Buscando perfil do outro usuário:', otherUserId);

      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', otherUserId)
        .single();

      if (error) {
        console.error('❌ [processMatch] Erro ao buscar perfil:', error);
        return;
      }

      console.log('✅ [processMatch] Perfil encontrado:', profile?.name);

      const matchData = {
        ...match,
        user_profile: profile || undefined,
      };

      console.log('📱 [processMatch] Definindo newMatch:', matchData);
      setNewMatch(matchData);
    };

    // Subscrição para novos matches em tempo real
    const channel = supabase
      .channel('matches-realtime-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          console.log('📡 [Realtime] Match inserido:', payload.new);
          const match = payload.new as Database['public']['Tables']['matches']['Row'];
          await processMatch(match);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        async (payload) => {
          console.log('📡 [Realtime] Match atualizado:', payload.new);
          const match = payload.new as Database['public']['Tables']['matches']['Row'];
          const oldMatch = payload.old as any;

          console.log('🔍 [Realtime] Old match status:', oldMatch?.status, '-> New status:', match.status);

          // Apenas notificar quando status mudar para mutual
          if (match.status === 'mutual') {
            // Se não temos old ou se old.status era diferente de mutual
            if (!oldMatch?.status || oldMatch.status !== 'mutual') {
              console.log('✅ [Realtime] Status mudou para mutual, processando...');
              await processMatch(match);
            } else {
              console.log('⚠️ [Realtime] Status já era mutual, ignorando');
            }
          } else {
            console.log('❌ [Realtime] Status não é mutual:', match.status);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [useRealtimeMatches] Status da subscrição:', status);
      });

    return () => {
      console.log('🔕 [useRealtimeMatches] Removendo subscrição');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const clearNewMatch = () => {
    console.log('🧹 [useRealtimeMatches] Limpando newMatch');
    setNewMatch(null);
  };

  console.log('🔄 [useRealtimeMatches] State atual - newMatch:', newMatch ? `${newMatch.id} (${newMatch.user_profile?.name})` : 'null');

  return { newMatch, clearNewMatch };
}
