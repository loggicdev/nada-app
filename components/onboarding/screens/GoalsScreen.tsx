import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Target } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

const GOAL_OPTIONS = [
  { id: 'dating', label: 'Paquera', subtitle: 'Novas pessoas e conversas interessantes' },
  { id: 'serious', label: 'Relacionamento sério', subtitle: 'Busco algo duradouro' },
  { id: 'marriage', label: 'Casamento', subtitle: 'Pronto para o próximo passo' },
  { id: 'friendship', label: 'Amizades', subtitle: 'Conexões platônicas' },
];

export default function GoalsScreen() {
  const { nextStep, previousStep, updateData, currentStep, totalSteps, progress, data } = useOnboarding();
  const [selectedGoals, setSelectedGoals] = useState<string[]>(data.goals || []);

  const isValid = selectedGoals.length > 0;

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleNext = () => {
    if (isValid) {
      updateData({ goals: selectedGoals as any });
      nextStep();
    }
  };

  return (
    <OnboardingLayout
      title='O que você está buscando?'
      subtitle='Selecione uma ou mais opções'
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
            <Target size={32} color={colors.cosmic.purple} />
          </View>
        </View>

        <View style={styles.optionsContainer}>
          {GOAL_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedGoals.includes(option.id) && styles.optionCardSelected
              ]}
              onPress={() => handleGoalToggle(option.id)}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionLabel,
                  selectedGoals.includes(option.id) && styles.optionLabelSelected
                ]}>
                  {option.label}
                </Text>
                <Text style={[
                  styles.optionSubtitle,
                  selectedGoals.includes(option.id) && styles.optionSubtitleSelected
                ]}>
                  {option.subtitle}
                </Text>
              </View>
              <View style={[
                styles.checkbox,
                selectedGoals.includes(option.id) && styles.checkboxSelected
              ]}>
                {selectedGoals.includes(option.id) && (
                  <View style={styles.checkmark} />
                )}
              </View>
            </TouchableOpacity>
          ))}
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
    marginBottom: 32,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.cosmic.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    padding: 20,
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
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 4,
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
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.cosmic.purple,
    borderColor: colors.cosmic.purple,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },

});