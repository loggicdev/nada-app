import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { User, Calendar } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuthContext } from '@/contexts/AuthContext';

const genderOptions = [
  { id: 'feminine', label: 'Feminino' },
  { id: 'masculine', label: 'Masculino' },
  { id: 'non-binary', label: 'Não-binário' },
];

const lookingForOptions = [
  { id: 'women', label: 'Mulheres' },
  { id: 'men', label: 'Homens' },
  { id: 'everyone', label: 'Todos' },
];

export default function BasicInfoScreen() {
  const { saveOnboardingData, nextStep, previousStep, currentStep, totalSteps, progress, isLoading } = useOnboarding();
  const { profile } = useAuthContext();

  const [name, setName] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [lookingFor, setLookingFor] = useState<string>('');

  // Carregar dados do profile (se existirem)
  useEffect(() => {
    if (profile) {
      if (profile.name) setName(profile.name);
      if (profile.age) setAge(profile.age.toString());
      if (profile.gender) setGender(profile.gender);
      if (profile.looking_for) setLookingFor(profile.looking_for);
    }
  }, [profile]);

  const isValid = name.length > 0 && age.length > 0 && gender.length > 0 && lookingFor.length > 0;

  const handleNext = async () => {
    if (!isValid) return;

    try {
      // Salvar dados NO BANCO
      await saveOnboardingData({
        name,
        age: parseInt(age),
        gender: gender as 'feminine' | 'masculine' | 'non-binary',
        lookingFor: lookingFor as 'women' | 'men' | 'everyone',
      });

      // Avançar para o próximo step (também salva no banco)
      await nextStep();
    } catch (error) {
      console.error('❌ Erro ao salvar informações básicas:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas informações. Tente novamente.');
    }
  };

  return (
    <OnboardingLayout
      title='Informações básicas'
      subtitle='Conte-nos um pouco sobre você'
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
          loading={isLoading}
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nome</Text>
          <View style={styles.inputWrapper}>
            <User size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Seu nome'
              value={name}
              onChangeText={setName}
              autoCapitalize='words'
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Idade</Text>
          <View style={styles.inputWrapper}>
            <Calendar size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Sua idade'
              value={age}
              onChangeText={setAge}
              keyboardType='numeric'
              maxLength={2}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Gênero</Text>
          <View style={styles.optionsContainer}>
            {genderOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  gender === option.id && styles.selectedOption,
                ]}
                onPress={() => setGender(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    gender === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Procurando por</Text>
          <View style={styles.optionsContainer}>
            {lookingForOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionButton,
                  lookingFor === option.id && styles.selectedOption,
                ]}
                onPress={() => setLookingFor(option.id)}
              >
                <Text
                  style={[
                    styles.optionText,
                    lookingFor === option.id && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[900],
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  selectedOption: {
    backgroundColor: colors.cosmic.purple,
    borderColor: colors.cosmic.purple,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  selectedOptionText: {
    color: 'white',
  },
});
