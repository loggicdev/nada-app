import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import OnboardingLayout from '@/components/onboarding/OnboardingLayout';
import FixedBottomButton from '@/components/onboarding/FixedBottomButton';
import colors from '@/constants/colors';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AstrologyScreen() {
  const { saveOnboardingData, nextStep, previousStep, currentStep, totalSteps, progress, isLoading } = useOnboarding();
  const { profile } = useAuthContext();

  const [birthDate, setBirthDate] = useState<string>('');
  const [birthTime, setBirthTime] = useState<string>('');
  const [birthPlace, setBirthPlace] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');

  // Converter data de YYYY-MM-DD para DD/MM/YYYY
  const convertISOToDisplay = (dateStr: string): string => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  };

  // Validar data de nascimento
  const validateDate = (dateStr: string): boolean => {
    // Verificar formato DD/MM/YYYY completo
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
      setDateError('Data incompleta. Use o formato DD/MM/AAAA');
      return false;
    }

    const [day, month, year] = dateStr.split('/').map(Number);

    // Validar ano (deve estar entre 1900 e ano atual)
    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      setDateError(`Ano deve estar entre 1900 e ${currentYear}`);
      return false;
    }

    // Validar mês (1-12)
    if (month < 1 || month > 12) {
      setDateError('Mês inválido. Deve estar entre 01 e 12');
      return false;
    }

    // Validar dia de acordo com o mês
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      setDateError(`Dia inválido para o mês ${month.toString().padStart(2, '0')}`);
      return false;
    }

    // Validar se não é data futura
    const inputDate = new Date(year, month - 1, day);
    if (inputDate > new Date()) {
      setDateError('Data de nascimento não pode ser futura');
      return false;
    }

    setDateError('');
    return true;
  };

  // Carregar dados do profile (se existirem)
  useEffect(() => {
    if (profile) {
      if (profile.birth_date) setBirthDate(convertISOToDisplay(profile.birth_date));
      if (profile.birth_time) setBirthTime(profile.birth_time);
      if (profile.birth_place) setBirthPlace(profile.birth_place);
    }
  }, [profile]);

  const isValid = birthDate.length === 10 && !dateError;

  const handleNext = async () => {
    // Validar data antes de prosseguir
    if (!validateDate(birthDate)) {
      return;
    }

    if (!isValid) return;

    try {
      // Salvar dados NO BANCO
      await saveOnboardingData({
        birthDate,
        birthTime: birthTime || undefined,
        birthPlace: birthPlace || undefined,
      });

      // Avançar para o próximo step
      await nextStep();
    } catch (error) {
      console.error('❌ Erro ao salvar informações astrológicas:', error);
      Alert.alert('Erro', 'Não foi possível salvar suas informações. Tente novamente.');
    }
  };

  const formatDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);
    if (match) {
      const formatted = [match[1], match[2], match[3]].filter(Boolean).join('/');

      // Validar enquanto digita (somente quando completo)
      if (formatted.length === 10) {
        validateDate(formatted);
      } else {
        setDateError(''); // Limpar erro se ainda não completou
      }

      return formatted;
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
          loading={isLoading}
        />
      }
    >
      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Data de nascimento *</Text>
          <View style={[
            styles.inputWrapper,
            dateError ? styles.inputWrapperError : null
          ]}>
            <Calendar size={20} color={dateError ? colors.cosmic.rose : colors.neutral[400]} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder='DD/MM/AAAA'
              value={birthDate}
              onChangeText={(text) => setBirthDate(formatDate(text))}
              keyboardType='numeric'
              maxLength={10}
            />
          </View>
          {dateError ? (
            <Text style={styles.errorText}>{dateError}</Text>
          ) : null}
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
  inputWrapperError: {
    borderColor: colors.cosmic.rose,
    backgroundColor: colors.cosmic.rose + '10',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.neutral[900],
  },
  errorText: {
    fontSize: 14,
    color: colors.cosmic.rose,
    marginTop: 8,
    marginLeft: 4,
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
