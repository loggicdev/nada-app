import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/database';
import { useAuth } from './useAuth';

type Message = Database['public']['Tables']['messages']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'] & {
  match?: Database['public']['Tables']['matches']['Row'] & {
    user_profile?: Database['public']['Tables']['user_profiles']['Row'];
  };
  last_message?: Message;
  unread_count?: number;
};

export function useRealtimeMessages(conversationId?: string) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregar mensagens iniciais
  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('sent_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    loadMessages();
  }, [conversationId]);

  // Subscrever a mudanças em tempo real
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages((prev) =>
            prev.map((msg) => (msg.id === updatedMessage.id ? updatedMessage : msg))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const sendMessage = useCallback(
    async (content: string, messageType: 'text' | 'image' = 'text') => {
      if (!conversationId || !user?.id) return null;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content,
          message_type: messageType,
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        return null;
      }

      // Atualizar updated_at da conversa
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      return data;
    },
    [conversationId, user?.id]
  );

  const markAsRead = useCallback(
    async (messageId: string) => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .is('read_at', null);

      if (error) {
        console.error('Erro ao marcar mensagem como lida:', error);
      }
    },
    []
  );

  return {
    messages,
    loading,
    sendMessage,
    markAsRead,
  };
}

export function useConversations() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const loadConversationsRef = useRef<(() => Promise<void>) | null>(null);

  // Carregar conversas
  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    console.log('🔄 [loadConversations] Carregando conversas para user:', user.id);
    setLoading(true);

    try {
      // Buscar todas as conversas do usuário através dos matches
      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          conversations (*)
        `)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'mutual')
        .order('matched_at', { ascending: false });

      if (matchesError) {
        console.error('❌ [loadConversations] Erro ao carregar conversas:', matchesError);
        setLoading(false);
        return;
      }

      console.log(`📊 [loadConversations] Encontrados ${matches?.length || 0} matches`);

      // Processar conversas
      const conversationsData: Conversation[] = [];

      for (const match of matches || []) {
        const conversation = (match as any).conversations?.[0];
        if (!conversation) continue;

        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

        // Buscar perfil do outro usuário
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        // Buscar última mensagem
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversation.id)
          .order('sent_at', { ascending: false })
          .limit(1)
          .single();

        // Contar mensagens não lidas
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversation.id)
          .neq('sender_id', user.id)
          .is('read_at', null);

        conversationsData.push({
          ...conversation,
          match: {
            ...match,
            user_profile: profile || undefined,
          },
          last_message: lastMessage || undefined,
          unread_count: unreadCount || 0,
        });
      }

      // Ordenar por última mensagem
      conversationsData.sort((a, b) => {
        const dateA = a.last_message?.sent_at || a.updated_at || '';
        const dateB = b.last_message?.sent_at || b.updated_at || '';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      console.log(`✅ [loadConversations] Processadas ${conversationsData.length} conversas`);
      setConversations(conversationsData);
    } catch (error) {
      console.error('❌ [loadConversations] Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Guardar referência para usar no Realtime
  loadConversationsRef.current = loadConversations;

  // Carregar conversas inicial
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscrever a mudanças em conversas e mensagens
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 [useConversations] Iniciando subscrições Realtime');

    // Canal unificado para ouvir mudanças em conversas, mensagens e matches
    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
        },
        (payload) => {
          console.log('💬 [Realtime] Conversa alterada:', payload.eventType, payload.new);
          setTimeout(() => loadConversationsRef.current?.(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('📨 [Realtime] Mensagem alterada:', payload.eventType);
          setTimeout(() => loadConversationsRef.current?.(), 100);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          const match = payload.new as any;
          // Só recarregar se for um match do usuário atual
          if (match?.user1_id === user.id || match?.user2_id === user.id) {
            console.log('🎯 [Realtime] Match alterado:', payload.eventType);
            setTimeout(() => loadConversationsRef.current?.(), 100);
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 [useConversations] Status do canal:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [useConversations] Subscrição Realtime ativa');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ [useConversations] Erro na subscrição');
        }
      });

    return () => {
      console.log('🔕 [useConversations] Removendo subscrição');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    conversations,
    loading,
    refresh: loadConversations,
  };
}
