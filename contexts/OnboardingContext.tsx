import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { OnboardingData, ONBOARDING_STEPS } from '@/types/onboarding';

const ONBOARDING_STORAGE_KEY = 'onboarding_completed';
const ONBOARDING_DATA_KEY = 'onboarding_data';

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [data, setData] = useState<OnboardingData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      const [completedState, savedData] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_STORAGE_KEY),
        AsyncStorage.getItem(ONBOARDING_DATA_KEY)
      ]);
      
      if (completedState === 'true') {
        setIsCompleted(true);
      }
      
      if (savedData) {
        setData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('Error loading onboarding state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateData = useCallback(async (newData: Partial<OnboardingData>) => {
    const updatedData = { ...data, ...newData };
    setData(updatedData);
    
    try {
      await AsyncStorage.setItem(ONBOARDING_DATA_KEY, JSON.stringify(updatedData));
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  }, [data]);

  const nextStep = useCallback(() => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, 'true');
      setIsCompleted(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY),
        AsyncStorage.removeItem(ONBOARDING_DATA_KEY)
      ]);
      setIsCompleted(false);
      setCurrentStep(0);
      setData({});
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  }, []);

  return useMemo(() => ({
    isCompleted,
    isLoading,
    currentStep,
    data,
    updateData,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
    totalSteps: ONBOARDING_STEPS.length,
    progress: (currentStep + 1) / ONBOARDING_STEPS.length
  }), [isCompleted, isLoading, currentStep, data, updateData, nextStep, previousStep, completeOnboarding, resetOnboarding]);
});