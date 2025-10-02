-- ============================================================================
-- MIGRATION: Corrigir Criação Automática de Perfil
-- Data: 01/10/2025
-- Descrição: Criar trigger para criar automaticamente user_profile quando
--            um usuário é criado no auth.users
-- ============================================================================

-- ============================================================================
-- CRIAR FUNÇÃO PARA CRIAR PERFIL AUTOMATICAMENTE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Criar perfil automaticamente quando usuário é criado
  INSERT INTO public.user_profiles (
    id,
    name,
    age,
    gender,
    looking_for,
    onboarding_current_step,
    onboarding_completed_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NULL,
    NULL,
    NULL,
    NULL,
    0, -- Onboarding não iniciado
    NULL, -- Onboarding não completo
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- CRIAR TRIGGER NO auth.users
-- ============================================================================

-- Remover trigger anterior (se existir)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger para executar após INSERT em auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- GARANTIR PERMISSÕES CORRETAS
-- ============================================================================

-- Garantir que a função pode ser executada
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;

-- ============================================================================
-- CRIAR PERFIS PARA USUÁRIOS EXISTENTES (se houver)
-- ============================================================================

-- Inserir perfis para usuários que já existem mas não têm perfil
INSERT INTO public.user_profiles (
  id,
  name,
  age,
  gender,
  looking_for,
  onboarding_current_step,
  onboarding_completed_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  NULL,
  NULL,
  NULL,
  NULL,
  0,
  NULL,
  u.created_at,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  -- Verificar se trigger foi criado
  SELECT COUNT(*) INTO trigger_count
  FROM pg_trigger
  WHERE tgname = 'on_auth_user_created'
  AND tgrelid = 'auth.users'::regclass;

  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Trigger on_auth_user_created criado com sucesso';
  ELSE
    RAISE WARNING '❌ Trigger on_auth_user_created NÃO foi criado';
  END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO';
  RAISE NOTICE 'Trigger automático de criação de perfil configurado';
  RAISE NOTICE 'Perfis criados para usuários existentes (se houver)';
END $$;
