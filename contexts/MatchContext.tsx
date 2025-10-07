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
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({
    'conv-1': mockMessages,
    'conv-2': []
  });
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

    // Compatibilidade por estilo de vida
    if (candidate.lifestyle?.exercise === profile.lifestyle?.exercise) {
      score += 5;
    }

    if (candidate.lifestyle?.smoking === profile.lifestyle?.smoking) {
      score += 3;
    }

    if (candidate.lifestyle?.alcohol === profile.lifestyle?.alcohol) {
      score += 3;
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
        actionsResult.data?.map(a => a.target_user_id) || []
      );

      // IDs de usuários que já tiveram match
      const matchedUserIds = new Set(
        matchesResult.data?.map(m =>
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
      const userIds = filteredProfiles.map(p => p.id);
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
      allInterests?.forEach(item => {
        if (!interestsByUser.has(item.user_id)) {
          interestsByUser.set(item.user_id, []);
        }
        interestsByUser.get(item.user_id)?.push(item.interest);
      });

      // Agrupar fotos por user_id
      const photosByUser = new Map<string, string[]>();
      allPhotos?.forEach(item => {
        if (!photosByUser.has(item.user_id)) {
          photosByUser.set(item.user_id, []);
        }
        photosByUser.get(item.user_id)?.push(item.photo_url);
      });

      // Montar candidatos (não precisa mais de Promise.all)
      const candidatesWithData = filteredProfiles.map((candidateProfile) => {
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
          bio: candidateProfile.bio || 'Sem bio',
          location,
          zodiacSign: candidateProfile.zodiac_sign || 'Não informado',
          personalityType: candidateProfile.personality_type || 'Não informado',
          intentions: [],
          interests,
          compatibilityScore,
          lastActive: candidateProfile.updated_at || candidateProfile.created_at,
          distance: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
        };

        return candidate;
      });

      // Ordenar por compatibilidade (maior primeiro) e limitar a 20
      const sortedCandidates = candidatesWithData
        .sort((a, b) => (b.compatibilityScore || 0) - (a.compatibilityScore || 0))
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
    if (!user?.id) {
      return { isMatch: false, user: {} as any };
    }

    try {
      // Buscar dados do candidato
      const candidate = candidates.find(c => c.id === userId);
      if (!candidate) {
        return { isMatch: false, user: {} as any };
      }

      let isMatch = false;
      let conversationId: string | undefined;

      // Verificar se já existe um match (em qualquer direção)
      const { data: existingMatches, error: checkError } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${userId},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${userId})`);

      if (checkError) {
        console.error('Erro ao verificar matches:', checkError);
        throw checkError;
      }

      // Se já existe match, não fazer nada
      if (existingMatches && existingMatches.length > 0) {
        const existingMatch = existingMatches[0];

        // Se o match é do outro usuário para nós e está pending, tornar mutual
        if (existingMatch.user1_id === userId && existingMatch.status === 'pending') {
          const { error: updateError } = await supabase
            .from('matches')
            .update({ status: 'mutual' })
            .eq('id', existingMatch.id);

          if (updateError) {
            console.error('Erro ao atualizar match:', updateError);
          } else {
            // Criar conversa
            const { data: newConversation, error: convError } = await supabase
              .from('conversations')
              .insert({ match_id: existingMatch.id })
              .select()
              .single();

            if (!convError && newConversation) {
              conversationId = newConversation.id;
              setConversations(prev => [newConversation, ...prev]);
              setMessages(prev => ({ ...prev, [conversationId!]: [] }));
            }

            const newMatch: Match = {
              id: existingMatch.id,
              user: candidate,
              compatibilityScore: existingMatch.compatibility_score || candidate.compatibilityScore || 0,
              sharedValues: [],
              cosmicInsights: [],
              matchedAt: new Date().toISOString()
            };
            setMatches(prev => [newMatch, ...prev]);
            isMatch = true;
          }
        }
      } else {
        // Criar novo match pending
        const { error: insertError } = await supabase
          .from('matches')
          .insert({
            user1_id: user.id,
            user2_id: userId,
            compatibility_score: candidate.compatibilityScore || 0,
            status: 'pending'
          });

        if (insertError && insertError.code !== '23505') {
          console.error('Erro ao criar match:', insertError);
        }
      }

      // Remover candidato da lista (já foi acionado)
      setCandidates(prev => prev.filter(c => c.id !== userId));

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
      setCandidates(prev => prev.filter(c => c.id !== userId));
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
      receiverId: conversations.find(c => c.id === conversationId)?.participants.find(p => p !== 'current-user') || '',
      content,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : conv
    ));
  }, [conversations]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      Object.keys(newMessages).forEach(convId => {
        newMessages[convId] = newMessages[convId].map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.userId === 'current-user');
            
            if (existingReaction) {
              return {
                ...msg,
                reactions: reactions.map(r => 
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
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => ({ ...msg, read: true }))
    }));
  }, []);

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
    isLoading
  };
});