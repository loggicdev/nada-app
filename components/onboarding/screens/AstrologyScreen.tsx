import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function AstrologyScreen() {
  const { nextStep, previousStep, updateData, currentStep, totalSteps, progress, data } = useOnboarding();
  const [birthDate, setBirthDate] = useState<string>(data.birthDate || '');
  const [birthTime, setBirthTime] = useState<string>(data.birthTime || '');
  const [birthPlace, setBirthPlace] = useState<string>(data.birthPlace || '');

  const isValid = birthDate.length > 0;

  const handleNext = () => {
    if (isValid) {
      updateData({ birthDate, birthTime, birthPlace });
      nextStep();
    }
  };

  const formatDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);
    if (match) {
      return [match[1], match[2], match[3]].filter(Boolean).join('/');
    }
    return text;
  };

  const formatTime = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})$/);
    if (match) {
      return [match[1], match[2]].filter(Boolean).join(':');
    }
    return text;
  };

  return (
    <OnboardingLayout
      title='Dados astrológicos'
      subtitle='Usamos essas informações para calcular seu mapa astral completo'
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
          <Text style={styles.label}>Data de nascimento *</Text>
          <View style={styles.inputWrapper}>
            <Calendar size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='DD/MM/AAAA'
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDate(text))}
              keyboardType='numeric'
              maxLength={10}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Horário de nascimento</Text>
          <Text style={styles.sublabel}>Opcional, mas recomendado para maior precisão</Text>
          <View style={styles.inputWrapper}>
            <Clock size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='HH:MM'
              value={birthTime}
              onChangeText={(text) => setBirthTime(formatTime(text))}
              keyboardType='numeric'
              maxLength={5}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Local de nascimento</Text>
          <Text style={styles.sublabel}>Cidade e estado/país</Text>
          <View style={styles.inputWrapper}>
            <MapPin size={20} color={colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='Ex: São Paulo, SP'
              value={birthPlace}
              onChangeText={setBirthPlace}
              autoCapitalize='words'
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Seus dados astrológicos são usados apenas para calcular compatibilidades e insights personalizados. Nunca compartilhamos essas informações.
          </Text>
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
    marginBottom: 4,
  },
  sublabel: {
    fontSize: 14,
    color: colors.neutral[500],
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
  infoBox: {
    backgroundColor: colors.cosmic.lavender + '20',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: colors.neutral[600],
    lineHeight: 20,
    textAlign: 'center',
  },

});