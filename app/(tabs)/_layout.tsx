import { Tabs } from "expo-router";
import { Compass, MessageCircle, User, Sparkles, Heart } from "lucide-react-native";
import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  useEffect(() => {
    // Configure status bar for darker appearance in main app
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content', true);
      StatusBar.setBackgroundColor('#ffffff', true);
    } else if (Platform.OS === 'ios') {
      StatusBar.setBarStyle('dark-content', true);
    }
  }, []);
  
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
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: 65 + Math.max(insets.bottom, 6),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
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