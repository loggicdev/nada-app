import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Search, MoreHorizontal, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
import { mockUsers } from '@/mocks/users';



export default function MessagesScreen() {
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const insets = useSafeAreaInsets();
  const { matches, conversations, messages } = useMatch();
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  const handleImageError = (userId: string) => {
    setImageErrors(prev => ({ ...prev, [userId]: true }));
  };

  const renderUserImage = (user: typeof mockUsers[0], size: number, style: any) => {
    const hasPhoto = user.photos && user.photos.length > 0 && user.photos[0] && !imageErrors[user.id];
    
    if (hasPhoto) {
      return (
        <Image 
          source={{ uri: user.photos[0] }} 
          style={style}
          onError={() => handleImageError(user.id)}
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
        <Text style={styles.sectionTitle}>Novos Matches</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.matchesScroll}>
          {matches.map((match, index) => {
            const isNew = new Date(match.matchedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000);
            return (
              <TouchableOpacity key={match.id} style={styles.matchItem}>
                <View style={styles.matchImageContainer}>
                  {renderUserImage(match.user, 64, styles.matchImage)}
                  {isNew && (
                    <View style={styles.newMatchBadge}>
                      <Text style={styles.newMatchText}>Novo</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.matchName}>{match.user.name}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Conversations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conversas</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {conversations.map((conversation) => {
            const otherUserId = conversation.participants.find(p => p !== 'current-user');
            const user = mockUsers.find(u => u.id === otherUserId);
            const match = matches.find(m => m.user.id === otherUserId);
            const conversationMessages = messages[conversation.id] || [];
            const hasUnread = conversationMessages.some(msg => !msg.read && msg.senderId !== 'current-user');
            const isOnline = Math.random() > 0.5; // Mock online status
            
            if (!user) return null;
            
            const formatTimestamp = (timestamp: string) => {
              const date = new Date(timestamp);
              const now = new Date();
              const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
              
              if (diffInHours < 1) {
                return `${Math.floor(diffInHours * 60)} min`;
              } else if (diffInHours < 24) {
                return `${Math.floor(diffInHours)}h`;
              } else {
                return `${Math.floor(diffInHours / 24)} dia${Math.floor(diffInHours / 24) > 1 ? 's' : ''}`;
              }
            };
            
            return (
              <TouchableOpacity 
                key={conversation.id} 
                style={styles.conversationItem}
                onPress={() => router.push(`/chat/${conversation.id}` as any)}
              >
                <View style={styles.avatarContainer}>
                  {renderUserImage(user, 56, styles.avatar)}
                  {isOnline && <View style={styles.onlineIndicator} />}
                </View>
                
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.timestamp}>
                      {conversation.lastMessage ? formatTimestamp(conversation.lastMessage.timestamp) : ''}
                    </Text>
                  </View>
                  <Text 
                    style={[
                      styles.lastMessage,
                      hasUnread && styles.unreadMessage
                    ]}
                    numberOfLines={1}
                  >
                    {conversation.lastMessage?.content || 'Vocês deram match! Que tal começar uma conversa?'}
                  </Text>
                  <View style={styles.compatibilityRow}>
                    <Text style={styles.compatibilityText}>
                      {match?.compatibilityScore || 85}% compatível
                    </Text>
                    <Text style={styles.zodiacText}>{user.zodiacSign}</Text>
                  </View>
                </View>
                
                <View style={styles.conversationActions}>
                  {hasUnread && <View style={styles.unreadDot} />}
                  <TouchableOpacity style={styles.moreButton}>
                    <MoreHorizontal size={16} color={colors.neutral[400]} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginHorizontal: 20,
    marginBottom: 12,
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
    fontSize: 12,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'center',
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