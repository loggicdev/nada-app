import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { OnboardingData, ONBOARDING_STEPS } from '@/types/onboarding';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD (formato PostgreSQL)
 */
function convertDateToISO(dateStr: string): string {
  // Se já está no formato ISO (YYYY-MM-DD), retorna como está
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Se está no formato DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month}-${day}`;
  }

  // Se não reconheceu o formato, retorna como está (vai dar erro no banco)
  return dateStr;
}

/**
 * OnboardingContext - Gerencia o fluxo de onboarding
 *
 * Arquitetura:
 * 1. currentStep vem do profile.onboarding_current_step (single source of truth)
 * 2. Cada mudança de step é salva NO BANCO imediatamente
 * 3. Cada dado coletado é salva NO BANCO imediatamente
 * 4. Se usuário sair e voltar, continua de onde parou
 */
export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const { profile, user, updateProfile } = useAuthContext();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Usar ref para persistir entre renders - reseta quando user muda
  const hasInitializedRef = useRef<boolean>(false);
  const lastUserIdRef = useRef<string | null>(null);

  // Resetar a flag quando o usuário muda (login/logout)
  useEffect(() => {
    const currentUserId = user?.id || null;
    if (currentUserId !== lastUserIdRef.current) {
      console.log('👤 Usuário mudou - resetando hasInitialized');
      hasInitializedRef.current = false;
      lastUserIdRef.current = currentUserId;
    }
  }, [user?.id]);

  // Sincronizar currentStep com profile (source of truth)
  // MAS: apenas na primeira vez que o profile é carregado para ESTE usuário
  // Evita "voltar" quando acabou de criar conta
  useEffect(() => {
    if (profile?.onboarding_current_step !== undefined && !hasInitializedRef.current) {
      console.log('🔄 Inicializando currentStep do profile:', profile.onboarding_current_step);
      setCurrentStep(profile.onboarding_current_step);
      hasInitializedRef.current = true;
    }
  }, [profile?.onboarding_current_step]);

  /**
   * Salvar dados de onboarding no banco
   * Cada campo é salvo imediatamente
   */
  const saveOnboardingData = useCallback(async (data: Partial<OnboardingData>) => {
    if (!user) {
      console.warn('⚠️ Tentando salvar dados sem usuário autenticado');
      return;
    }

    try {
      console.log('💾 Salvando dados de onboarding:', data);

      // Mapear dados do onboarding para campos do profile
      const profileUpdates: any = {};

      if (data.name !== undefined) profileUpdates.name = data.name;
      if (data.age !== undefined) profileUpdates.age = data.age;
      if (data.gender !== undefined) profileUpdates.gender = data.gender;
      if (data.lookingFor !== undefined) profileUpdates.looking_for = data.lookingFor;
      if (data.birthDate !== undefined) {
        // Converter data de DD/MM/YYYY para YYYY-MM-DD
        profileUpdates.birth_date = convertDateToISO(data.birthDate);
        console.log('📅 Data convertida:', data.birthDate, '→', profileUpdates.birth_date);
      }
      if (data.birthTime !== undefined) profileUpdates.birth_time = data.birthTime;
      if (data.birthPlace !== undefined) profileUpdates.birth_place = data.birthPlace;

      // Lifestyle (álcool, fumo, exercício)
      if (data.lifestyle) {
        const currentLifestyle = (profile?.lifestyle as any) || {};
        profileUpdates.lifestyle = {
          ...currentLifestyle,
          ...(data.lifestyle.alcohol !== undefined && { alcohol: data.lifestyle.alcohol }),
          ...(data.lifestyle.smoking !== undefined && { smoking: data.lifestyle.smoking }),
          ...(data.lifestyle.exercise !== undefined && { exercise: data.lifestyle.exercise }),
        };
      }

      // Atualizar profile se houver mudanças
      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(profileUpdates);
        console.log('✅ Dados salvos no profile');
      }

      // Salvar goals (se houver)
      if (data.goals && data.goals.length > 0) {
        // Deletar goals antigas
        await supabase
          .from('user_goals')
          .delete()
          .eq('user_id', user.id);

        // Inserir novas goals
        const goalsToInsert = data.goals.map(goal => ({
          user_id: user.id,
          goal: goal,
        }));

        await supabase
          .from('user_goals')
          .insert(goalsToInsert);

        console.log('✅ Goals salvas:', data.goals);
      }

      // Salvar interests (se houver)
      if (data.interests && data.interests.length > 0) {
        // Deletar interests antigas
        await supabase
          .from('user_interests')
          .delete()
          .eq('user_id', user.id);

        // Inserir novos interests
        const interestsToInsert = data.interests.map(interest => ({
          user_id: user.id,
          interest: interest,
        }));

        await supabase
          .from('user_interests')
          .insert(interestsToInsert);

        console.log('✅ Interests salvos:', data.interests);
      }

    } catch (error) {
      console.error('❌ Erro ao salvar dados de onboarding:', error);
      throw error;
    }
  }, [user, profile, updateProfile]);

  /**
   * Avançar para próximo step
   * Se usuário autenticado: salva no banco
   * Se não autenticado (welcome screen): apenas avança localmente
   */
  const nextStep = useCallback(async () => {
    if (currentStep >= ONBOARDING_STEPS.length - 1) {
      console.log('⚠️ Já está no último step');
      return;
    }

    const newStep = currentStep + 1;
    setIsLoading(true);

    try {
      // Se tem usuário autenticado, salvar no banco
      if (user && profile) {
        console.log(`🔄 Avançando step (autenticado): ${currentStep} → ${newStep}`);

        // Atualizar estado local ANTES de salvar no banco
        // Isso previne o "voltar" quando o profile é recarregado
        setCurrentStep(newStep);

        await updateProfile({
          onboarding_current_step: newStep
        });
        console.log('✅ Step salvo no banco:', newStep);
      } else if (user && !profile) {
        // Usuário criado mas profile ainda não carregado
        // Aguardar um pouco e apenas avançar localmente
        console.log('⏳ Usuário criado, aguardando profile... Avançando localmente.');
        setCurrentStep(newStep);
      } else {
        // Não autenticado (welcome screen) - apenas avança localmente
        console.log(`🔄 Avançando step (não autenticado): ${currentStep} → ${newStep}`);
        setCurrentStep(newStep);
      }

    } catch (error) {
      console.error('❌ Erro ao avançar step:', error);
      // Rollback em caso de erro
      setCurrentStep(currentStep);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, user, updateProfile]);

  /**
   * Voltar para step anterior
   *
   * Regras:
   * - Step 1 (CreateAccount): pode voltar para step 0 (Welcome) sem autenticação
   * - Step 2+: NÃO pode voltar para step 1 (conta já criada)
   *            Se clicar voltar, vai direto para step 0 e faz logout
   */
  const previousStep = useCallback(async () => {
    if (currentStep <= 0) return;

    setIsLoading(true);

    try {
      // Step 1 → Step 0: apenas volta localmente (sem autenticação ainda)
      if (currentStep === 1) {
        console.log('⬅️ Voltando de CreateAccount para Welcome');
        setCurrentStep(0);
        return;
      }

      // Step 2+ → Step 0: pula o step 1 e faz logout
      // Uma vez que a conta foi criada, não pode voltar para CreateAccount
      if (currentStep >= 2 && user) {
        console.log('⬅️ Voltando para Welcome - pulando step 1 e fazendo logout...');
        const { supabase } = await import('@/lib/supabase');
        await supabase.auth.signOut();
        setCurrentStep(0);
        console.log('✅ Logout realizado, voltou para Welcome');
        return;
      }

      // Fallback: não deveria chegar aqui
      console.warn('⚠️ previousStep: caso não tratado', { currentStep, user: !!user });
      setCurrentStep(0);
    } catch (error) {
      console.error('❌ Erro ao voltar step:', error);
      setCurrentStep(currentStep); // Rollback
    } finally {
      setIsLoading(false);
    }
  }, [currentStep, user]);

  /**
   * Completar onboarding
   * Marca como completo no banco
   */
  const completeOnboarding = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateProfile({
        onboarding_current_step: 8,
        onboarding_completed_at: new Date().toISOString()
      });
      console.log('🎉 Onboarding completo!');
    } catch (error) {
      console.error('❌ Erro ao completar onboarding:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user, updateProfile]);

  /**
   * Resetar onboarding (apenas para debug)
   */
  const resetOnboarding = useCallback(async () => {
    if (!user) return;

    try {
      await updateProfile({
        onboarding_current_step: 0,
        onboarding_completed_at: null
      });
      console.log('🔄 Onboarding resetado');
    } catch (error) {
      console.error('❌ Erro ao resetar onboarding:', error);
    }
  }, [user, updateProfile]);

  const isCompleted = useMemo(
    () => profile?.onboarding_completed_at !== null,
    [profile?.onboarding_completed_at]
  );

  return useMemo(() => ({
    isCompleted,
    isLoading,
    currentStep,
    saveOnboardingData,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding,
    totalSteps: ONBOARDING_STEPS.length,
    progress: (currentStep + 1) / ONBOARDING_STEPS.length
  }), [
    isCompleted,
    isLoading,
    currentStep,
    saveOnboardingData,
    nextStep,
    previousStep,
    completeOnboarding,
    resetOnboarding
  ]);
});
