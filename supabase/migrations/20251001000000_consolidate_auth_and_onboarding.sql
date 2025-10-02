-- ============================================================================
-- MIGRATION: Consolidar Autenticação e Sistema de Onboarding
-- Data: 01/10/2025
-- Autor: Winston (Arquiteto)
-- Descrição: Habilita RLS, adiciona controle de progresso de onboarding,
--            e consolida arquitetura de perfis de usuário
-- ============================================================================

-- ============================================================================
-- FASE 1: SEGURANÇA IMEDIATA - HABILITAR RLS
-- ============================================================================

-- Habilitar RLS em todas as tabelas que precisam de proteção
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Se existirem estas tabelas (verificar antes de remover)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'lifestyle_preferences') THEN
        ALTER TABLE lifestyle_preferences ENABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'astrological_profiles') THEN
        ALTER TABLE astrological_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================================================
-- FASE 2: ADICIONAR CAMPOS DE CONTROLE DE ONBOARDING
-- ============================================================================

-- Adicionar campos para rastrear progresso do onboarding
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

-- Adicionar comentários para documentação
COMMENT ON COLUMN user_profiles.onboarding_current_step IS
'Step atual do onboarding (0-8). 0 = não iniciado, 1-7 = em progresso, 8 = completo';

COMMENT ON COLUMN user_profiles.onboarding_completed_at IS
'Timestamp de quando o onboarding foi completado. NULL = incompleto';

-- ============================================================================
-- FASE 3: CRIAR POLÍTICAS RLS PARA user_profiles
-- ============================================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can view all profiles for matching" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;

-- Política de SELECT: Todos podem ver todos os perfis (necessário para matching)
CREATE POLICY "Users can view all profiles for matching"
    ON user_profiles
    FOR SELECT
    USING (true);

-- Política de INSERT: Usuário só pode criar seu próprio perfil
CREATE POLICY "Users can insert own profile"
    ON user_profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Política de UPDATE: Usuário só pode atualizar seu próprio perfil
CREATE POLICY "Users can update own profile"
    ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política de DELETE: Usuário só pode deletar seu próprio perfil
CREATE POLICY "Users can delete own profile"
    ON user_profiles
    FOR DELETE
    USING (auth.uid() = id);

-- ============================================================================
-- FASE 4: CRIAR POLÍTICAS RLS PARA user_goals
-- ============================================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view all goals" ON user_goals;
DROP POLICY IF EXISTS "Users can manage own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can update own goals" ON user_goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON user_goals;

-- Política de SELECT: Todos podem ver todos os goals (necessário para matching)
CREATE POLICY "Users can view all goals"
    ON user_goals
    FOR SELECT
    USING (true);

-- Política de INSERT: Usuário só pode criar seus próprios goals
CREATE POLICY "Users can insert own goals"
    ON user_goals
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Política de UPDATE: Usuário só pode atualizar seus próprios goals
CREATE POLICY "Users can update own goals"
    ON user_goals
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Política de DELETE: Usuário só pode deletar seus próprios goals
CREATE POLICY "Users can delete own goals"
    ON user_goals
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- FASE 5: CRIAR POLÍTICAS RLS PARA user_interests
-- ============================================================================

-- Remover políticas existentes (se houver)
DROP POLICY IF EXISTS "Users can view all interests" ON user_interests;
DROP POLICY IF EXISTS "Users can manage own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can insert own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can update own interests" ON user_interests;
DROP POLICY IF EXISTS "Users can delete own interests" ON user_interests;

-- Política de SELECT: Todos podem ver todos os interests (necessário para matching)
CREATE POLICY "Users can view all interests"
    ON user_interests
    FOR SELECT
    USING (true);

-- Política de INSERT: Usuário só pode criar seus próprios interests
CREATE POLICY "Users can insert own interests"
    ON user_interests
    FOR INSERT
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Política de UPDATE: Usuário só pode atualizar seus próprios interests
CREATE POLICY "Users can update own interests"
    ON user_interests
    FOR UPDATE
    USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- Política de DELETE: Usuário só pode deletar seus próprios interests
CREATE POLICY "Users can delete own interests"
    ON user_interests
    FOR DELETE
    USING (
        user_id IN (
            SELECT id FROM user_profiles WHERE id = auth.uid()
        )
    );

-- ============================================================================
-- FASE 6: RECRIAR FOREIGN KEYS (se necessário)
-- ============================================================================

-- Garantir que user_interests aponta para user_profiles
DO $$
BEGIN
    -- Remover FK antiga (se existir)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_interests_user_id_fkey'
        AND table_name = 'user_interests'
    ) THEN
        ALTER TABLE user_interests DROP CONSTRAINT user_interests_user_id_fkey;
    END IF;

    -- Criar nova FK
    ALTER TABLE user_interests
    ADD CONSTRAINT user_interests_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
END $$;

-- Garantir que user_goals aponta para user_profiles
DO $$
BEGIN
    -- Remover FK antiga (se existir)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'user_goals_user_id_fkey'
        AND table_name = 'user_goals'
    ) THEN
        ALTER TABLE user_goals DROP CONSTRAINT user_goals_user_id_fkey;
    END IF;

    -- Criar nova FK
    ALTER TABLE user_goals
    ADD CONSTRAINT user_goals_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
END $$;

-- ============================================================================
-- FASE 7: CRIAR FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
-- ============================================================================

-- Criar ou substituir função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public, pg_temp; -- Corrige vulnerabilidade de search_path

-- Aplicar trigger em user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FASE 8: MIGRAR DADOS (se existir tabela profiles duplicada)
-- ============================================================================

-- Migrar dados de profiles para user_profiles (se houver)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Inserir dados que ainda não existem em user_profiles
        INSERT INTO user_profiles (id, name, age, gender, looking_for, created_at)
        SELECT id, name, age, gender, looking_for, created_at
        FROM profiles
        WHERE id NOT IN (SELECT id FROM user_profiles)
        ON CONFLICT (id) DO NOTHING;

        RAISE NOTICE 'Dados migrados de profiles para user_profiles';
    END IF;
END $$;

-- ============================================================================
-- FASE 9: ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índice para buscar usuários por status de onboarding
CREATE INDEX IF NOT EXISTS idx_user_profiles_onboarding_status
    ON user_profiles(onboarding_completed_at, onboarding_current_step);

-- Índice para buscar goals por usuário
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id
    ON user_goals(user_id);

-- Índice para buscar interests por usuário
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id
    ON user_interests(user_id);

-- ============================================================================
-- FASE 10: VALIDAÇÕES E CONSTRAINTS
-- ============================================================================

-- Garantir que onboarding_current_step está entre 0 e 8
ALTER TABLE user_profiles
DROP CONSTRAINT IF EXISTS check_onboarding_current_step;

ALTER TABLE user_profiles
ADD CONSTRAINT check_onboarding_current_step
CHECK (onboarding_current_step >= 0 AND onboarding_current_step <= 8);

-- Se onboarding_completed_at está preenchido, onboarding_current_step deve ser 8
-- (constraint opcional, pode ser descomentado se desejar validação rigorosa)
-- ALTER TABLE user_profiles
-- DROP CONSTRAINT IF EXISTS check_onboarding_completed;
--
-- ALTER TABLE user_profiles
-- ADD CONSTRAINT check_onboarding_completed
-- CHECK (
--     (onboarding_completed_at IS NULL) OR
--     (onboarding_completed_at IS NOT NULL AND onboarding_current_step = 8)
-- );

-- ============================================================================
-- FASE 11: GRANT PERMISSIONS (se necessário)
-- ============================================================================

-- Garantir que authenticated users podem acessar as tabelas
GRANT SELECT, INSERT, UPDATE ON user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_interests TO authenticated;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================

-- Verificar se RLS está habilitado
DO $$
DECLARE
    rls_status RECORD;
BEGIN
    FOR rls_status IN
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('user_profiles', 'user_goals', 'user_interests')
    LOOP
        IF rls_status.rowsecurity THEN
            RAISE NOTICE 'RLS habilitado em: %', rls_status.tablename;
        ELSE
            RAISE WARNING 'RLS NÃO habilitado em: %', rls_status.tablename;
        END IF;
    END LOOP;
END $$;

-- Verificar se campos foram criados
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'onboarding_current_step'
    ) THEN
        RAISE NOTICE 'Campo onboarding_current_step criado com sucesso';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'user_profiles'
        AND column_name = 'onboarding_completed_at'
    ) THEN
        RAISE NOTICE 'Campo onboarding_completed_at criado com sucesso';
    END IF;
END $$;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Log de conclusão
DO $$
BEGIN
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO';
    RAISE NOTICE 'RLS habilitado em todas as tabelas críticas';
    RAISE NOTICE 'Campos de controle de onboarding adicionados';
    RAISE NOTICE 'Políticas de segurança configuradas';
    RAISE NOTICE 'Pronto para implementação no código';
END $$;
