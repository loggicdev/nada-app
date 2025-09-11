import React, { useEffect } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Sun, Heart, TrendingUp, Compass, MessageCircle } from 'lucide-react-native';
import colors from '@/constants/colors';
import CosmicInsight from '@/components/CosmicInsight';

export default function JourneyScreen() {
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Bom dia' : currentHour < 18 ? 'Boa tarde' : 'Boa noite';
  const greetingIcon = currentHour < 18 ? Sun : Moon;
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            {React.createElement(greetingIcon, { 
              size: 24, 
              color: colors.cosmic.gold 
            })}
            <Text style={styles.greeting}>{greeting}, Luna</Text>
          </View>
          <Text style={styles.subtitle}>Sua jornada cósmica de hoje</Text>
        </View>

        {/* Current Mode Status */}
        <LinearGradient
          colors={[colors.cosmic.deep, colors.cosmic.purple]}
          style={styles.modeCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.modeHeader}>
            <Text style={styles.modeTitle}>Modo Paquera Ativo</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Ativo</Text>
            </View>
          </View>
          <Text style={styles.modeDescription}>
            Você está aberta para novas conexões. O universo está alinhado para encontros especiais.
          </Text>
          <View style={styles.modeStats}>
            <View style={styles.statItem}>
              <Heart size={16} color={colors.cosmic.rose} />
              <Text style={styles.statText}>3 novos matches</Text>
            </View>
            <View style={styles.statItem}>
              <TrendingUp size={16} color={colors.cosmic.sage} />
              <Text style={styles.statText}>87% compatibilidade média</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Daily Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights Cósmicos</Text>
          
          <CosmicInsight
            title="Previsão Astrológica"
            description="Vênus em trígono com sua Lua natal favorece conexões emocionais profundas. É um ótimo momento para conversas íntimas."
            type="daily"
          />
          
          <CosmicInsight
            title="Ritual do Dia"
            description="Medite por 5 minutos visualizando seu parceiro ideal. A energia de Peixes está forte para manifestações."
            type="ritual"
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Recomendadas</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <Compass size={24} color={colors.cosmic.purple} />
              </View>
              <Text style={styles.actionTitle}>Explorar Perfis</Text>
              <Text style={styles.actionSubtitle}>3 matches esperando</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <View style={styles.actionIcon}>
                <MessageCircle size={24} color={colors.cosmic.sage} />
              </View>
              <Text style={styles.actionTitle}>Iniciar Conversa</Text>
              <Text style={styles.actionSubtitle}>2 mensagens não lidas</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compatibility Highlight */}
        <CosmicInsight
          title="Match em Destaque"
          description="Gabriel (92% compatível) compartilha seus valores de crescimento espiritual. Escorpião + Peixes = conexão profunda garantida!"
          type="compatibility"
        />

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
    padding: 20,
    paddingBottom: 10,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  modeCard: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
  },
  modeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.cosmic.sage,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  modeDescription: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 16,
  },
  modeStats: {
    flexDirection: 'row',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginHorizontal: 20,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  actionCard: {
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
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[800],
    textAlign: 'center',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});