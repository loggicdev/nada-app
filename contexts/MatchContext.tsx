import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Match, MatchCandidate, MatchResult, Message, Conversation } from '@/types/user';
import { mockUsers, mockMatches, mockMessages, mockConversations } from '@/mocks/users';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/contexts/AuthContext';

interface MatchContextType {
  // Match candidates
  candidates: MatchCandidate[];
  currentCandidate: MatchCandidate | null;

  // Matches
  matches: Match[];

  // Conversations
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };

  // Actions
  likeUser: (userId: string) => Promise<MatchResult>;
  dislikeUser: (userId: string) => void;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'image') => void;
  addReaction: (messageId: string, emoji: string) => void;
  markAsRead: (conversationId: string) => void;
  getNextCandidate: () => void;
  loadCandidates: () => Promise<void>;
  loadConversations: () => Promise<void>;
  isLoading: boolean;
}

// Create initial candidates outside the hook to avoid recreation
const createInitialCandidates = (): MatchCandidate[] => mockUsers.map(user => ({
  ...user,
  distance: Math.round((Math.random() * 5 + 0.5) * 10) / 10, // Random distance 0.5-5.5km
  compatibilityScore: Math.floor(Math.random() * 15) + 85 // Random score 85-99%
}));

export const [MatchContext, useMatch] = createContextHook<MatchContextType>(() => {
  const { user, profile } = useAuthContext();
  const [candidates, setCandidates] = useState<MatchCandidate[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Candidatos disponíveis são todos os carregados (já filtrados do banco)
  const currentCandidate = candidates[0] || null;

  // Função para calcular compatibilidade simples (pode ser expandida futuramente)
  const calculateCompatibility = useCallback((candidate: any, candidateInterests: string[] = []): number => {
    if (!profile) return 0;

    let score = 50; // Base score

    // Compatibilidade por gênero/preferência (já filtrado, então +20)
    score += 20;

    // Compatibilidade por signo (exemplo simplificado)
    if (candidate.zodiac_sign === profile.zodiac_sign) {
      score += 10;
    }

    // Compatibilidade por interesses compartilhados
    // Buscar interesses do usuário atual (se disponível no contexto)
    // Por enquanto, vamos adicionar pontos baseado na quantidade de interesses
    if (candidateInterests.length > 0) {
      score += Math.min(10, candidateInterests.length * 2); // Até 10 pontos
    }

    // Compatibilidade por objetivos
    if (candidate.looking_for === profile.looking_for) {
      score += 5;
    }

    // Garantir que está entre 50 e 99
    return Math.min(99, Math.max(50, score));
  }, [profile]);

  // Função para buscar candidatos do banco
  const loadCandidates = useCallback(async () => {
    if (!user?.id || !profile) return;

    setIsLoading(true);
    try {
      // Buscar IDs de usuários que já tiveram ações (like/pass) e matches
      const [actionsResult, matchesResult] = await Promise.all([
        supabase
          .from('user_actions')
          .select('target_user_id')
          .eq('user_id', user.id),
        supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      ]);

      // IDs de usuários que já tiveram ação
      const actionedUserIds = new Set(
        actionsResult.data?.map((a: any) => a.target_user_id) || []
      );

      // IDs de usuários que já tiveram match
      const matchedUserIds = new Set(
        matchesResult.data?.map((m: any) =>
          m.user1_id === user.id ? m.user2_id : m.user1_id
        ) || []
      );

      // Combinar os dois sets
      const excludedUserIds = new Set([...actionedUserIds, ...matchedUserIds]);

      // Determinar quais gêneros buscar baseado na preferência do usuário
      let genderFilters: string[] = [];

      if (profile.looking_for === 'women') {
        genderFilters = ['feminine'];
      } else if (profile.looking_for === 'men') {
        genderFilters = ['masculine'];
      } else if (profile.looking_for === 'everyone') {
        genderFilters = ['feminine', 'masculine', 'non-binary'];
      }

      // Buscar usuários que:
      // 1. NÃO são o usuário atual
      // 2. Têm o gênero compatível com a preferência do usuário
      // 3. Têm preferência (looking_for) compatível com o gênero do usuário
      // 4. Têm foto
      // 5. NÃO estão na lista de excluídos (actions + matches)
      let query = supabase
        .from('user_profiles')
        .select('*')
        .neq('id', user.id)
        .not('avatar_url', 'is', null); // Apenas usuários com foto

      // Filtrar por gênero compatível com a preferência do usuário
      if (genderFilters.length > 0) {
        query = query.in('gender', genderFilters);
      }

      // Filtrar usuários que também estão interessados no gênero do usuário atual
      if (profile.gender) {
        if (profile.gender === 'feminine') {
          query = query.or('looking_for.eq.women,looking_for.eq.everyone');
        } else if (profile.gender === 'masculine') {
          query = query.or('looking_for.eq.men,looking_for.eq.everyone');
        } else if (profile.gender === 'non-binary') {
          query = query.eq('looking_for', 'everyone');
        }
      }

      // Excluir usuários que já tiveram ação ou match
      if (excludedUserIds.size > 0) {
        const excludedArray = Array.from(excludedUserIds);
        query = query.not('id', 'in', `(${excludedArray.join(',')})`);
      }

      const { data: profiles, error } = await query.limit(50);

      if (error) {
        console.error('Erro ao buscar candidatos:', error);
        return;
      }

      if (!profiles || profiles.length === 0) {
        setCandidates([]);
        return;
      }

      // Não precisa mais filtrar localmente - já foi filtrado no banco
      const filteredProfiles = profiles;

      if (filteredProfiles.length === 0) {
        setCandidates([]);
        return;
      }

      // Buscar TODOS os interesses de uma vez (batch query)
      const userIds = filteredProfiles.map((p: any) => p.id);
      const { data: allInterests } = await supabase
        .from('user_interests')
        .select('user_id, interest')
        .in('user_id', userIds);

      // Buscar TODAS as fotos de uma vez (batch query)
      const { data: allPhotos } = await supabase
        .from('user_photos')
        .select('user_id, photo_url, order_index')
        .in('user_id', userIds)
        .order('order_index', { ascending: true });

      // Agrupar interesses por user_id
      const interestsByUser = new Map<string, string[]>();
      allInterests?.forEach((item: any) => {
        if (!interestsByUser.has(item.user_id)) {
          interestsByUser.set(item.user_id, []);
        }
        interestsByUser.get(item.user_id)?.push(item.interest);
      });

      // Agrupar fotos por user_id
      const photosByUser = new Map<string, string[]>();
      allPhotos?.forEach((item: any) => {
        if (!photosByUser.has(item.user_id)) {
          photosByUser.set(item.user_id, []);
        }
        photosByUser.get(item.user_id)?.push(item.photo_url);
      });

      // Montar candidatos (não precisa mais de Promise.all)
      const candidatesWithData = filteredProfiles.map((candidateProfile: any) => {
        // Pegar interesses do mapa
        const interests = interestsByUser.get(candidateProfile.id) || [];

        // Pegar fotos do mapa
        const photos = photosByUser.get(candidateProfile.id) || [];

        // Extrair cidade do birth_place
        const location = candidateProfile.birth_place
          ? candidateProfile.birth_place.split(',').slice(0, 2).join(',').trim()
          : 'Localização não informada';

        // Calcular compatibilidade passando os interesses
        const compatibilityScore = calculateCompatibility(candidateProfile, interests);

        // Construir array de fotos
        let userPhotos = [...photos];

        // Se não tem fotos ou avatar_url não está nas fotos, adicionar avatar_url primeiro
        if (candidateProfile.avatar_url && !photos.includes(candidateProfile.avatar_url)) {
          userPhotos = [candidateProfile.avatar_url, ...photos];
        }

        // Garantir que sempre há pelo menos uma foto
        if (userPhotos.length === 0 && candidateProfile.avatar_url) {
          userPhotos = [candidateProfile.avatar_url];
        }

        // Debug
        if (userPhotos.length === 0) {
          console.log(`⚠️ Candidato ${candidateProfile.name} sem fotos! avatar_url:`, candidateProfile.avatar_url);
        }

        // Montar objeto de candidato
        const candidate: MatchCandidate = {
          id: candidateProfile.id,
          name: candidateProfile.name || 'Usuário',
          age: candidateProfile.age || 0,
          photos: userPhotos,
          bio: (candidateProfile as any).bio || 'Sem bio',
          location,
          zodiacSign: candidateProfile.zodiac_sign || 'Não informado',
          personalityType: (candidateProfile as any).personality_type || 'Não informado',
          intentions: [],
          interests,
          compatibilityScore,
          lastActive: candidateProfile.updated_at || candidateProfile.created_at || new Date().toISOString(),
          distance: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
        };

        return candidate;
      });

      // Ordenar por compatibilidade (maior primeiro) e limitar a 20
      const sortedCandidates = candidatesWithData
        .sort((a: MatchCandidate, b: MatchCandidate) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
        .slice(0, 20);

      setCandidates(sortedCandidates);
    } catch (error) {
      console.error('Erro ao carregar candidatos:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, profile, calculateCompatibility]);

  // Carregar candidatos ao iniciar (apenas uma vez)
  useEffect(() => {
    if (user?.id && profile && candidates.length === 0) {
      loadCandidates();
    }
  }, [user?.id, profile?.id]);

  const likeUser = useCallback(async (userId: string): Promise<MatchResult> => {
    console.log('🚀 likeUser iniciada:', { 
      userId, 
      currentUser: user?.id, 
      hasProfile: !!profile,
      candidatesCount: candidates.length 
    });

    if (!user?.id) {
      console.error('❌ Usuário não autenticado');
      return { isMatch: false, user: {} as any };
    }

    try {
      // Buscar dados do candidato
      const candidate = candidates.find((c: MatchCandidate) => c.id === userId);
      if (!candidate) {
        console.error('❌ Candidato não encontrado:', userId);
        return { isMatch: false, user: {} as any };
      }

      console.log('✅ Candidato encontrado:', candidate.name);

      let isMatch = false;
      let conversationId: string | undefined;

      // Verificar se já existe um match (em qualquer direção)
      const { data: existingMatches, error: checkError } = await supabase
        .from('matches')
        .select('*')
        .eq('user1_id', userId)
        .eq('user2_id', user.id);

      // Verificar também na direção oposta
      const { data: existingMatches2, error: checkError2 } = await supabase
        .from('matches')
        .select('*')
        .eq('user1_id', user.id)
        .eq('user2_id', userId);

      if (checkError || checkError2) {
        console.error('Erro ao verificar matches:', checkError || checkError2);
        throw checkError || checkError2;
      }

      // Combinar resultados
      const allExistingMatches = [...(existingMatches || []), ...(existingMatches2 || [])];

      console.log('🔍 Verificando matches existentes:', {
        userId,
        currentUserId: user.id,
        existingMatches1: existingMatches?.length || 0,
        existingMatches2: existingMatches2?.length || 0,
        total: allExistingMatches.length
      });

      // Se já existe match, verificar se precisa atualizar
      if (allExistingMatches && allExistingMatches.length > 0) {
        const existingMatch = allExistingMatches[0];
        console.log('📋 Match existente encontrado:', existingMatch);

        // Se o match é do outro usuário para nós e está pending, tornar mutual
        if (existingMatch.user1_id === userId && existingMatch.status === 'pending') {
          console.log('💖 Tornando match mútuo...');
          
          const { error: updateError } = await supabase
            .from('matches')
            .update({ status: 'mutual' })
            .eq('id', existingMatch.id);

          if (updateError) {
            console.error('❌ Erro ao atualizar match:', updateError);
          } else {
            console.log('✅ Match atualizado para mútuo');
            
            // Criar conversa
            const { data: newConversation, error: convError } = await supabase
              .from('conversations')
              .insert({ match_id: existingMatch.id })
              .select()
              .single();

            if (!convError && newConversation) {
              conversationId = newConversation.id;
              console.log('💬 Conversa criada:', conversationId);
              
              // Recarregar conversas do contexto
              await loadConversations();
            }

            const newMatch: Match = {
              id: existingMatch.id,
              user: candidate,
              compatibilityScore: existingMatch.compatibility_score || candidate.compatibilityScore || 0,
              sharedValues: [],
              cosmicInsights: [],
              matchedAt: new Date().toISOString()
            };
            setMatches((prev: Match[]) => [newMatch, ...prev]);
            isMatch = true;
          }
        } else {
          console.log('⚠️ Match já existe mas não é elegível para tornar mútuo');
        }
      } else {
        // Criar novo match pending
        console.log('🆕 Criando novo match pending...');
        
        const matchData = {
          user1_id: user.id,
          user2_id: userId,
          compatibility_score: candidate.compatibilityScore || 0,
          status: 'pending'
        };
        
        console.log('📋 Dados do match a inserir:', matchData);
        
        const { data: insertedMatch, error: insertError } = await supabase
          .from('matches')
          .insert(matchData)
          .select()
          .single();

        console.log('📋 Resultado da inserção:', { insertedMatch, insertError });

        if (insertError) {
          if (insertError.code === '23505') {
            console.log('⚠️ Match já existe (violação de chave única)');
          } else {
            console.error('❌ Erro ao criar match:', insertError);
            throw insertError;
          }
        } else {
          console.log('✅ Match pending criado com sucesso:', insertedMatch);
        }
        
        // Também registrar na tabela user_actions
        console.log('📝 Registrando ação do usuário...');
        const { error: actionError } = await supabase
          .from('user_actions')
          .insert({
            user_id: user.id,
            target_user_id: userId,
            action_type: 'like'
          });
          
        if (actionError) {
          console.error('❌ Erro ao registrar ação:', actionError);
        } else {
          console.log('✅ Ação registrada com sucesso');
        }
      }

      // Remover candidato da lista (já foi acionado)
      setCandidates((prev: MatchCandidate[]) => prev.filter((c: MatchCandidate) => c.id !== userId));

      return {
        isMatch,
        user: candidate,
        conversationId
      };
    } catch (error) {
      console.error('Erro ao dar like:', error);
      return { isMatch: false, user: {} as any };
    }
  }, [user?.id, candidates]);

  const dislikeUser = useCallback(async (userId: string) => {
    if (!user?.id) return;

    try {
      // Salvar ação de pass no banco
      const { error } = await supabase
        .from('user_actions')
        .insert({
          user_id: user.id,
          target_user_id: userId,
          action_type: 'pass'
        });

      if (error && error.code !== '23505') {
        // 23505 = unique violation (já existe registro)
        console.error('Erro ao salvar pass:', error);
      }

      // Remover candidato da lista (já foi acionado)
      setCandidates((prev: MatchCandidate[]) => prev.filter((c: MatchCandidate) => c.id !== userId));
    } catch (error) {
      console.error('Erro ao processar pass:', error);
    }
  }, [user?.id]);

  const getNextCandidate = useCallback(() => {
    // Candidatos são automaticamente removidos da lista após ação
    // Esta função apenas valida se acabaram
    if (candidates.length === 0) {
      console.log('Sem mais candidatos disponíveis');
    }
  }, [candidates]);

  const sendMessage = useCallback((conversationId: string, content: string, type: 'text' | 'image' = 'text') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      receiverId: conversations.find((c: Conversation) => c.id === conversationId)?.participants.find((p: string) => p !== 'current-user') || '',
      content,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages((prev: {[key: string]: Message[]}) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    setConversations((prev: Conversation[]) => prev.map((conv: Conversation) =>
      conv.id === conversationId 
        ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : conv
    ));
  }, [conversations]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages((prev: {[key: string]: Message[]}) => {
      const newMessages = { ...prev };
      Object.keys(newMessages).forEach(convId => {
        newMessages[convId] = newMessages[convId].map((msg: Message) => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find((r: any) => r.userId === 'current-user');
            
            if (existingReaction) {
              return {
                ...msg,
                reactions: reactions.map((r: any) => 
                  r.userId === 'current-user' ? { ...r, emoji } : r
                )
              };
            } else {
              return {
                ...msg,
                reactions: [...reactions, {
                  id: `reaction-${Date.now()}`,
                  userId: 'current-user',
                  emoji,
                  timestamp: new Date().toISOString()
                }]
              };
            }
          }
          return msg;
        });
      });
      return newMessages;
    });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setMessages((prev: {[key: string]: Message[]}) => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map((msg: Message) => ({ ...msg, read: true }))
    }));
  }, []);

  // Função para carregar conversas do banco
  const loadConversations = useCallback(async () => {
    if (!user?.id) {
      console.log('❌ loadConversations: usuário não encontrado');
      return;
    }

    try {
      console.log('🔄 Carregando conversas do banco para usuário:', user.id);
      
      // Buscar conversas onde o usuário atual participa através de matches
      const { data: conversationsData, error } = await supabase
        .from('conversations')
        .select(`
          id,
          match_id,
          created_at,
          updated_at,
          matches!inner (
            id,
            user1_id,
            user2_id,
            status
          )
        `)
        .eq('matches.status', 'mutual');

      if (error) {
        console.error('❌ Erro ao carregar conversas:', error);
        return;
      }

      console.log('✅ Conversas encontradas no banco:', conversationsData?.length || 0);

      // Filtrar apenas conversas onde o usuário atual participa
      const userConversations = conversationsData?.filter((conv: any) => {
        const match = conv.matches;
        return match.user1_id === user.id || match.user2_id === user.id;
      }) || [];

      console.log('🔍 Conversas filtradas para o usuário:', userConversations.length);

      if (userConversations.length === 0) {
        setConversations([]);
        setMessages({});
        return;
      }

      // Buscar mensagens para todas as conversas
      const conversationIds = userConversations.map((conv: any) => conv.id);
      const { data: messagesData } = await supabase
        .from('messages')
        .select('*')
        .in('conversation_id', conversationIds)
        .order('sent_at', { ascending: true });

      // Agrupar mensagens por conversa
      const messagesByConversation: { [conversationId: string]: Message[] } = {};
      messagesData?.forEach((msg: any) => {
        if (!messagesByConversation[msg.conversation_id]) {
          messagesByConversation[msg.conversation_id] = [];
        }
        
        // Encontrar a conversa correspondente para obter os participantes
        const conversation = userConversations.find((c: any) => c.id === msg.conversation_id);
        const match = conversation?.matches;
        const otherUserId = match ? (match.user1_id === user.id ? match.user2_id : match.user1_id) : '';
        
        messagesByConversation[msg.conversation_id].push({
          id: msg.id,
          senderId: msg.sender_id,
          receiverId: msg.sender_id === user.id ? otherUserId : user.id,
          content: msg.content,
          timestamp: msg.sent_at,
          type: msg.message_type || 'text',
          read: msg.read_at !== null,
          reactions: []
        });
      });

      // Buscar informações dos outros usuários
      const otherUserIds = userConversations.map((conv: any) => {
        const match = conv.matches;
        return match.user1_id === user.id ? match.user2_id : match.user1_id;
      });

      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, name, avatar_url')
        .in('id', otherUserIds);

      const usersMap = new Map(usersData?.map((u: any) => [u.id, u]) || []);

      // Converter para o formato esperado
      const formattedConversations: Conversation[] = userConversations.map((conv: any) => {
        const match = conv.matches;
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const otherUser = usersMap.get(otherUserId);
        
        return {
          id: conv.id,
          participants: [user.id, otherUserId],
          createdAt: conv.created_at,
          updatedAt: conv.updated_at || conv.created_at,
          otherUser: otherUser ? {
            id: (otherUser as any).id,
            name: (otherUser as any).name || 'Usuário',
            avatar: (otherUser as any).avatar_url || undefined
          } : undefined
        };
      });

      console.log('✨ Conversas formatadas:', formattedConversations.length);

      // Definir conversas e mensagens do banco
      setConversations(formattedConversations);
      setMessages(messagesByConversation);
      
      console.log('📋 Conversas e mensagens carregadas:', {
        totalConversations: formattedConversations.length,
        totalMessages: Object.keys(messagesByConversation).length,
        conversationIds: formattedConversations.map(c => c.id)
      });

    } catch (error) {
      console.error('Erro ao carregar conversas:', error);
    }
  }, [user?.id]);

  // Carregar conversas quando o usuário está disponível
  useEffect(() => {
    if (user?.id) {
      loadConversations();
    }
  }, [user?.id, loadConversations]);

  return {
    candidates,
    currentCandidate,
    matches,
    conversations,
    messages,
    likeUser,
    dislikeUser,
    sendMessage,
    addReaction,
    markAsRead,
    getNextCandidate,
    loadCandidates,
    loadConversations,
    isLoading
  };
});