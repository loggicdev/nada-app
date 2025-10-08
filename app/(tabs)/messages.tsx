import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, ActivityIndicator } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MoreHorizontal, User as UserIcon, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
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
  const { matches, conversations, messages, loadConversations } = useMatch();
  const { user } = useAuthContext();

  // Estados para novos matches
  const [newMatches, setNewMatches] = useState<MatchUser[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  // Carregar conversas do MatchContext ao inicializar
  useEffect(() => {
    if (user?.id) {
      loadNewMatches();
      loadConversations(); // Forçar carregamento das conversas
    }
  }, [user?.id]);

  const loadNewMatches = async () => {
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
  };

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
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conversas</Text>
        </View>
        {loadingMatches ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.cosmic.purple} />
          </View>
        ) : conversations.length > 0 ? (
          <ScrollView>
            {conversations.map((conversation) => {
              const lastMessage = messages[conversation.id]?.[messages[conversation.id].length - 1];
              const otherUser = conversation.otherUser;
              
              return (
                <TouchableOpacity
                  key={conversation.id}
                  style={styles.conversationItem}
                  onPress={() => router.push(`/chat/${conversation.id}`)}
                >
                  <View style={styles.avatarContainer}>
                    {otherUser ? (
                      renderUserImage(otherUser.id, [otherUser.avatar || ''], 56, styles.avatar)
                    ) : (
                      <View style={[styles.avatar, styles.placeholderAvatar]}>
                        <UserIcon size={24} color={colors.neutral[400]} />
                      </View>
                    )}
                  </View>
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <Text style={styles.userName}>
                        {otherUser?.name || 'Usuário'}
                      </Text>
                      <Text style={styles.timestamp}>
                        {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </Text>
                    </View>
                    {lastMessage ? (
                      <Text style={[styles.lastMessage, !lastMessage.read && styles.unreadMessage]} numberOfLines={1}>
                        {lastMessage.content}
                      </Text>
                    ) : (
                      <Text style={styles.lastMessage}>
                        Vocês deram match! Que tal começar uma conversa?
                      </Text>
                    )}
                  </View>
                  <View style={styles.conversationActions}>
                    {lastMessage && !lastMessage.read && <View style={styles.unreadDot} />}
                    <TouchableOpacity style={styles.moreButton}>
                      <MoreHorizontal size={16} color={colors.neutral[400]} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View style={styles.emptyMatchesContainer}>
            <Text style={styles.emptyMatchesText}>Nenhuma conversa ainda</Text>
            <Text style={styles.emptyMatchesSubtext}>Suas conversas aparecerão aqui quando você fizer match!</Text>
          </View>
        )}
      </View>
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
});