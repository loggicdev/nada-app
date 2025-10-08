import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MoreHorizontal, User as UserIcon, Sparkles, MessageCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import colors from '@/constants/colors';
import { useConversations } from '@/hooks/useRealtimeMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';



interface MatchUser {
  id: string;
  name: string;
  age: number;
  photos: string[];
  zodiacSign: string;
  compatibilityScore: number;
  matchedAt: string;
}

export default function MessagesScreen() {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const insets = useSafeAreaInsets();
  const { user } = useAuthContext();

  // Hook de conversas em tempo real
  const { conversations, loading, refresh } = useConversations();

  // Estados para novos matches
  const [newMatches, setNewMatches] = useState<MatchUser[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadNewMatchesRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  // Carregar novos matches ao inicializar
  useEffect(() => {
    if (user?.id) {
      loadNewMatches();
    }
  }, [user?.id]);

  // Subscrever a mudanças em matches para atualizar a seção "Novos Matches"
  useEffect(() => {
    if (!user?.id) return;

    console.log('🔔 [MessagesScreen] Iniciando subscrição de matches');

    const matchesChannel = supabase
      .channel('messages-screen-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('🎯 [Realtime] Match alterado:', payload.eventType, payload.new);
          setTimeout(() => loadNewMatchesRef.current?.(), 100);
        }
      )
      .subscribe((status) => {
        console.log('📡 [MessagesScreen] Status matches:', status);
        if (status === 'SUBSCRIBED') {
          console.log('✅ [MessagesScreen] Subscrição de matches ativa');
        }
      });

    return () => {
      console.log('🔕 [MessagesScreen] Removendo subscrição de matches');
      supabase.removeChannel(matchesChannel);
    };
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNewMatches(), refresh()]);
    setRefreshing(false);
  };

  const loadNewMatches = useCallback(async () => {
    if (!user?.id) return;

    setLoadingMatches(true);
    try {
      console.log('🔍 Buscando matches mútuos para usuário:', user.id);
      
      // Buscar matches mútuos (status = 'mutual')
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, compatibility_score, matched_at')
        .eq('status', 'mutual')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false })
        .limit(20);

      console.log('📊 Resultado da busca de matches:', { matchesData, matchesError });

      if (matchesError) {
        console.error('Erro ao buscar matches:', matchesError);
        setLoadingMatches(false);
        return;
      }

      if (!matchesData || matchesData.length === 0) {
        setNewMatches([]);
        setLoadingMatches(false);
        return;
      }

      // Pegar IDs dos outros usuários
      const otherUserIds = matchesData.map(m =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      // Buscar perfis dos usuários
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, name, age, zodiac_sign, avatar_url')
        .in('id', otherUserIds);

      // Buscar fotos dos usuários
      const { data: photosData } = await supabase
        .from('user_photos')
        .select('user_id, photo_url, order_index')
        .in('user_id', otherUserIds)
        .order('order_index', { ascending: true });

      // Agrupar fotos por usuário
      const photosByUser = new Map<string, string[]>();
      photosData?.forEach(photo => {
        if (!photosByUser.has(photo.user_id)) {
          photosByUser.set(photo.user_id, []);
        }
        photosByUser.get(photo.user_id)?.push(photo.photo_url);
      });

      // Montar lista de matches
      const matchUsers: MatchUser[] = matchesData.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const profile = profilesData?.find(p => p.id === otherUserId);
        const userPhotos = photosByUser.get(otherUserId) || [];

        // Adicionar avatar_url se não estiver nas fotos
        let allPhotos = [...userPhotos];
        if (profile?.avatar_url && !allPhotos.includes(profile.avatar_url)) {
          allPhotos = [profile.avatar_url, ...userPhotos];
        }

        return {
          id: otherUserId,
          name: profile?.name || 'Usuário',
          age: profile?.age || 0,
          photos: allPhotos,
          zodiacSign: profile?.zodiac_sign || '♈',
          compatibilityScore: match.compatibility_score || 0,
          matchedAt: match.matched_at || new Date().toISOString(),
        };
      });

      setNewMatches(matchUsers);
    } catch (error) {
      console.error('Erro ao carregar matches:', error);
    } finally {
      setLoadingMatches(false);
    }
  }, [user?.id]);

  // Guardar referência para usar no Realtime
  loadNewMatchesRef.current = loadNewMatches;

  const handleImageError = (userId: string) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const renderUserImage = (userId: string, photos: string[], size: number, style: any) => {
    const hasPhoto = photos && photos.length > 0 && photos[0] && !imageErrors[userId];

    if (hasPhoto) {
      return (
        <Image
          source={{ uri: photos[0] }}
          style={style}
          onError={() => handleImageError(userId)}
        />
      );
    } else {
      return (
        <View style={[style, styles.imagePlaceholder]}>
          <UserIcon size={size * 0.5} color={colors.neutral[400]} />
        </View>
      );
    }
  };

  const formatTimestamp = (timestamp: string | null) => {
    if (!timestamp) return '';

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Ontem';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Mensagens</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Search size={20} color={colors.cosmic.purple} />
        </TouchableOpacity>
      </View>

      {/* New Matches Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Sparkles size={20} color={colors.cosmic.purple} fill={colors.cosmic.purple} />
            <Text style={styles.sectionTitle}>Novos Matches</Text>
          </View>
          {newMatches.length > 0 && (
            <Text style={styles.matchCount}>{newMatches.length}</Text>
          )}
        </View>

        {loadingMatches ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.cosmic.purple} />
          </View>
        ) : newMatches.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
            {newMatches.map((match) => {
              return (
                <TouchableOpacity
                  key={match.id}
                  style={styles.matchItem}
                  onPress={() => router.push(`/profile/${match.id}`)}
                >
                  <View style={styles.matchImageContainer}>
                    {renderUserImage(match.id, match.photos, 64, styles.matchImage)}
                    <View style={styles.compatibilityBadge}>
                      <Text style={styles.compatibilityBadgeText}>{match.compatibilityScore}%</Text>
                    </View>
                  </View>
                  <Text style={styles.matchName} numberOfLines={1}>{match.name}</Text>
                  <Text style={styles.matchAge}>{match.age} anos</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyMatchesContainer}>
            <Sparkles size={32} color={colors.neutral[300]} />
            <Text style={styles.emptyMatchesText}>Nenhum match ainda</Text>
            <Text style={styles.emptyMatchesSubtext}>Continue explorando perfis!</Text>
          </View>
        )}
      </View>

      {/* Conversations Section */}
      <ScrollView
        style={styles.conversationsSection}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <MessageCircle size={20} color={colors.cosmic.purple} />
            <Text style={styles.sectionTitle}>Conversas</Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.cosmic.purple} />
          </View>
        ) : conversations.length > 0 ? (
          <>
            {conversations.map((conversation) => {
              const otherUser = conversation.match?.user_profile;
              const lastMessage = conversation.last_message;
              const unreadCount = conversation.unread_count || 0;

              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.conversationItem}
                  onPress={() => router.push(`/chat/${conversation.id}`)}
                >
                  <View style={styles.avatarContainer}>
                    {otherUser?.avatar_url ? (
                      <Image
                        source={{ uri: otherUser.avatar_url }}
                        style={styles.avatar}
                        onError={() => handleImageError(otherUser.id)}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.placeholderAvatar]}>
                        <Text style={styles.avatarPlaceholderText}>
                          {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.userName}>
                        {otherUser?.name || 'Usuário'}, {otherUser?.age || ''}
                      </Text>
                      {lastMessage && (
                        <Text style={styles.timestamp}>
                          {formatTimestamp(lastMessage.sent_at)}
                        </Text>
                      )}
                    </View>
                    {lastMessage ? (
                      <Text style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} numberOfLines={1}>
                        {lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={styles.lastMessage}>
                        Vocês deram match! Que tal começar uma conversa?
                      </Text>
                    )}
                  </View>
                  <View style={styles.conversationActions}>
                    {unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyMatchesContainer}>
            <MessageCircle size={32} color={colors.neutral[300]} />
            <Text style={styles.emptyMatchesText}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyMatchesSubtext}>Suas conversas aparecerão aqui quando você fizer match!</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  matchCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cosmic.purple,
    backgroundColor: colors.cosmic.purple + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMatchesContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  emptyMatchesText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[600],
    marginTop: 12,
  },
  emptyMatchesSubtext: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 4,
  },
  matchesScroll: {
    paddingLeft: 20,
  },
  matchItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  matchImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  matchImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  imagePlaceholder: {
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  newMatchBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.cosmic.rose,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newMatchText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  matchName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
  },
  matchAge: {
    fontSize: 11,
    color: colors.neutral[500],
    textAlign: 'center',
    marginTop: 2,
  },
  compatibilityBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.cosmic.purple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'white',
  },
  compatibilityBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  placeholderAvatar: {
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.semantic.success,
    borderWidth: 2,
    borderColor: 'white',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  timestamp: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  lastMessage: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  unreadMessage: {
    fontWeight: '500',
    color: colors.neutral[800],
  },
  compatibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compatibilityText: {
    fontSize: 12,
    color: colors.cosmic.purple,
    fontWeight: '500',
  },
  zodiacText: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  conversationActions: {
    alignItems: 'center',
    gap: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cosmic.purple,
  },
  moreButton: {
    padding: 4,
  },
  avatarPlaceholderText: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.neutral[600],
  },
  unreadBadge: {
    backgroundColor: colors.cosmic.purple,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  conversationsSection: {
    flex: 1,
  },
});