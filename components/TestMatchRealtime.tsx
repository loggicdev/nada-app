import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import colors from '@/constants/colors';

/**
 * Componente de teste para verificar se o Realtime de matches está funcionando
 *
 * Como usar:
 * 1. Adicione este componente em alguma tela (ex: profile)
 * 2. Clique em "Criar Match Pending"
 * 3. Aguarde alguns segundos
 * 4. Clique em "Tornar Match Mutual"
 * 5. O bottom sheet deve aparecer!
 */
export default function TestMatchRealtime() {
  const { user } = useAuth();
  const [testMatchId, setTestMatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const createPendingMatch = async () => {
    if (!user?.id) {
      Alert.alert('Erro', 'Usuário não encontrado');
      return;
    }

    setLoading(true);
    try {
      // Buscar outro usuário qualquer
      const { data: otherUser } = await supabase
        .from('user_profiles')
        .select('id')
        .neq('id', user.id)
        .limit(1)
        .single();

      if (!otherUser) {
        Alert.alert('Erro', 'Nenhum outro usuário encontrado');
        setLoading(false);
        return;
      }

      // Criar match pending
      const { data: match, error } = await supabase
        .from('matches')
        .insert({
          user1_id: user.id,
          user2_id: otherUser.id,
          compatibility_score: 88,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Erro', error.message);
        setLoading(false);
        return;
      }

      setTestMatchId(match.id);
      Alert.alert(
        'Sucesso!',
        `Match pending criado!\nID: ${match.id}\n\nAgora clique em "Tornar Match Mutual" para simular o outro usuário dando match também.`
      );
    } catch (error) {
      console.error('Erro ao criar match:', error);
      Alert.alert('Erro', 'Erro ao criar match de teste');
    } finally {
      setLoading(false);
    }
  };

  const makeMutual = async () => {
    if (!testMatchId) {
      Alert.alert('Erro', 'Primeiro crie um match pending');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'mutual',
          matched_at: new Date().toISOString(),
        })
        .eq('id', testMatchId);

      if (error) {
        Alert.alert('Erro', error.message);
        setLoading(false);
        return;
      }

      Alert.alert(
        '🎉 Match Mutual!',
        'O status foi alterado para mutual!\n\nO bottom sheet deve aparecer agora se o Realtime estiver funcionando.'
      );
      setTestMatchId(null);
    } catch (error) {
      console.error('Erro ao atualizar match:', error);
      Alert.alert('Erro', 'Erro ao atualizar match');
    } finally {
      setLoading(false);
    }
  };

  const cleanupTestMatches = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Deletar todos os matches de teste (criados nos últimos 5 minutos)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('matches')
        .delete()
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .gte('matched_at', fiveMinutesAgo);

      if (error) {
        Alert.alert('Erro', error.message);
      } else {
        Alert.alert('Sucesso', 'Matches de teste removidos!');
        setTestMatchId(null);
      }
    } catch (error) {
      console.error('Erro ao limpar matches:', error);
      Alert.alert('Erro', 'Erro ao limpar matches de teste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧪 Teste de Match Realtime</Text>
      <Text style={styles.subtitle}>
        Use este painel para testar se o Realtime está funcionando
      </Text>

      <TouchableOpacity
        style={[styles.button, styles.createButton]}
        onPress={createPendingMatch}
        disabled={loading || !!testMatchId}
      >
        <Text style={styles.buttonText}>
          {testMatchId ? '✓ Match Pending Criado' : '1. Criar Match Pending'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.mutualButton, !testMatchId && styles.buttonDisabled]}
        onPress={makeMutual}
        disabled={loading || !testMatchId}
      >
        <Text style={[styles.buttonText, !testMatchId && styles.buttonTextDisabled]}>
          2. Tornar Match Mutual 🎉
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.cleanupButton]}
        onPress={cleanupTestMatches}
        disabled={loading}
      >
        <Text style={styles.buttonText}>🧹 Limpar Matches de Teste</Text>
      </TouchableOpacity>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>📋 Como usar:</Text>
        <Text style={styles.infoText}>1. Clique em "Criar Match Pending"</Text>
        <Text style={styles.infoText}>2. Aguarde alguns segundos</Text>
        <Text style={styles.infoText}>3. Clique em "Tornar Match Mutual"</Text>
        <Text style={styles.infoText}>4. O bottom sheet deve aparecer!</Text>
      </View>

      <View style={styles.logs}>
        <Text style={styles.logsTitle}>📝 Verifique os logs no console</Text>
        <Text style={styles.logsText}>
          Procure por: 🔔 📡 📝 🎊 ✅
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: colors.neutral[50],
    borderRadius: 16,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.neutral[800],
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral[600],
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  createButton: {
    backgroundColor: colors.cosmic.purple,
  },
  mutualButton: {
    backgroundColor: colors.semantic.success,
  },
  cleanupButton: {
    backgroundColor: colors.neutral[600],
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: colors.neutral[500],
  },
  info: {
    marginTop: 20,
    padding: 16,
    backgroundColor: colors.cosmic.purple + '10',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.cosmic.purple,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.cosmic.purple,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.neutral[700],
    marginBottom: 4,
  },
  logs: {
    marginTop: 12,
    padding: 16,
    backgroundColor: colors.neutral[200],
    borderRadius: 12,
  },
  logsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 4,
  },
  logsText: {
    fontSize: 12,
    color: colors.neutral[600],
  },
});
