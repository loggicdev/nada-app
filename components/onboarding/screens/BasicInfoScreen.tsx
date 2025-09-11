import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { User, Calendar } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

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
  const { nextStep, previousStep, updateData, currentStep, totalSteps, progress, data } = useOnboarding();
  const [name, setName] = useState<string>(data.name || '');
  const [age, setAge] = useState<string>(data.age?.toString() || '');
  const [gender, setGender] = useState<string>(data.gender || '');
  const [lookingFor, setLookingFor] = useState<string>(data.lookingFor || '');

  const isValid = name.length > 0 && age.length > 0 && gender.length > 0 && lookingFor.length > 0;

  const handleNext = () => {
    if (isValid) {
      updateData({ 
        name, 
        age: parseInt(age), 
        gender: gender as any, 
        lookingFor: lookingFor as any 
      });
      nextStep();
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