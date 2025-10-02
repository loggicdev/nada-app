-- ============================================
-- MIGRATION: Clean Schema Refactor
-- Data: 2025-10-01
-- Objetivo: Consolidar schema, remover duplicações, preparar para onboarding incremental
-- ============================================

-- 1. DROP tabelas duplicadas e limpeza
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS astrological_profiles CASCADE;
DROP TABLE IF EXISTS lifestyle_preferences CASCADE;

-- 2. Garantir que user_profiles está com a estrutura correta
-- Se ela já existir, vamos adicionar colunas faltantes
ALTER TABLE user_profiles 
  DROP COLUMN IF EXISTS onboarding_current_step CASCADE,
  DROP COLUMN IF EXISTS onboarding_completed_at CASCADE;

-- Adicionar colunas de controle de onboarding
ALTER TABLE user_profiles
  ADD COLUMN onboarding_current_step INTEGER NOT NULL DEFAULT 0 CHECK (onboarding_current_step >= 0 AND onboarding_current_step <= 8),
  ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN user_profiles.onboarding_current_step IS 'Step atual do onboarding: 0=não iniciado, 1-7=em progresso, 8=completo';
COMMENT ON COLUMN user_profiles.onboarding_completed_at IS 'Timestamp de quando o onboarding foi completado. NULL = incompleto';

-- 3. Garantir que user_profiles tem TODOS os campos necessários
-- Campos básicos (já devem existir, mas garantindo)
ALTER TABLE user_profiles 
  ALTER COLUMN name DROP NOT NULL,
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN gender DROP NOT NULL,
  ALTER COLUMN looking_for DROP NOT NULL,
  ALTER COLUMN birth_date DROP NOT NULL;

-- Adicionar campos que podem estar faltando
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS alcohol TEXT CHECK (alcohol IN ('never', 'socially', 'regularly')),
  ADD COLUMN IF NOT EXISTS smoking TEXT CHECK (smoking IN ('never', 'socially', 'regularly')),
  ADD COLUMN IF NOT EXISTS exercise TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily'));

-- 4. Criar função para auto-criação de perfil
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    onboarding_current_step,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    0, -- Começa no step 0 (não iniciado)
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Criar trigger para executar a função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 6. Garantir RLS está habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 7. Criar políticas RLS simples e seguras
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Políticas para user_interests
DROP POLICY IF EXISTS "Users can view own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;

CREATE POLICY "Users can view own interests"
  ON user_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own interests"
  ON user_interests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own interests"
  ON user_interests FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para user_goals
DROP POLICY IF EXISTS "Users can view own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON user_goals;

CREATE POLICY "Users can view own goals"
  ON user_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals"
  ON user_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals"
  ON user_goals FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_step 
  ON user_profiles(onboarding_current_step);

CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_completed 
  ON user_profiles(onboarding_completed_at);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id 
  ON user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_goals_user_id 
  ON user_goals(user_id);

-- 9. Criar função helper para atualizar step do onboarding
CREATE OR REPLACE FUNCTION public.update_onboarding_step(
  user_id_param UUID,
  new_step INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles
  SET 
    onboarding_current_step = new_step,
    updated_at = NOW(),
    onboarding_completed_at = CASE 
      WHEN new_step >= 8 THEN NOW()
      ELSE NULL
    END
  WHERE id = user_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant permissões necessárias
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.user_interests TO authenticated;
GRANT ALL ON public.user_goals TO authenticated;
GRANT ALL ON public.interests TO authenticated;
GRANT ALL ON public.goals TO authenticated;
