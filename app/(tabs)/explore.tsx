import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Filter, Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';
import CosmicCard from '@/components/CosmicCard';
import { mockUsers } from '@/mocks/users';

export default function ExploreScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [likedUsers, setLikedUsers] = useState<string[]>([]);
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  const handleLike = () => {
    const currentUser = mockUsers[currentIndex];
    setLikedUsers(prev => [...prev, currentUser.id]);
    setCurrentIndex(prev => (prev + 1) % mockUsers.length);
  };

  const handlePass = () => {
    setCurrentIndex(prev => (prev + 1) % mockUsers.length);
  };

  const currentUser = mockUsers[currentIndex];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.title}>Explorar Conexões</Text>
          <Text style={styles.subtitle}>Encontre sua alma gêmea cósmica</Text>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={colors.cosmic.purple} />
        </TouchableOpacity>
      </View>

      {/* Compatibility Tip */}
      <View style={styles.tipContainer}>
        <Sparkles size={16} color={colors.cosmic.gold} />
        <Text style={styles.tipText}>
          Perfis selecionados com base na sua compatibilidade astrológica e psicológica
        </Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scrollView}
      >
        <CosmicCard
          user={{
            ...currentUser,
            compatibilityScore: Math.floor(Math.random() * 20) + 80, // 80-99%
          }}
          onLike={handleLike}
          onPass={handlePass}
        />

        {/* Insights Section */}
        <View style={styles.insightsContainer}>
          <Text style={styles.insightsTitle}>Por que vocês são compatíveis?</Text>
          
          <View style={styles.insightItem}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>
              Ambos valorizam crescimento pessoal e espiritualidade
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>
              Signos de água criam uma conexão emocional profunda
            </Text>
          </View>
          
          <View style={styles.insightItem}>
            <View style={styles.insightDot} />
            <Text style={styles.insightText}>
              Personalidades complementares (INFP + ENFJ)
            </Text>
          </View>
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
  subtitle: {
    fontSize: 14,
    color: colors.neutral[600],
    marginTop: 2,
  },
  filterButton: {
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
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.cosmic.gold + '20',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  insightsContainer: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  insightDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cosmic.purple,
    marginTop: 6,
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: colors.neutral[700],
  },
  bottomSpacing: {
    height: 40,
  },
});