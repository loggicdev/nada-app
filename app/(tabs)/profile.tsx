import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Edit3, Star, Heart, MessageCircle, Crown, User, Camera, RotateCcw } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { resetOnboarding } = useOnboarding();
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  const handleResetOnboarding = () => {
    resetOnboarding();
  };
  
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
            {/* Profile Image or Placeholder */}
            <View style={styles.profileImageWrapper}>
              <LinearGradient
                colors={[colors.cosmic.purple, colors.cosmic.lavender]}
                style={styles.profileImagePlaceholder}
              >
                <User size={48} color="white" />
              </LinearGradient>
            </View>
            <TouchableOpacity style={styles.editImageButton}>
              <Camera size={16} color="white" />
            </TouchableOpacity>
            
            {/* Add Photo Prompt */}
            <View style={styles.addPhotoPrompt}>
              <Text style={styles.addPhotoText}>Adicione sua primeira foto</Text>
              <Text style={styles.addPhotoSubtext}>Perfis com fotos recebem 10x mais matches</Text>
            </View>
          </View>
          
          <Text style={styles.profileName}>Luna, 28</Text>
          <Text style={styles.profileLocation}>São Paulo, SP</Text>
          
          <View style={styles.tagsContainer}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Peixes</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>INFP</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>Modo Paquera</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Heart size={20} color={colors.cosmic.rose} />
            <Text style={styles.statNumber}>24</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </View>
          <View style={styles.statItem}>
            <MessageCircle size={20} color={colors.cosmic.sage} />
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Conversas</Text>
          </View>
          <View style={styles.statItem}>
            <Star size={20} color={colors.cosmic.gold} />
            <Text style={styles.statNumber}>89%</Text>
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
          
          <TouchableOpacity style={styles.menuItem}>
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
          
          <TouchableOpacity style={styles.menuItem} onPress={handleResetOnboarding}>
            <Text style={[styles.menuText, { color: colors.cosmic.rose }]}>Refazer Onboarding</Text>
            <RotateCcw size={16} color={colors.cosmic.rose} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
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
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginBottom: 12,
  },
  profileImagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoPrompt: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
  editImageButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cosmic.purple,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
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
});