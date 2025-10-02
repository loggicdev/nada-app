import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { MatchContext } from "@/contexts/MatchContext";
import { AuthProvider, useAuthContext } from "@/contexts/AuthContext";
import OnboardingScreen from "./onboarding";
import { View, ActivityIndicator, Platform, StyleSheet } from "react-native";
import colors from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/**
 * RootLayoutNav - Navegação principal baseada em estado de auth
 *
 * Lógica cristalina:
 * 1. Se loading → mostrar loader
 * 2. Se não tem user → mostrar rotas públicas (onboarding público + login)
 * 3. Se tem user MAS onboarding incompleto → mostrar onboarding
 * 4. Se tem user E onboarding completo → mostrar app
 */
function RootLayoutNav() {
  const { user, profile, loading } = useAuthContext();
  const router = useRouter();
  const segments = useSegments();
  const [hasRedirected, setHasRedirected] = React.useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  useEffect(() => {
    console.log('🔄 _layout state:', {
      loading,
      hasUser: !!user,
      hasProfile: !!profile,
      onboardingStep: profile?.onboarding_current_step,
      onboardingCompleted: profile?.onboarding_completed_at,
      segments: segments.join('/')
    });
  }, [loading, user, profile, segments]);

  // Proteção de rotas: redirecionar para Welcome quando logout
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'chat' || segments[0] === 'profile';

    if (!user && inAuthGroup && !hasRedirected) {
      // Usuário deslogado mas está em rota protegida -> redirecionar para Welcome
      console.log('🔒 Redirecionando para Welcome - usuário não autenticado, segment:', segments[0]);
      setHasRedirected(true);
      // Usar setTimeout para dar tempo da navegação acontecer
      setTimeout(() => {
        router.replace('/onboarding');
      }, 100);
    } else if (user && hasRedirected) {
      // Reset flag quando usuário faz login de novo
      setHasRedirected(false);
    }
  }, [user, loading, segments, hasRedirected]);

  // 1. Loading - Aguardando verificação de auth
  if (loading) {
    console.log('⏳ Mostrando tela de loading...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  // 2. Não autenticado - Rotas públicas
  if (!user) {
    console.log('🚪 Não autenticado - mostrando rotas públicas');
    return (
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, title: '' }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // 3. Autenticado MAS aguardando profile carregar
  if (user && !profile) {
    console.log('⏳ User existe mas profile ainda não carregou - aguardando...');
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  // 4. Autenticado MAS onboarding incompleto
  const isOnboardingComplete = profile?.onboarding_completed_at !== null;

  if (!isOnboardingComplete) {
    console.log('📋 Onboarding incompleto - step:', profile?.onboarding_current_step);
    return <OnboardingScreen />;
  }

  // 4. Autenticado E onboarding completo - App principal
  console.log('✅ Onboarding completo - mostrando app');
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Perfil", headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <OnboardingProvider>
            <MatchContext>
              <GestureHandlerRootView style={styles.gestureContainer}>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </MatchContext>
          </OnboardingProvider>
        </QueryClientProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  gestureContainer: {
    flex: 1,
  },
});