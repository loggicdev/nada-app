import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { debugAsyncStorage, forceAuthReset, clearAuthCache } from '@/lib/auth-cache';
import colors from '@/constants/colors';

/**
 * Componente temporário para debug de autenticação
 * REMOVER EM PRODUÇÃO
 */
export default function AuthDebugPanel() {
  if (!__DEV__) {
    return null; // Só mostrar em desenvolvimento
  }

  const handleDebugStorage = async () => {
    console.log('🔍 Iniciando debug do AsyncStorage...');
    await debugAsyncStorage();
    Alert.alert('Debug', 'Verifique o console para ver o conteúdo do AsyncStorage');
  };

  const handleClearCache = async () => {
    Alert.alert(
      'Limpar Cache',
      'Isso vai limpar TODOS os dados de autenticação. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            console.log('🧹 Limpando cache via debug panel...');
            const success = await clearAuthCache();
            if (success) {
              Alert.alert('Sucesso', 'Cache limpo! Feche e reabra o app.');
            } else {
              Alert.alert('Erro', 'Falha ao limpar cache. Verifique o console.');
            }
          }
        }
      ]
    );
  };

  const handleForceReset = async () => {
    Alert.alert(
      'Reset Completo',
      'Isso vai fazer reset COMPLETO da autenticação. Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            console.log('🔄 Fazendo reset completo via debug panel...');
            const success = await forceAuthReset();
            if (success) {
              Alert.alert('Sucesso', 'Reset completo realizado!');
            } else {
              Alert.alert('Erro', 'Falha no reset. Verifique o console.');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 AUTH DEBUG</Text>
      <Text style={styles.subtitle}>Apenas em desenvolvimento</Text>
      
      <TouchableOpacity style={styles.button} onPress={handleDebugStorage}>
        <Text style={styles.buttonText}>📱 Debug AsyncStorage</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={handleClearCache}>
        <Text style={styles.buttonText}>🧹 Limpar Cache</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={handleForceReset}>
        <Text style={styles.buttonText}>🔄 Reset Completo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 10,
    borderRadius: 8,
    minWidth: 150,
    zIndex: 9999,
  },
  title: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  subtitle: {
    color: 'gray',
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: colors.cosmic.purple,
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  warningButton: {
    backgroundColor: 'orange',
  },
  dangerButton: {
    backgroundColor: 'red',
  },
  buttonText: {
    color: 'white',
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
  },
});