import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { supabase } from '@/lib/supabase';

/**
 * CreateAccountScreen - Tela de criação de conta
 *
 * Fluxo:
 * 1. Usuário preenche email e senha
 * 2. Ao clicar em "Criar Conta", verifica se email já existe
 * 3. Se existe → Mostra toast e redireciona para login
 * 4. Se não existe → Cria conta e avança para próximo step
 */
export default function CreateAccountScreen() {
  const { nextStep, previousStep, currentStep, totalSteps, progress } = useOnboarding();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const isValid = email.length > 0 && password.length >= 6 && password === confirmPassword;

  const handleNext = async () => {
    if (!isValid) return;

    setLoading(true);

    try {
      // Tentar criar conta
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('❌ Erro ao criar conta:', error);

        // Email já registrado?
        if (
          error.message.includes('already registered') ||
          error.message.includes('User already registered') ||
          error.status === 422
        ) {
          Alert.alert(
            'Conta já existe',
            'Você já tem uma conta com este email. Faça login para continuar seu cadastro.',
            [
              {
                text: 'Ir para Login',
                onPress: () => {
                  setLoading(false);
                  router.replace('/auth/login');
                }
              },
              {
                text: 'Cancelar',
                style: 'cancel',
                onPress: () => setLoading(false)
              }
            ]
          );
          return;
        }

        // Outro erro
        Alert.alert('Erro ao criar conta', error.message || 'Tente novamente');
        setLoading(false);
        return;
      }

      if (!data.user) {
        Alert.alert('Erro', 'Não foi possível criar a conta');
        setLoading(false);
        return;
      }

      console.log('✅ Conta criada:', data.user.id);

      // Aguardar perfil ser criado pelo trigger e carregado pelo useAuth
      // Retry até profile estar disponível (máx 5 segundos)
      console.log('⏳ Aguardando perfil ser criado...');
      let retries = 10;
      while (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar se profile já foi carregado
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('id', data.user.id)
          .single();

        if (profileData) {
          console.log('✅ Perfil encontrado!');
          break;
        }

        retries--;
        if (retries === 0) {
          console.warn('⚠️ Timeout aguardando perfil, continuando mesmo assim...');
        }
      }

      // Avançar para próximo step
      await nextStep();
      setLoading(false);

    } catch (err) {
      console.error('❌ Erro inesperado:', err);
      Alert.alert('Erro', 'Erro inesperado. Tente novamente.');
      setLoading(false);
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
          title='Criar Conta'
          onPress={handleNext}
          disabled={!isValid}
          loading={loading}
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
              placeholderTextColor={colors.neutral[400]}
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
              secureTextEntry
              autoCapitalize='none'
              autoComplete='new-password'
              placeholderTextColor={colors.neutral[400]}
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
              secureTextEntry
              autoCapitalize='none'
              autoComplete='new-password'
              placeholderTextColor={colors.neutral[400]}
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
