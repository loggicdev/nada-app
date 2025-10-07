-- ============================================
-- APPLY THIS IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/editor/sql
-- ============================================

-- Criar tabela para rastrear ações de usuários (likes e passes)
CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT CHECK (action_type IN ('like', 'pass')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, target_user_id),
  CHECK (user_id != target_user_id)
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_target_user_id ON user_actions(target_user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);

-- Habilitar RLS
ALTER TABLE user_actions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
DROP POLICY IF EXISTS "Users can view own actions" ON user_actions;
DROP POLICY IF EXISTS "Users can insert own actions" ON user_actions;

CREATE POLICY "Users can view own actions"
  ON user_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own actions"
  ON user_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Grant permissões
GRANT ALL ON user_actions TO authenticated;

-- Comentários
COMMENT ON TABLE user_actions IS 'Rastreia likes e passes dos usuários';
COMMENT ON COLUMN user_actions.action_type IS 'Tipo de ação: like ou pass';

-- Verificar se foi criado
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'user_actions'
ORDER BY ordinal_position;
