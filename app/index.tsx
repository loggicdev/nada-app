import { Redirect } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function Index() {
  const { user, loading: authLoading } = useAuthContext();
  const { isCompleted, isLoading: onboardingLoading } = useOnboarding();

  // Show loading while checking auth status
  if (authLoading || onboardingLoading) {
    return null; // Let the loading be handled by RootLayoutNav
  }

  // If user is not authenticated, redirect to onboarding (public)
  if (!user) {
    return <Redirect href="/onboarding" />;
  }

  // If user is authenticated but onboarding is not completed
  if (!isCompleted) {
    return <Redirect href="/onboarding" />;
  }

  // User is authenticated and onboarding is complete
  return <Redirect href="/(tabs)" />;
}