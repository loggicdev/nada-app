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
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Perfil", headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OnboardingProvider>
          <MatchContext>
            <GestureHandlerRootView style={styles.gestureContainer}>
              <RootLayoutNav />
            </GestureHandlerRootView>
          </MatchContext>
        </OnboardingProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  gestureContainer: {
    flex: 1,
  },
});