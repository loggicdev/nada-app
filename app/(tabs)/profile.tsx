import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, Pressable, Animated } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Edit3, Star, Heart, MessageCircle, Crown, User, Camera, LogOut, X } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useAuthContext } from '@/contexts/AuthContext';
import AvatarUploader from '@/components/profile/AvatarUploader';
import PhotoGrid from '@/components/profile/PhotoGrid';
import EditProfileBottomSheet from '@/components/profile/EditProfileBottomSheet';
import { supabase } from '@/lib/supabase';

interface UserStats {
  matchesCount: number;
  conversationsCount: number;
  averageCompatibility: number | null;
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user, profile } = useAuthContext();
  const [showLogoutSheet, setShowLogoutSheet] = useState(false);
  const [showEditProfileSheet, setShowEditProfileSheet] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);
  const [stats, setStats] = useState<UserStats>({
    matchesCount: 0,
    conversationsCount: 0,
    averageCompatibility: null,
  });

  // Animated values para o background e bottom sheet do logout
  const logoutSheetOpacity = useRef(new Animated.Value(0)).current;
  const logoutSheetTranslateY = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  useEffect(() => {
    if (profile?.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  // Função para buscar estatísticas do usuário
  const fetchUserStats = async () => {
    if (!user?.id) return;

    try {
      // Buscar número de matches (status = 'mutual')
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select('id, compatibility_score', { count: 'exact' })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('status', 'mutual');

      if (matchesError) {
        console.error('Erro ao buscar matches:', matchesError);
      }

      // Buscar conversas do usuário usando os match_ids
      let conversationsCount = 0;
      if (matchesData && matchesData.length > 0) {
        const matchIds = matchesData.map(m => m.id);
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .in('match_id', matchIds);

        if (conversationsError) {
          console.error('Erro ao buscar conversas:', conversationsError);
        } else {
          conversationsCount = conversationsData?.length || 0;
        }
      }

      // Calcular compatibilidade média
      const compatibilityScores = matchesData
        ?.map(m => m.compatibility_score)
        .filter((score): score is number => score !== null) || [];

      const averageCompatibility = compatibilityScores.length > 0
        ? Math.round(compatibilityScores.reduce((sum, score) => sum + score, 0) / compatibilityScores.length)
        : null;

      setStats({
        matchesCount: matchesData?.length || 0,
        conversationsCount,
        averageCompatibility,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Carregar estatísticas quando o componente montar
  useEffect(() => {
    fetchUserStats();
  }, [user?.id]);

  // Animar abertura do bottom sheet de logout apenas quando abre
  useEffect(() => {
    if (showLogoutSheet) {
      // Garantir que começa em 300 antes de animar
      logoutSheetTranslateY.setValue(300);
      logoutSheetOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(logoutSheetOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(logoutSheetTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showLogoutSheet]);

  const handleAvatarUploadComplete = (url: string) => {
    setAvatarUrl(url);
  };

  const handleOpenLogoutSheet = () => {
    setShowLogoutSheet(true);
  };

  const closeLogoutSheet = () => {
    // Animar saída
    Animated.parallel([
      Animated.timing(logoutSheetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(logoutSheetTranslateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Após animação, fechar modal
      setShowLogoutSheet(false);
    });
  };

  const handleConfirmLogout = async () => {
    closeLogoutSheet();
    // Aguardar animação antes de fazer logout
    setTimeout(async () => {
      try {
        await signOut();
        // O _layout.tsx vai redirecionar automaticamente para Welcome quando user for null
      } catch (error) {
        console.error('Erro ao fazer logout:', error);
      }
    }, 300);
  };

  // Calcular idade a partir da data de nascimento
  const calculateAge = (birthDate: string | null): number | null => {
    if (!birthDate) return null;

    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  };

  // Extrair cidade e estado do birth_place
  const getLocation = (): string => {
    if (!profile?.birth_place) return '';

    // birth_place vem como "Cidade, Estado, País"
    const parts = profile.birth_place.split(',').map(p => p.trim());
    if (parts.length >= 2) {
      return `${parts[0]}, ${parts[1]}`; // Retorna "Cidade, Estado"
    }

    return profile.birth_place;
  };

  const age = calculateAge(profile?.birth_date || null);
  const displayName = profile?.name || 'Usuário';
  const location = getLocation();

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meu Perfil</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color={colors.cosmic.purple} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileImageContainer}>
            {user && (
              <AvatarUploader
                userId={user.id}
                currentAvatarUrl={avatarUrl}
                onUploadComplete={handleAvatarUploadComplete}
                size={120}
              />
            )}

            {/* Add Photo Prompt */}
            {!avatarUrl && (
              <View style={styles.addPhotoPrompt}>
                <Text style={styles.addPhotoText}>Adicione sua primeira foto</Text>
                <Text style={styles.addPhotoSubtext}>Perfis com fotos recebem 10x mais matches</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.profileName}>
            {displayName}{age ? `, ${age}` : ''}
          </Text>
          {location && <Text style={styles.profileLocation}>{location}</Text>}

          <View style={styles.tagsContainer}>
            {profile?.zodiac_sign && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{profile.zodiac_sign}</Text>
              </View>
            )}
            {profile?.communication_style && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{profile.communication_style}</Text>
              </View>
            )}
            {profile?.looking_for && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{profile.looking_for}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Photo Grid */}
        {user && (
          <PhotoGrid userId={user.id} avatarUrl={avatarUrl} />
        )}

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Heart size={20} color={colors.cosmic.rose} />
            <Text style={styles.statNumber}>{stats.matchesCount}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={20} color={colors.cosmic.sage} />
            <Text style={styles.statNumber}>{stats.conversationsCount}</Text>
            <Text style={styles.statLabel}>Conversas</Text>
          </View>
          <View style={styles.statItem}>
            <Star size={20} color={colors.cosmic.gold} />
            <Text style={styles.statNumber}>
              {stats.averageCompatibility !== null ? `${stats.averageCompatibility}%` : '-'}
            </Text>
            <Text style={styles.statLabel}>Compatibilidade Média</Text>
          </View>
        </View>

        {/* Premium Banner */}
        <LinearGradient
          colors={[colors.cosmic.gold, colors.cosmic.rose]}
          style={styles.premiumBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.premiumContent}>
            <Crown size={24} color="white" />
            <View style={styles.premiumText}>
              <Text style={styles.premiumTitle}>Cosmic Premium</Text>
              <Text style={styles.premiumSubtitle}>Desbloqueie insights profundos e rituais exclusivos</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.premiumButton}>
            <Text style={styles.premiumButtonText}>Assinar</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Cosmic Profile */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Perfil Cósmico</Text>
          <View style={styles.cosmicCard}>
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicLabel}>Signo Solar:</Text>
              <Text style={styles.cosmicValue}>Peixes ♓</Text>
            </View>
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicLabel}>Signo Lunar:</Text>
              <Text style={styles.cosmicValue}>Câncer ♋</Text>
            </View>
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicLabel}>Ascendente:</Text>
              <Text style={styles.cosmicValue}>Virgem ♍</Text>
            </View>
            <View style={styles.cosmicRow}>
              <Text style={styles.cosmicLabel}>Tipo Psicológico:</Text>
              <Text style={styles.cosmicValue}>INFP - Mediadora</Text>
            </View>
          </View>
        </View>

        {/* Menu Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Configurações</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={() => setShowEditProfileSheet(true)}>
            <Text style={styles.menuText}>Editar Perfil</Text>
            <Edit3 size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Preferências de Descoberta</Text>
            <Settings size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Mudar de Modo</Text>
            <Star size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Privacidade e Segurança</Text>
            <Settings size={16} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleOpenLogoutSheet}>
            <Text style={[styles.menuText, { color: colors.cosmic.rose }]}>Sair do Aplicativo</Text>
            <LogOut size={16} color={colors.cosmic.rose} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Profile Bottom Sheet */}
      <EditProfileBottomSheet
        visible={showEditProfileSheet}
        onClose={() => setShowEditProfileSheet(false)}
      />

      {/* Bottom Sheet de Confirmação de Logout */}
      <Modal
        visible={showLogoutSheet}
        transparent
        animationType="none"
        onRequestClose={closeLogoutSheet}
      >
        <View style={styles.sheetModalContainer}>
          {/* Background com fade */}
          <Animated.View style={[styles.modalOverlay, { opacity: logoutSheetOpacity }]}>
            <Pressable style={styles.fullPressable} onPress={closeLogoutSheet} />
          </Animated.View>

          {/* Bottom Sheet com slide */}
          <Pressable
            style={styles.modalOverlayPressable}
            onPress={closeLogoutSheet}
          >
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: logoutSheetTranslateY }] }]}>
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View style={styles.sheetHandle} />

                <View style={styles.sheetContent}>
                  <Text style={styles.sheetTitle}>Sair do Aplicativo</Text>
                  <Text style={styles.sheetMessage}>
                    Tem certeza que deseja sair? Você pode fazer login novamente a qualquer momento.
                  </Text>

                  <View style={styles.sheetButtons}>
                    <TouchableOpacity
                      style={styles.sheetButtonCancel}
                      onPress={closeLogoutSheet}
                    >
                      <Text style={styles.sheetButtonCancelText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.sheetButtonConfirm}
                      onPress={handleConfirmLogout}
                    >
                      <Text style={styles.sheetButtonConfirmText}>Sair</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>
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
  settingsButton: {
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
  profileCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  addPhotoPrompt: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.cosmic.purple,
    marginBottom: 4,
  },
  addPhotoSubtext: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  profileLocation: {
    fontSize: 16,
    color: colors.neutral[600],
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  premiumBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  premiumContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  premiumText: {
    flex: 1,
    marginLeft: 12,
  },
  premiumTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  premiumSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
  premiumButton: {
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: 'flex-start',
  },
  premiumButtonText: {
    color: colors.cosmic.purple,
    fontSize: 16,
    fontWeight: '600',
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
  cosmicCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cosmicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  cosmicLabel: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  cosmicValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  menuText: {
    fontSize: 16,
    color: colors.neutral[800],
  },
  bottomSpacing: {
    height: 20,
  },
  // Bottom Sheet Styles
  sheetModalContainer: {
    flex: 1,
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullPressable: {
    flex: 1,
  },
  modalOverlayPressable: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  sheetMessage: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetButtonCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  sheetButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  sheetButtonConfirm: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.cosmic.rose,
    alignItems: 'center',
  },
  sheetButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});