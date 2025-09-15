import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as SystemUI from "expo-system-ui";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { MatchContext } from "@/contexts/MatchContext";
import { Platform, StyleSheet } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[id]" options={{ title: "Perfil", headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: "modal" }} />
      </Stack>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.gestureContainer}>
          <QueryClientProvider client={queryClient}>
            <OnboardingProvider>
              <MatchContext>
                <RootLayoutNav />
              </MatchContext>
            </OnboardingProvider>
          </QueryClientProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
});