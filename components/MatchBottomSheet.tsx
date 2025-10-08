import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Heart, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '@/constants/colors';
import { Database } from '@/types/database';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';

const { height } = Dimensions.get('window');

type Match = Database['public']['Tables']['matches']['Row'] & {
  user_profile?: Database['public']['Tables']['user_profiles']['Row'];
};

interface MatchBottomSheetProps {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
}

export default function MatchBottomSheet({ visible, match, onClose }: MatchBottomSheetProps) {
  const slideAnim = useRef(new Animated.Value(height)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [isLoading, setIsLoading] = useState(false);

  console.log('🎭 [MatchBottomSheet] Props recebidas:', {
    visible,
    matchId: match?.id,
    userName: match?.user_profile?.name,
    hasUserProfile: !!match?.user_profile
  });

  useEffect(() => {
    console.log('🎭 [MatchBottomSheet] useEffect triggered - visible:', visible);
    if (visible) {
      console.log('🎬 [MatchBottomSheet] Iniciando animação de entrada');
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 50,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          delay: 150,
          friction: 5,
          tension: 40,
        }),
      ]).start(() => {
        console.log('✅ [MatchBottomSheet] Animação de entrada concluída');
      });
    } else {
      console.log('🎬 [MatchBottomSheet] Iniciando animação de saída');
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        console.log('✅ [MatchBottomSheet] Animação de saída concluída');
      });
    }
  }, [visible]);

  const handleSendMessage = async () => {
    if (isLoading || !match) return;

    setIsLoading(true);
    try {
      // Buscar se já existe uma conversa para este match
      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('match_id', match.id)
        .single();

      if (existingConversation) {
        // Se já existe conversa, redireciona
        onClose();
        router.push(`/chat/${existingConversation.id}`);
      } else {
        // Se não existe conversa, cria uma nova
        const { data: newConversation, error } = await supabase
          .from('conversations')
          .insert({
            match_id: match.id,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (error) {
          console.error('Erro ao criar conversa:', error);
          return;
        }

        console.log('✅ Nova conversa criada:', newConversation.id);
        onClose();
        router.push(`/chat/${newConversation.id}`);
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeepSwiping = () => {
    console.log('🔄 [MatchBottomSheet] Usuário escolheu continuar deslizando');
    onClose();
  };

  if (!match?.user_profile) {
    console.log('❌ [MatchBottomSheet] Retornando null - sem match ou user_profile');
    return null;
  }

  console.log('✅ [MatchBottomSheet] Renderizando componente para:', match.user_profile.name);

  const { name, age, avatar_url, zodiac_sign } = match.user_profile;
  const compatibility = match.compatibility_score || 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Background Overlay */}
        <Animated.View style={[styles.background, { opacity: opacityAnim }]}>
          <Pressable style={styles.fullPressable} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet Container */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Pressable style={styles.sheetContent} onPress={(e) => e.stopPropagation()}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Hearts Animation */}
            <Animated.View
              style={[
                styles.heartsContainer,
                {
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={[colors.cosmic.purple, colors.cosmic.lavender]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heartCircle}
              >
                <Heart size={50} color="#fff" fill="#fff" />
              </LinearGradient>
            </Animated.View>

            {/* Title */}
            <Text style={styles.title}>É um Match!</Text>
            <Text style={styles.subtitle}>
              Vocês deram like um no outro
            </Text>

            {/* Compatibility Score */}
            <LinearGradient
              colors={[colors.cosmic.purple, colors.cosmic.lavender]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.compatibilityBadge}
            >
              <Text style={styles.compatibilityText}>{compatibility}% compatíveis</Text>
            </LinearGradient>

            {/* Profile Card */}
            <View style={styles.profileCard}>
              {avatar_url ? (
                <Image
                  source={{ uri: avatar_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <LinearGradient
                  colors={[colors.cosmic.purple, colors.cosmic.lavender]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.avatar, styles.avatarPlaceholder]}
                >
                  <Text style={styles.avatarPlaceholderText}>
                    {name?.charAt(0).toUpperCase()}
                  </Text>
                </LinearGradient>
              )}

              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {name}, {age}
                </Text>
                {zodiac_sign && (
                  <Text style={styles.profileZodiac}>{zodiac_sign}</Text>
                )}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.primaryButton, isLoading && styles.buttonDisabled]}
                onPress={handleSendMessage}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MessageCircle size={20} color="#fff" />
                    <Text style={styles.primaryButtonText}>Enviar mensagem</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                style={styles.secondaryButton}
                onPress={handleKeepSwiping}
                disabled={isLoading}
              >
                <Text style={styles.secondaryButtonText}>Continuar deslizando</Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  fullPressable: {
    flex: 1,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '85%',
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[400],
    borderRadius: 2,
    marginBottom: 24,
  },
  heartsContainer: {
    marginBottom: 24,
  },
  heartCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.cosmic.purple,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[700],
    marginBottom: 20,
    textAlign: 'center',
  },
  compatibilityBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 32,
  },
  compatibilityText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  profileZodiac: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  actions: {
    width: '100%',
    gap: 12,
    marginBottom: 30,
  },
  primaryButton: {
    backgroundColor: colors.cosmic.purple,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
    shadowColor: colors.cosmic.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.neutral[300],
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: colors.neutral[700],
    fontSize: 17,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
