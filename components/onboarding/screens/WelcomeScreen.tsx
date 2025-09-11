import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import OnboardingButton from '@/components/onboarding/OnboardingButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const { nextStep, completeOnboarding } = useOnboarding();
  const insets = useSafeAreaInsets();

  const handleCreateAccount = () => {
    nextStep();
  };

  const handleLogin = () => {
    console.log('Login pressed');
  };

  const handleGoogleLogin = () => {
    console.log('Google login pressed');
  };

  const handleSkipOnboarding = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };



  return (
    <OnboardingLayout showProgress={false}>
      <View style={styles.container}>
        <TouchableOpacity 
          style={styles.skipButton}
          onPress={handleSkipOnboarding}
        >
          <Text style={styles.skipButtonText}>Pular</Text>
        </TouchableOpacity>
        
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Sparkles size={48} color={colors.cosmic.purple} />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>Dating App</Text>
            <Text style={styles.subtitle}>
              Encontre conexões profundas e compatíveis
            </Text>
          </View>
        </View>

        <View style={styles.buttonsSection}>
          <View style={styles.mainButtons}>
            <OnboardingButton
              title='Criar Conta'
              onPress={handleCreateAccount}
              variant='primary'
            />
            
            <OnboardingButton
              title='Entrar'
              onPress={handleLogin}
              variant='outline'
            />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Or Signup with</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/7aghkoavm8xq9vvpqetf5' }}
              style={styles.googleIcon}
              resizeMode="contain"
            />
            <Text style={styles.googleButtonText}>Google</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Text style={styles.termsText}>
            I accept all the{' '}
            <Text style={styles.termsLink}>Terms & Conditions</Text>
            {' & '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cosmic.lavender + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonsSection: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 40,
  },
  mainButtons: {
    gap: 16,
    marginBottom: 32,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.neutral[200],
  },
  dividerText: {
    fontSize: 14,
    color: colors.neutral[500],
    marginHorizontal: 16,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 24,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.neutral[700],
  },

  footer: {
    alignItems: 'center',
  },
  termsText: {
    fontSize: 14,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 20,
  },
  termsLink: {
    color: colors.cosmic.purple,
    fontWeight: '500',
  },
  skipButton: {
    position: 'absolute',
    top: 20,
    right: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    zIndex: 1,
  },
  skipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[600],
  },
});