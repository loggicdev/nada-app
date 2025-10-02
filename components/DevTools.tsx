import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import colors from '@/constants/colors';

/**
 * DevTools - Componente de desenvolvimento para debug
 *
 * USO APENAS EM DEV! Remover em produção.
 */
export default function DevTools() {
  const { user, signOut } = useAuthContext();

  // Só mostrar em desenvolvimento
  if (__DEV__ === false) return null;

  const handleClearAuth = async () => {
    Alert.alert(
      'Limpar Autenticação',
      'Isso vai limpar todo o cache e forçar logout. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar TUDO',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('🗑️ Iniciando limpeza TOTAL...');

              // 1. Limpar AsyncStorage PRIMEIRO
              console.log('🧹 Limpando AsyncStorage...');
              await AsyncStorage.clear();
              console.log('✅ AsyncStorage limpo');

              // 2. DEPOIS fazer signOut (sem scope pq já limpamos tudo)
              try {
                console.log('🔓 Fazendo logout...');
                await supabase.auth.signOut();
                console.log('✅ SignOut executado');
              } catch (signOutError) {
                console.warn('⚠️ Erro no signOut (ignorado):', signOutError);
              }

              Alert.alert(
                '✅ Limpeza Completa',
                'Cache totalmente limpo! Feche o app (deslize para cima no app switcher) e abra novamente.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('❌ Erro ao limpar:', error);
              Alert.alert('Erro', 'Não foi possível limpar: ' + error);
            }
          }
        }
      ]
    );
  };

  const handleShowCache = async () => {
    const keys = await AsyncStorage.getAllKeys();
    const supabaseKeys = keys.filter(key =>
      key.startsWith('sb-') ||
      key.includes('supabase') ||
      key.includes('auth')
    );

    console.log('📦 Chaves de autenticação no cache:', supabaseKeys);
    Alert.alert(
      'Cache de Autenticação',
      `${supabaseKeys.length} chaves encontradas. Veja o console.`
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛠️ DevTools</Text>

      <View style={styles.info}>
        <Text style={styles.infoText}>
          User: {user ? user.id.slice(0, 8) + '...' : 'Não autenticado'}
        </Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleShowCache}>
        <Text style={styles.buttonText}>📦 Ver Cache</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.dangerButton]}
        onPress={handleClearAuth}
      >
        <Text style={[styles.buttonText, styles.dangerText]}>
          🗑️ Limpar Auth
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    padding: 16,
    borderTopWidth: 2,
    borderTopColor: colors.cosmic.purple,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  info: {
    marginBottom: 12,
  },
  infoText: {
    color: '#aaa',
    fontSize: 12,
  },
  button: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  dangerButton: {
    backgroundColor: '#ff3b30',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerText: {
    color: 'white',
  },
});
