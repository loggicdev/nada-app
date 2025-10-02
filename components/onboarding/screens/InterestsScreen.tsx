import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Heart, Search, X } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

const SUGGESTED_INTERESTS = [
  'Música', 'Cinema', 'Leitura', 'Esportes', 'Viagem', 'Fotografia',
  'Culinária', 'Arte', 'Dança', 'Tecnologia', 'Natureza', 'Fitness',
  'Yoga', 'Meditação', 'Astrologia', 'Psicologia', 'Filosofia', 'Moda',
  'Camping', 'Vegetarianismo', 'R&B', 'Sustentabilidade'
];

export default function InterestsScreen() {
  const { saveOnboardingData, nextStep, previousStep, currentStep, totalSteps, progress, isLoading } = useOnboarding();

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [searchText, setSearchText] = useState<string>('');

  const isValid = selectedInterests.length >= 3;

  const filteredInterests = SUGGESTED_INTERESTS.filter(interest =>
    interest.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(item => item !== interest));
    } else if (selectedInterests.length < 8) {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleNext = async () => {
    if (!isValid) return;

    try {
      // Salvar dados NO BANCO
      await saveOnboardingData({
        interests: selectedInterests,
      });

      // Avançar para o próximo step
      await nextStep();
    } catch (error) {
      console.error('❌ Erro ao salvar interesses:', error);
      Alert.alert('Erro', 'Não foi possível salvar seus interesses. Tente novamente.');
    }
  };

  return (
    <OnboardingLayout
      title='Interesses pessoais'
      subtitle='Escolha pelo menos 3 coisas que você realmente gosta'
      showBackButton
      onBack={previousStep}
      currentStep={currentStep}
      totalSteps={totalSteps}
      progress={progress}
      bottomButton={
        <>
          <View style={styles.helperContainer}>
            <Text style={styles.helperText}>
              {selectedInterests.length < 3 
                ? `Selecione pelo menos ${3 - selectedInterests.length} interesse(s)`
                : 'Perfeito! Continue quando estiver pronto'
              }
            </Text>
          </View>
          <FixedBottomButton
            title='Próximo'
            onPress={handleNext}
            disabled={!isValid}
            loading={isLoading}
          />
        </>
      }
    >
      <View style={styles.form}>
        <View style={styles.iconContainer}>
          <View style={styles.iconBackground}>
            <Heart size={32} color={colors.cosmic.purple} />
          </View>
        </View>

        <View style={styles.searchContainer}>
          <View style={styles.searchWrapper}>
            <Search size={20} color={colors.neutral[400]} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder='Buscar interesses...'
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>
        </View>

        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>
            Selecionados ({selectedInterests.length}/8)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedScroll}>
            <View style={styles.selectedList}>
              {selectedInterests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={styles.selectedChip}
                  onPress={() => handleInterestToggle(interest)}
                >
                  <Text style={styles.selectedChipText}>{interest}</Text>
                  <X size={16} color={colors.cosmic.purple} />
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.interestsGrid}>
          {filteredInterests.map((interest) => (
            <TouchableOpacity
              key={interest}
              style={[
                styles.interestChip,
                selectedInterests.includes(interest) && styles.interestChipSelected,
                selectedInterests.length >= 8 && !selectedInterests.includes(interest) && styles.interestChipDisabled
              ]}
              onPress={() => handleInterestToggle(interest)}
              disabled={selectedInterests.length >= 8 && !selectedInterests.includes(interest)}
            >
              <Text style={[
                styles.interestChipText,
                selectedInterests.includes(interest) && styles.interestChipTextSelected,
                selectedInterests.length >= 8 && !selectedInterests.includes(interest) && styles.interestChipTextDisabled
              ]}>
                {interest}
              </Text>
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
  searchContainer: {
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[900],
  },
  selectedContainer: {
    marginBottom: 20,
  },
  selectedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  selectedScroll: {
    maxHeight: 40,
  },
  selectedList: {
    flexDirection: 'row',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cosmic.purple,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },

  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestChip: {
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  interestChipSelected: {
    backgroundColor: colors.cosmic.lavender + '20',
    borderColor: colors.cosmic.purple,
  },
  interestChipDisabled: {
    opacity: 0.5,
  },
  interestChipText: {
    fontSize: 14,
    color: colors.neutral[600],
    fontWeight: '500',
  },
  interestChipTextSelected: {
    color: colors.cosmic.purple,
  },
  interestChipTextDisabled: {
    color: colors.neutral[400],
  },
  helperContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  helperText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
  },
});