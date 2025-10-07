import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  PanResponder,
  Animated,
  Alert,
  Platform
} from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Heart, X, MapPin, User as UserIcon } from 'lucide-react-native';
import { router } from 'expo-router';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
import { MatchCandidate } from '@/types/user';
import Toast, { ToastType } from '@/components/common/Toast';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const CARD_WIDTH = screenWidth - 40;
const CARD_HEIGHT = screenHeight * 0.65;

interface SwipeCardProps {
  user: MatchCandidate;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  cardKey: string;
  onCardPress: () => void;
}

function SwipeCard({ user, onSwipeLeft, onSwipeRight, isTop, cardKey, onCardPress }: SwipeCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState<boolean>(false);

  // Reset animation values when card changes
  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    rotate.setValue(0);
    setImageError(false);
  }, [cardKey, pan, rotate]);

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Respond to horizontal swipes (Tinder style) - right = like, left = pass
      return isTop && Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderGrant: () => {
      pan.stopAnimation();
      rotate.stopAnimation();
    },
    onPanResponderMove: (_, gestureState) => {
      if (!isTop) return;
      
      // Allow horizontal movement
      pan.setValue({ x: gestureState.dx, y: 0 });
      
      // Add rotation based on horizontal movement
      const rotationValue = gestureState.dx / screenWidth * 30;
      rotate.setValue(rotationValue);
    },
    onPanResponderRelease: (_, gestureState) => {
      if (!isTop) return;
      
      const swipeThreshold = screenWidth * 0.25; // 25% of screen width
      const velocityThreshold = 0.5; // Horizontal velocity threshold
      
      const shouldSwipeRight = gestureState.dx > swipeThreshold || gestureState.vx > velocityThreshold;
      const shouldSwipeLeft = gestureState.dx < -swipeThreshold || gestureState.vx < -velocityThreshold;
      
      if (shouldSwipeRight) {
        // Animate card sliding right (like)
        Animated.timing(pan, {
          toValue: { x: screenWidth, y: 0 },
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          // Chamar callback ANTES de resetar (para trocar card primeiro)
          onSwipeRight();
          // Reset será feito pelo useEffect quando cardKey mudar
        });
      } else if (shouldSwipeLeft) {
        // Animate card sliding left (dislike)
        Animated.timing(pan, {
          toValue: { x: -screenWidth, y: 0 },
          duration: 300,
          useNativeDriver: false,
        }).start(() => {
          // Chamar callback ANTES de resetar (para trocar card primeiro)
          onSwipeLeft();
          // Reset será feito pelo useEffect quando cardKey mudar
        });
      } else {
        // Spring back to center
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        
        Animated.spring(rotate, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    },
  });

  const rotateInterpolate = rotate.interpolate({
    inputRange: [-30, 0, 30],
    outputRange: ['-30deg', '0deg', '30deg'],
  });

  const likeOpacity = pan.x.interpolate({
    inputRange: [0, screenWidth * 0.25],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = pan.x.interpolate({
    inputRange: [-screenWidth * 0.25, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const hasPhoto = user.photos && user.photos.length > 0 && !imageError;

  return (
    <Animated.View
      style={[
        styles.card,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { rotate: rotateInterpolate },
          ],
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity 
        style={styles.cardTouchable}
        onPress={onCardPress}
        activeOpacity={1}
      >
      {/* Like/Nope Labels */}
      <Animated.View style={[styles.likeLabel, { opacity: likeOpacity }]}>
        <Text style={styles.likeLabelText}>CURTIR</Text>
      </Animated.View>
      
      <Animated.View style={[styles.nopeLabel, { opacity: nopeOpacity }]}>
        <Text style={styles.nopeLabelText}>PASSAR</Text>
      </Animated.View>

      {/* User Image */}
      <View style={styles.imageContainer}>
        {hasPhoto ? (
          <Image 
            source={{ uri: user.photos[0] }} 
            style={styles.userImage}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <UserIcon size={80} color={colors.neutral[400]} />
          </View>
        )}
        
        {/* Gradient Overlay */}
        <View style={styles.gradientOverlay}>
          <View style={styles.gradientBackground} />
          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{user.name}, {user.age}</Text>
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>{user.compatibilityScore}%</Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.neutral[400]} />
              <Text style={styles.locationText}>{user.location}</Text>
              {user.distance && (
                <Text style={styles.distanceText}>• {user.distance}km</Text>
              )}
            </View>
            
            <Text style={styles.zodiacSign}>{user.zodiacSign} • {user.personalityType}</Text>
            <Text style={styles.userBio} numberOfLines={3}>{user.bio}</Text>
            
            <View style={styles.interestsContainer}>
              {user.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function MatchScreen() {
  const insets = useSafeAreaInsets();
  const { currentCandidate, getNextCandidate, likeUser, dislikeUser, isLoading: contextLoading } = useMatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cardKey, setCardKey] = useState<string>('0');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Toast states
  const [toastVisible, setToastVisible] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastType, setToastType] = useState<ToastType>('success');

  const showToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);


  const handleSwipeLeft = async () => {
    if (currentCandidate && !isLoading && !isProcessing) {
      setIsProcessing(true);
      const candidateName = currentCandidate.name;
      const candidateId = currentCandidate.id;

      try {
        // Trocar card (a animação já foi feita pelo SwipeCard)
        setCardKey(prev => String(Number(prev) + 1));

        // Salvar rejeição em background
        await dislikeUser(candidateId);
        showToast(`Você dispensou ${candidateName}`, 'info');
      } finally {
        // Pequeno delay para evitar múltiplos cliques
        setTimeout(() => setIsProcessing(false), 500);
      }
    }
  };

  const handleCardPress = () => {
    if (currentCandidate && !isProcessing) {
      router.push(`/profile/${currentCandidate.id}`);
    }
  };

  const handleSwipeRight = async () => {
    if (currentCandidate && !isLoading && !isProcessing) {
      setIsLoading(true);
      setIsProcessing(true);
      const candidateName = currentCandidate.name;
      const candidateId = currentCandidate.id;

      try {
        // Trocar card (a animação já foi feita pelo SwipeCard)
        setCardKey(prev => String(Number(prev) + 1));

        // Fazer like em background
        const result = await likeUser(candidateId);

        if (result.isMatch) {
          // Mostrar toast de match
          showToast(`🎉 Match com ${candidateName}!`, 'success');

          // Mostrar alert sem delay (não bloqueia a UI)
          setTimeout(() => {
            Alert.alert(
              '💫 É um Match!',
              `Você e ${candidateName} se curtiram! Que tal começar uma conversa?`,
              [
                { text: 'Ver depois', style: 'cancel' },
                { text: 'Conversar', onPress: () => {
                  // TODO: Navegar para conversa
                }}
              ]
            );
          }, 300);
        } else {
          showToast(`💜 Você curtiu ${candidateName}`, 'success');
        }
      } catch (error) {
        console.error('Error liking user:', error);
        showToast('Erro ao curtir perfil', 'error');
      } finally {
        setIsLoading(false);
        // Pequeno delay para evitar múltiplos cliques
        setTimeout(() => setIsProcessing(false), 500);
      }
    }
  };



  if (!currentCandidate) {
    return (
      <View style={styles.container}>
        <View style={[styles.emptyState, { paddingTop: insets.top }]}>
          <Heart size={64} color={colors.neutral[300]} />
          <Text style={styles.emptyTitle}>Sem mais perfis</Text>
          <Text style={styles.emptySubtitle}>
            Volte mais tarde para descobrir novas pessoas!
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Toast */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
        duration={2500}
      />

      {/* Cards Container */}
      <View style={[styles.cardsContainer, { paddingTop: insets.top + 20 }]}>
        <SwipeCard
          key={cardKey}
          user={currentCandidate}
          onSwipeLeft={handleSwipeLeft}
          onSwipeRight={handleSwipeRight}
          isTop={true}
          cardKey={cardKey}
          onCardPress={handleCardPress}
        />
      </View>

      {/* Action Buttons */}
      <View style={[styles.actionButtonsContainer, { paddingBottom: Math.max(insets.bottom, 20) - 10 }]}>
        <TouchableOpacity
          style={[styles.rejectButton, isProcessing && styles.buttonDisabled]}
          onPress={handleSwipeLeft}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <X size={28} color={colors.semantic.error} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.likeButton, isProcessing && styles.buttonDisabled]}
          onPress={handleSwipeRight}
          activeOpacity={0.8}
          disabled={isProcessing}
        >
          <Heart size={28} color={colors.semantic.success} fill={colors.semantic.success} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },

  cardsContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardTouchable: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  imageContainer: {
    flex: 1,
    position: 'relative',
  },
  userImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  gradientBackground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: colors.semantic.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
    transform: [{ rotate: '15deg' }],
  },
  likeLabelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: colors.semantic.error,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    zIndex: 10,
    transform: [{ rotate: '-15deg' }],
  },
  nopeLabelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  compatibilityBadge: {
    backgroundColor: colors.cosmic.purple,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  compatibilityText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  distanceText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 4,
  },
  zodiacSign: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  userBio: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  interestText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 40,
    paddingTop: 20,
  },
  rejectButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.semantic.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.semantic.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[600],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 22,
  },
});