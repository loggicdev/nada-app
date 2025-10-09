import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  ArrowLeft,
  Crown,
  Star,
  Eye,
  Heart,
  Sparkles,
  Zap,
  Shield,
  Calendar,
  Check,
} from 'lucide-react-native';
import colors from '@/constants/colors';

const { width: screenWidth } = Dimensions.get('window');

interface PlanOption {
  id: string;
  name: string;
  price: string;
  period: string;
  originalPrice?: string;
  discount?: string;
  popular?: boolean;
}

interface Feature {
  icon: any;
  title: string;
  description: string;
}

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = useState<string>('annual');

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  const plans: PlanOption[] = [
    {
      id: 'monthly',
      name: 'Mensal',
      price: 'R$ 29,90',
      period: 'por mês',
    },
    {
      id: 'annual',
      name: 'Anual',
      price: 'R$ 199,90',
      period: 'por ano',
      originalPrice: 'R$ 358,80',
      discount: '44% OFF',
      popular: true,
    },
  ];

  const features: Feature[] = [
    {
      icon: Eye,
      title: 'Insights Profundos',
      description: 'Análises astrológicas detalhadas e personalizadas do seu mapa natal completo',
    },
    {
      icon: Heart,
      title: 'Compatibilidade Avançada',
      description: 'Descobra a compatibilidade real com análise de múltiplos aspectos astrológicos',
    },
    {
      icon: Sparkles,
      title: 'Rituais Exclusivos',
      description: 'Acesso a rituais e práticas guiadas baseadas nas fases lunares e trânsitos planetários',
    },
    {
      icon: Zap,
      title: 'Previsões Diárias',
      description: 'Horóscopo personalizado e insights específicos para cada dia do seu ano',
    },
    {
      icon: Shield,
      title: 'Proteção Energética',
      description: 'Dicas e práticas para proteção e limpeza energética baseadas no seu perfil',
    },
    {
      icon: Calendar,
      title: 'Calendário Cósmico',
      description: 'Momentos ideais para decisões importantes baseados em trânsitos planetários',
    },
  ];

  const handlePurchase = () => {
    // TODO: Implementar integração com sistema de pagamento
    console.log('Iniciando compra do plano:', selectedPlan);
    // Por enquanto, mostrar um feedback
    alert('Redirecionando para pagamento...');
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <LinearGradient
          colors={[colors.cosmic.purple, colors.cosmic.rose, colors.cosmic.gold]}
          style={[styles.heroSection, { paddingTop: insets.top + 16 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Back Button */}
          <TouchableOpacity 
            style={[styles.backButton, { top: insets.top + 20 }]} 
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.heroContent}>
            <Crown size={48} color="white" />
            <Text style={styles.heroTitle}>Cosmic Premium</Text>
            <Text style={styles.heroSubtitle}>
              Desbloqueie o poder completo do universo e descubra insights profundos sobre seu destino
            </Text>
            <View style={styles.premiumBadge}>
              <Star size={16} color={colors.cosmic.gold} fill={colors.cosmic.gold} />
              <Text style={styles.premiumBadgeText}>Experiência Completa</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O que você vai desbloquear</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <feature.icon size={24} color={colors.cosmic.purple} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Plans Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escolha seu plano</Text>
          <View style={styles.plansContainer}>
            {plans.map((plan) => (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  selectedPlan === plan.id && styles.selectedPlan,
                  plan.popular && styles.popularPlan,
                ]}
                onPress={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularBadgeText}>MAIS POPULAR</Text>
                  </View>
                )}
                
                <View style={styles.planHeader}>
                  <Text style={styles.planName}>{plan.name}</Text>
                </View>

                {plan.discount && (
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>{plan.discount}</Text>
                  </View>
                )}

                <View style={styles.planPricing}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>

                {plan.originalPrice && (
                  <Text style={styles.originalPrice}>De {plan.originalPrice}</Text>
                )}

                <View style={styles.planFeatures}>
                  <View style={styles.planFeature}>
                    <Check size={16} color={colors.semantic.success} />
                    <Text style={styles.planFeatureText}>Todos os recursos premium</Text>
                  </View>
                  <View style={styles.planFeature}>
                    <Check size={16} color={colors.semantic.success} />
                    <Text style={styles.planFeatureText}>Suporte prioritário</Text>
                  </View>
                  <View style={styles.planFeature}>
                    <Check size={16} color={colors.semantic.success} />
                    <Text style={styles.planFeatureText}>Atualizações exclusivas</Text>
                  </View>
                </View>

                {selectedPlan === plan.id && (
                  <View style={styles.selectedIndicator}>
                    <Check size={20} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity style={styles.purchaseButton} onPress={handlePurchase}>
            <LinearGradient
              colors={[colors.cosmic.purple, colors.cosmic.rose]}
              style={styles.purchaseButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Crown size={20} color="white" />
              <Text style={styles.purchaseButtonText}>
                Assinar {plans.find(p => p.id === selectedPlan)?.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            Cancele a qualquer momento. Sem compromissos.
          </Text>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  content: {
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  heroSection: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 0,
  },
  heroContent: {
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 24,
    marginBottom: 20,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  premiumBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[800],
    marginBottom: 20,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cosmic.purple + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
  },
  plansContainer: {
    gap: 16,
  },
  planCard: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedPlan: {
    borderColor: colors.cosmic.purple,
    shadowColor: colors.cosmic.purple,
    shadowOpacity: 0.2,
  },
  popularPlan: {
    borderColor: colors.cosmic.gold,
  },
  popularBadge: {
    position: 'absolute',
    top: -12,
    left: 20,
    right: 20,
    backgroundColor: colors.cosmic.gold,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
  },
  popularBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[800],
  },
  discountBadge: {
    backgroundColor: colors.semantic.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planPricing: {
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.cosmic.purple,
  },
  planPeriod: {
    fontSize: 14,
    color: colors.neutral[600],
    marginTop: 4,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.neutral[500],
    textDecorationLine: 'line-through',
    marginBottom: 16,
  },
  planFeatures: {
    gap: 8,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planFeatureText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  selectedIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cosmic.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaSection: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  purchaseButton: {
    width: '100%',
    marginBottom: 16,
  },
  purchaseButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  purchaseButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});