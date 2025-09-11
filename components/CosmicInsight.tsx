import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import colors from '@/constants/colors';

interface CosmicInsightProps {
  title: string;
  description: string;
  type?: 'daily' | 'compatibility' | 'ritual';
}

export default function CosmicInsight({ title, description, type = 'daily' }: CosmicInsightProps) {
  const getGradientColors = (): [string, string] => {
    switch (type) {
      case 'compatibility':
        return [colors.cosmic.purple, colors.cosmic.lavender];
      case 'ritual':
        return [colors.cosmic.sage, colors.primary[400]];
      default:
        return [colors.primary[500], colors.primary[300]];
    }
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.header}>
        <Sparkles size={20} color="white" />
        <Text style={styles.title}>{title}</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 16,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    color: 'white',
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
});