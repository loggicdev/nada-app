-- Script para testar o Realtime de matches
-- Execute este script no SQL Editor do Supabase

-- 1. Verificar matches existentes
SELECT id, user1_id, user2_id, status, matched_at
FROM matches
ORDER BY matched_at DESC
LIMIT 5;

-- 2. Criar um novo match com status pending
-- Substitua USER_ID_1 e USER_ID_2 pelos IDs reais dos usuários
/*
INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
VALUES ('USER_ID_1', 'USER_ID_2', 85, 'pending')
RETURNING *;
*/

-- 3. Simular o outro usuário dando match também (muda para mutual)
-- Substitua MATCH_ID pelo ID do match criado acima
/*
UPDATE matches
SET status = 'mutual', matched_at = NOW()
WHERE id = 'MATCH_ID'
RETURNING *;
*/

-- 4. Verificar se há um match pending para testar
SELECT id, user1_id, user2_id, status, matched_at
FROM matches
WHERE status = 'pending'
LIMIT 1;

-- 5. Para testar com um match existente que já é mutual,
-- você pode mudar temporariamente para pending e depois voltar para mutual
/*
-- Primeiro: mudar para pending
UPDATE matches
SET status = 'pending'
WHERE id = 'ALGUM_MATCH_ID_EXISTENTE';

-- Aguardar alguns segundos...

-- Depois: mudar de volta para mutual (isso deve disparar o Realtime)
UPDATE matches
SET status = 'mutual', matched_at = NOW()
WHERE id = 'ALGUM_MATCH_ID_EXISTENTE';
*/
