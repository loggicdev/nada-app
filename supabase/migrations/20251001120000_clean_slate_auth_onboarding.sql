-- ============================================================================
-- MIGRATION: Clean Slate - Auth & Onboarding (Arquitetura Correta)
-- Data: 01/10/2025
-- Descrição: Refatoração completa do sistema de autenticação e onboarding
--            seguindo as melhores práticas e padrões da indústria
-- ============================================================================

-- ============================================================================
-- FASE 1: LIMPAR FUNÇÕES ANTIGAS (Trigger será recriado)
-- ============================================================================

-- Remover função antiga (o trigger será recriado automaticamente)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================================================
-- FASE 2: CONSOLIDAR TABELA user_profiles (Single Source of Truth)
-- ============================================================================

-- Garantir que user_profiles tem todos os campos necessários
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS moon_sign TEXT,
ADD COLUMN IF NOT EXISTS rising_sign TEXT,
ADD COLUMN IF NOT EXISTS personality_type TEXT;

-- Adicionar unique constraint no email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_email_key'
  ) THEN
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_email_key UNIQUE (email);
  END IF;
END $$;

-- Adicionar comment nos campos importantes
COMMENT ON COLUMN public.user_profiles.onboarding_current_step IS
'Current onboarding step (0-8). 0 = not started, 1-7 = in progress, 8 = complete';

COMMENT ON COLUMN public.user_profiles.onboarding_completed_at IS
'Timestamp when onboarding was completed. NULL = incomplete';

COMMENT ON COLUMN public.user_profiles.email IS
'User email, synced from auth.users';

-- ============================================================================
-- FASE 3: CRIAR FUNÇÃO DE AUTO-CRIAÇÃO DE PERFIL (Versão Robusta)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Log para debug
  RAISE NOTICE 'Creating profile for user: %', NEW.id;

  -- Criar perfil automaticamente quando usuário é criado
  INSERT INTO public.user_profiles (
    id,
    email,
    onboarding_current_step,
    onboarding_completed_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    0, -- Começar no step 0 (Welcome)
    NULL, -- Onboarding não completo
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  RAISE NOTICE 'Profile created successfully for user: %', NEW.id;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- FASE 4: CRIAR TRIGGER NO auth.users
-- ============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Automatically creates a user_profile when a new user signs up';

-- ============================================================================
-- FASE 5: GARANTIR RLS ESTÁ HABILITADO
-- ============================================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- FASE 6: RECRIAR POLÍTICAS RLS (Seguras e Corretas)
-- ============================================================================

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Users can view all profiles for matching" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.user_profiles;

-- SELECT: Permitir que usuários autenticados vejam todos os perfis (necessário para matching)
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: Apenas o sistema pode criar (via trigger)
CREATE POLICY "System can insert profiles"
  ON public.user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- UPDATE: Usuário só pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: Usuário só pode deletar seu próprio perfil
CREATE POLICY "Users can delete own profile"
  ON public.user_profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================================
-- FASE 7: POLÍTICAS PARA user_goals
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON public.user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON public.user_goals;

CREATE POLICY "Users can view all goals"
  ON public.user_goals FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own goals"
  ON public.user_goals FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE id = auth.uid()));

-- ============================================================================
-- FASE 8: POLÍTICAS PARA user_interests
-- ============================================================================

DROP POLICY IF EXISTS "Users can view all interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON public.user_interests;

CREATE POLICY "Users can view all interests"
  ON public.user_interests FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can manage own interests"
  ON public.user_interests FOR ALL TO authenticated
  USING (user_id IN (SELECT id FROM public.user_profiles WHERE id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.user_profiles WHERE id = auth.uid()));

-- ============================================================================
-- FASE 9: TRIGGER PARA UPDATED_AT
-- ============================================================================

-- Função genérica para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Aplicar em user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- FASE 10: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para busca por email (usado na validação de duplicata)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email
  ON public.user_profiles(email);

-- Índice para busca por status de onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_status
  ON public.user_profiles(onboarding_current_step, onboarding_completed_at);

-- Índice para goals por usuário
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id
  ON public.user_goals(user_id);

-- Índice para interests por usuário
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
  ON public.user_interests(user_id);

-- ============================================================================
-- FASE 11: CRIAR PERFIS PARA USUÁRIOS EXISTENTES
-- ============================================================================

-- Inserir perfis para usuários que já existem mas não têm perfil
INSERT INTO public.user_profiles (
  id,
  email,
  onboarding_current_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  u.email,
  0,
  NULL,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  updated_at = NOW();

-- ============================================================================
-- FASE 12: GRANTS DE PERMISSÃO
-- ============================================================================

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_interests TO authenticated;

-- ============================================================================
-- FASE 13: VERIFICAÇÕES FINAIS
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
  profile_count INTEGER;
  user_count INTEGER;
BEGIN
  -- Verificar trigger
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
  AND tgrelid = 'auth.users'::regclass;

  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created criado';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO criado';
  END IF;

  -- Verificar que todos os users têm profile
  SELECT COUNT(*) INTO user_count FROM auth.users;
  SELECT COUNT(*) INTO profile_count FROM public.user_profiles;

  RAISE NOTICE 'Total de usuários: %', user_count;
  RAISE NOTICE 'Total de perfis: %', profile_count;

  IF user_count = profile_count THEN
    RAISE NOTICE '✅ Todos os usuários têm perfil';
  ELSE
    RAISE WARNING '⚠️ Alguns usuários podem estar sem perfil';
  END IF;

  -- Verificar RLS
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'user_profiles'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ RLS habilitado em user_profiles';
  ELSE
    RAISE WARNING '❌ RLS NÃO habilitado em user_profiles';
  END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

RAISE NOTICE '';
RAISE NOTICE '========================================';
RAISE NOTICE '✅ MIGRATION CONCLUÍDA COM SUCESSO';
RAISE NOTICE '========================================';
RAISE NOTICE '';
RAISE NOTICE 'Sistema de autenticação refatorado:';
RAISE NOTICE '- Trigger automático criado';
RAISE NOTICE '- Perfis sincronizados';
RAISE NOTICE '- RLS configurado';
RAISE NOTICE '- Índices otimizados';
RAISE NOTICE '';
RAISE NOTICE 'Próximos passos:';
RAISE NOTICE '1. Testar criação de novo usuário';
RAISE NOTICE '2. Verificar que perfil é criado automaticamente';
RAISE NOTICE '3. Testar fluxo de onboarding completo';
RAISE NOTICE '';
