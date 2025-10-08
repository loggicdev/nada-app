-- ============================================
-- APPLY THIS IN SUPABASE SQL EDITOR
-- URL: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/editor/sql
-- ============================================

-- Corrigir foreign key da tabela messages para usar auth.users ao invés de profiles

-- 1. Primeiro, remover a constraint atual
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- 2. Adicionar nova constraint referenciando auth.users
ALTER TABLE messages 
ADD CONSTRAINT messages_sender_id_fkey 
FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 3. Verificar se foi aplicado corretamente
SELECT
  tc.table_name, 
  tc.constraint_name, 
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE 
  tc.table_name = 'messages' 
  AND tc.constraint_type = 'FOREIGN KEY'
  AND kcu.column_name = 'sender_id';

-- Comentário
COMMENT ON CONSTRAINT messages_sender_id_fkey ON messages IS 'Foreign key para auth.users - permite identificar o remetente da mensagem';