import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import colors from '@/constants/colors';
import ProgressBar from './ProgressBar';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
  showBackButton?: boolean;
  currentStep?: number;
  totalSteps?: number;
  progress?: number;
  onBack?: () => void;
  bottomButton?: React.ReactNode;
}

export default function OnboardingLayout({
  children,
  title,
  subtitle,
  showProgress = true,
  showBackButton = false,
  currentStep = 0,
  totalSteps = 8,
  progress = 0,
  onBack,
  bottomButton,
}: OnboardingLayoutProps) {
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    // Configure status bar for darker appearance
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setBackgroundColor('#ffffff', true);
    } else if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, []);
  
  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 8 }]}>
        {showProgress && (
          <ProgressBar 
            progress={progress} 
            currentStep={currentStep} 
            totalSteps={totalSteps} 
          />
        )}
      </View>
      
      {/* Main Content */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Back Button */}
          {showBackButton && (
            <View style={styles.backButtonContainer}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ArrowLeft size={24} color={colors.neutral[600]} />
              </TouchableOpacity>
            </View>
          )}
          
          {/* Header - Removido para economizar espaço */}
          
          {/* Content */}
          <View style={styles.content}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Bottom Button */}
      {bottomButton && bottomButton}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  progressContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 8,
    paddingBottom: 120,
  },
  backButtonContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
});