import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Activity } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

const LIFESTYLE_OPTIONS = {
  alcohol: [
    { id: 'never', label: 'Nunca', subtitle: 'Não bebo álcool' },
    { id: 'socially', label: 'Socialmente', subtitle: 'Apenas em ocasiões especiais' },
    { id: 'regularly', label: 'Regularmente', subtitle: 'Faço parte da minha rotina' },
  ],
  smoking: [
    { id: 'never', label: 'Não fumo', subtitle: 'Nunca fumei' },
    { id: 'socially', label: 'Socialmente', subtitle: 'Apenas em ocasiões especiais' },
    { id: 'regularly', label: 'Regularmente', subtitle: 'Faço parte da minha rotina' },
  ],
  exercise: [
    { id: 'never', label: 'Nunca', subtitle: 'Não pratico exercícios' },
    { id: 'sometimes', label: 'Às vezes', subtitle: '1-2 vezes por semana' },
    { id: 'regularly', label: 'Regularmente', subtitle: '3-4 vezes por semana' },
    { id: 'daily', label: 'Diariamente', subtitle: 'Todos os dias' },
  ],
};

export default function LifestyleScreen() {
  const { nextStep, previousStep, updateData, currentStep, totalSteps, progress, data } = useOnboarding();
  const [lifestyle, setLifestyle] = useState(data.lifestyle || {});

  const isValid = lifestyle.alcohol && lifestyle.smoking && lifestyle.exercise;

  const handleOptionSelect = (category: keyof typeof LIFESTYLE_OPTIONS, value: string) => {
    setLifestyle(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleNext = () => {
    if (isValid) {
      updateData({ lifestyle });
      nextStep();
    }
  };

  const renderCategory = (
    category: keyof typeof LIFESTYLE_OPTIONS,
    title: string,
    subtitle: string
  ) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{title}</Text>
      <Text style={styles.categorySubtitle}>{subtitle}</Text>
      <View style={styles.optionsContainer}>
        {LIFESTYLE_OPTIONS[category].map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionCard,
              lifestyle[category] === option.id && styles.optionCardSelected
            ]}
            onPress={() => handleOptionSelect(category, option.id)}
          >
            <View style={styles.optionContent}>
              <Text style={[
                styles.optionLabel,
                lifestyle[category] === option.id && styles.optionLabelSelected
              ]}>
                {option.label}
              </Text>
              <Text style={[
                styles.optionSubtitle,
                lifestyle[category] === option.id && styles.optionSubtitleSelected
              ]}>
                {option.subtitle}
              </Text>
            </View>
            <View style={[
              styles.radio,
              lifestyle[category] === option.id && styles.radioSelected
            ]}>
              {lifestyle[category] === option.id && (
                <View style={styles.radioDot} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <OnboardingLayout
      title='Estilo de vida'
      subtitle='Vamos falar sobre hábitos e estilo de vida'
      showBackButton
      onBack={previousStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={progress}
      bottomButton={
        <FixedBottomButton
          title='Próximo'
          onPress={handleNext}
          disabled={!isValid}
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Activity size={32} color={colors.cosmic.purple} />
          </View>
        </View>

        <View style={styles.categoriesContainer}>
          {renderCategory('alcohol', 'Consumo de álcool', 'Com que frequência você bebe?')}
          {renderCategory('smoking', 'Tabagismo', 'Você fuma?')}
          {renderCategory('exercise', 'Exercícios físicos', 'Com que frequência você se exercita?')}
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cosmic.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesContainer: {
    gap: 24,
  },
  categoryContainer: {
    marginBottom: 8,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  categorySubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 12,
  },
  optionsContainer: {
    gap: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
  },
  optionCardSelected: {
    backgroundColor: colors.cosmic.lavender + '10',
    borderColor: colors.cosmic.purple,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[700],
    marginBottom: 2,
  },
  optionLabelSelected: {
    color: colors.cosmic.purple,
  },
  optionSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  optionSubtitleSelected: {
    color: colors.cosmic.purple + '80',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.cosmic.purple,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cosmic.purple,
  },

});