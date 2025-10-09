import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  marginBottom?: number;
  marginRight?: number;
  marginTop?: number;
  style?: any;
}

export function SkeletonBox({ width, height, borderRadius = 8, marginBottom = 0, marginRight = 0, marginTop = 0, style }: SkeletonProps) {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeletonBox,
        {
          width,
          height,
          borderRadius,
          marginBottom,
          marginRight,
          marginTop,
          opacity: animatedOpacity,
        },
        style,
      ]}
    />
  );
}

// Skeleton para item de conversa na lista de mensagens
export function ConversationItemSkeleton() {
  return (
    <View style={styles.conversationSkeleton}>
      <View style={styles.avatarSkeleton}>
        <SkeletonBox width={56} height={56} borderRadius={28} />
      </View>
      
      <View style={styles.conversationContentSkeleton}>
        <View style={styles.conversationHeaderSkeleton}>
          <SkeletonBox width={120} height={18} marginBottom={6} />
          <SkeletonBox width={60} height={14} />
        </View>
        
        <SkeletonBox width="85%" height={16} marginBottom={4} />
        
        <View style={styles.conversationFooterSkeleton}>
          <SkeletonBox width={80} height={14} />
          <SkeletonBox width={60} height={14} />
        </View>
      </View>
    </View>
  );
}

// Skeleton para seção de novos matches
export function NewMatchesSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox width={20} height={20} borderRadius={10} marginRight={8} />
          <SkeletonBox width={150} height={20} />
        </View>
      </View>
      
      <View style={styles.matchesScrollSkeleton}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.matchItemSkeleton}>
            <SkeletonBox width={64} height={64} borderRadius={32} marginBottom={8} />
            <SkeletonBox width={60} height={14} marginBottom={2} />
            <SkeletonBox width={45} height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}

// Skeleton para lista de conversas
export function ConversationsListSkeleton() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <SkeletonBox width={20} height={20} borderRadius={10} marginRight={8} />
          <SkeletonBox width={100} height={20} />
        </View>
      </View>
      
      {[1, 2, 3, 4, 5].map((item) => (
        <ConversationItemSkeleton key={item} />
      ))}
    </View>
  );
}

// Skeleton para mensagem no chat
export function MessageSkeleton({ isOwn = false }: { isOwn?: boolean }) {
  return (
    <View style={[styles.messageSkeleton, isOwn ? styles.ownMessageSkeleton : styles.otherMessageSkeleton]}>
      <View style={[styles.messageBubbleSkeleton, isOwn ? styles.ownBubbleSkeleton : styles.otherBubbleSkeleton]}>
        <SkeletonBox 
          width={Math.random() * 100 + 80} 
          height={16} 
          borderRadius={4}
          style={{ backgroundColor: isOwn ? colors.cosmic.purple + '20' : colors.neutral[200] }}
        />
      </View>
      <SkeletonBox width={40} height={12} marginTop={4} />
    </View>
  );
}

// Skeleton completo para tela de mensagens
export function MessagesScreenSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.headerSkeleton}>
        <SkeletonBox width={120} height={28} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>

      {/* New matches skeleton */}
      <NewMatchesSkeleton />

      {/* Conversations skeleton */}
      <View style={styles.conversationsSkeleton}>
        <SkeletonBox width={100} height={20} marginBottom={16} />
        
        {[1, 2, 3, 4, 5].map((item) => (
          <ConversationItemSkeleton key={item} />
        ))}
      </View>
    </View>
  );
}

// Skeleton completo para tela de chat
export function ChatScreenSkeleton() {
  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.chatHeaderSkeleton}>
        <SkeletonBox width={24} height={24} borderRadius={12} />
        
        <View style={styles.chatHeaderInfoSkeleton}>
          <SkeletonBox width={40} height={40} borderRadius={20} marginRight={12} />
          <View>
            <SkeletonBox width={100} height={18} marginBottom={4} />
            <SkeletonBox width={80} height={14} />
          </View>
        </View>
        
        <SkeletonBox width={24} height={24} borderRadius={12} />
      </View>

      {/* Messages skeleton */}
      <View style={styles.messagesSkeleton}>
        <MessageSkeleton isOwn={false} />
        <MessageSkeleton isOwn={true} />
        <MessageSkeleton isOwn={false} />
        <MessageSkeleton isOwn={true} />
        <MessageSkeleton isOwn={false} />
        <MessageSkeleton isOwn={true} />
        <MessageSkeleton isOwn={false} />
      </View>

      {/* Input skeleton */}
      <View style={styles.inputSkeleton}>
        <SkeletonBox width="75%" height={44} borderRadius={22} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
        <SkeletonBox width={44} height={44} borderRadius={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonBox: {
    backgroundColor: colors.neutral[200],
  },
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  // Messages screen skeletons
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  },
  matchesSkeleton: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  matchesTitleSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchesScrollSkeleton: {
    flexDirection: 'row',
    gap: 16,
  },
  matchItemSkeleton: {
    alignItems: 'center',
    width: 80,
  },
  conversationsSkeleton: {
    paddingHorizontal: 20,
  },
  conversationSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 16,
  },
  avatarSkeleton: {
    marginRight: 12,
  },
  conversationContentSkeleton: {
    flex: 1,
  },
  conversationHeaderSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Chat screen skeletons
  chatHeaderSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  chatHeaderInfoSkeleton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagesSkeleton: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  messageSkeleton: {
    alignItems: 'flex-start',
  },
  ownMessageSkeleton: {
    alignItems: 'flex-end',
  },
  otherMessageSkeleton: {
    alignItems: 'flex-start',
  },
  messageBubbleSkeleton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    maxWidth: '80%',
  },
  ownBubbleSkeleton: {
    backgroundColor: colors.cosmic.purple + '15',
  },
  otherBubbleSkeleton: {
    backgroundColor: colors.neutral[100],
  },
  inputSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
});