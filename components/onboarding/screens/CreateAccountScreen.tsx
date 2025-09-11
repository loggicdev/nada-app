import React, { useState } from 'react';
import { View, StyleSheet, TextInput } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function CreateAccountScreen() {
  const { nextStep, previousStep, updateData, currentStep, totalSteps, progress } = useOnboarding();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');


  const isValid = email.length > 0 && password.length >= 6 && password === confirmPassword;

  const handleNext = () => {
    if (isValid) {
      updateData({ email, password });
      nextStep();
    }
  };

  return (
    <OnboardingLayout
      title='Criar sua conta'
      subtitle='Vamos começar criando sua conta no Cosmic'
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
          <View style={styles.inputWrapper}>
            <Mail size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Seu email'
              value={email}
              onChangeText={setEmail}
              keyboardType='email-address'
              autoCapitalize='none'
              autoComplete='email'
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Senha (mínimo 6 caracteres)'
              value={password}
              onChangeText={setPassword}
              autoCapitalize='none'
              autoComplete='new-password'
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Lock size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Confirmar senha'
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize='none'
              autoComplete='new-password'
            />
          </View>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    flex: 1,
    paddingTop: 20,
  },
  inputContainer: {
    marginBottom: 20,
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

});