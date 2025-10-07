import { Tabs, Redirect } from "expo-router";
import { Compass, MessageCircle, User, Sparkles, Heart } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, StatusBar, View, ActivityIndicator, StyleSheet } from "react-native";
import colors from "@/constants/colors";
import { useOnboarding } from "@/contexts/OnboardingContext";

export default function TabLayout() {
  const { isCompleted, isLoading } = useOnboarding();
  
  useEffect(() => {
    // Configure status bar for darker appearance in main app
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setBackgroundColor('#ffffff', true);
    } else if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  if (!isCompleted) {
    return <Redirect href="/onboarding" />;
  }
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.cosmic.purple,
        tabBarInactiveTintColor: colors.neutral[400],
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: colors.neutral[200],
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
          textAlign: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Jornada",
          tabBarIcon: ({ color, size }) => <Sparkles color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explorar",
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size} />,
          href: null,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: "Match",
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Mensagens",
          tabBarIcon: ({ color, size }) => <MessageCircle color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
});