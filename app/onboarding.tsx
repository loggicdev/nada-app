import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import WelcomeScreen from '@/components/onboarding/screens/WelcomeScreen';
import CreateAccountScreen from '@/components/onboarding/screens/CreateAccountScreen';
import BasicInfoScreen from '@/components/onboarding/screens/BasicInfoScreen';
import AstrologyScreen from '@/components/onboarding/screens/AstrologyScreen';
import GoalsScreen from '@/components/onboarding/screens/GoalsScreen';
import InterestsScreen from '@/components/onboarding/screens/InterestsScreen';
import LifestyleScreen from '@/components/onboarding/screens/LifestyleScreen';
import CompletionScreen from '@/components/onboarding/screens/CompletionScreen';

export default function OnboardingScreen() {
  const { currentStep } = useOnboarding();

  console.log('📱 OnboardingScreen renderizando com currentStep:', currentStep);

  const renderCurrentScreen = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeScreen />;
      case 1:
        return <CreateAccountScreen />;
      case 2:
        return <BasicInfoScreen />;
      case 3:
        return <AstrologyScreen />;
      case 4:
        return <GoalsScreen />;
      case 5:
        return <InterestsScreen />;
      case 6:
        return <LifestyleScreen />;
      case 7:
        return <CompletionScreen />;
      default:
        return <WelcomeScreen />;
    }
  };

  return (
    <View style={styles.container}>
      {renderCurrentScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});