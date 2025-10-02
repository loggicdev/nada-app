import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { CheckCircle, Sparkles, Users, Target } from 'lucide-react-native';
import { router } from 'expo-router';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

const PROCESSING_STEPS = [
  { id: 1, label: 'Calculando mapa astral', icon: Sparkles, duration: 2000 },
  { id: 2, label: 'Analisando compatibilidades', icon: Users, duration: 1500 },
  { id: 3, label: 'Preparando sugestões iniciais', icon: Target, duration: 1000 },
];

export default function CompletionScreen() {
  const { completeOnboarding, isLoading } = useOnboarding();
  
  const [currentProcessingStep, setCurrentProcessingStep] = useState<number>(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);

  useEffect(() => {
    const processSteps = async () => {
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        setCurrentProcessingStep(i);
        await new Promise(resolve => setTimeout(resolve, PROCESSING_STEPS[i].duration));
      }
      setIsProcessingComplete(true);
    };

    processSteps();
  }, []);

  const handleFinish = async () => {
    try {
      // Completar onboarding no banco
      await completeOnboarding();

      console.log('✅ Onboarding completo!');

      // Redirecionar para app principal
      router.replace('/(tabs)');
    } catch (error) {
      console.error('❌ Erro ao finalizar onboarding:', error);
      Alert.alert('Erro', 'Não foi possível finalizar. Tente novamente.');
    }
  };

  return (
    <OnboardingLayout
      title='Perfil Criado!'
      subtitle={isProcessingComplete ? 'Tudo pronto! Bem-vindo ao Cosmic' : 'Seu perfil está sendo processado...'}
      showProgress={false}
      bottomButton={
        <FixedBottomButton
          title={isProcessingComplete ? 'Começar a explorar' : 'Processando...'}
          onPress={handleFinish}
          disabled={!isProcessingComplete}
          loading={isLoading}
        />
      }
    >
      <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              {isProcessingComplete ? (
                <CheckCircle size={48} color={colors.cosmic.purple} />
              ) : (
                <ActivityIndicator size={48} color={colors.cosmic.purple} />
              )}
            </View>
          </View>

          <View style={styles.stepsContainer}>
            {PROCESSING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentProcessingStep || isProcessingComplete;
              const isActive = index === currentProcessingStep && !isProcessingComplete;

              return (
                <View key={step.id} style={styles.stepItem}>
                  <View style={[
                    styles.stepIcon,
                    isCompleted && styles.stepIconCompleted,
                    isActive && styles.stepIconActive
                  ]}>
                    {isCompleted ? (
                      <CheckCircle size={20} color={colors.cosmic.purple} />
                    ) : isActive ? (
                      <ActivityIndicator size={16} color={colors.cosmic.purple} />
                    ) : (
                      <Icon size={20} color={colors.neutral[400]} />
                    )}
                  </View>
                  <Text style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isActive && styles.stepLabelActive
                  ]}>
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>

          {isProcessingComplete && (
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>
                Seu perfil cósmico está pronto!
              </Text>
              <Text style={styles.successSubtitle}>
                Agora você pode explorar conexões profundas e descobrir pessoas compatíveis com você.
              </Text>
            </View>
          )}
        </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cosmic.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepIconCompleted: {
    backgroundColor: colors.cosmic.lavender + '20',
  },
  stepIconActive: {
    backgroundColor: colors.cosmic.lavender + '30',
  },
  stepLabel: {
    fontSize: 16,
    color: colors.neutral[500],
    fontWeight: '500',
  },
  stepLabelCompleted: {
    color: colors.cosmic.purple,
  },
  stepLabelActive: {
    color: colors.cosmic.purple,
  },
  successContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
});