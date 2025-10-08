# 🧪 Como Testar o Match Realtime

## Problema Identificado
O bottom sheet de match não aparece quando um match muda de `pending` para `mutual` em tempo real.

## Correções Implementadas

### 1. **Hook `useRealtimeMatches` atualizado**
- ✅ Adicionados logs detalhados para debug
- ✅ Verificação se o match é `mutual` antes de mostrar
- ✅ Tratamento correto do evento UPDATE
- ✅ Verificação se o usuário está envolvido no match

### 2. **Componente de Teste Criado**
Um componente de teste foi adicionado à tela de perfil (apenas em desenvolvimento).

## Como Testar

### Opção 1: Usando o Componente de Teste (Recomendado)

1. **Abra o app** e vá para a aba **Perfil**
2. Role até o final da página
3. Você verá um painel **"🧪 Teste de Match Realtime"**
4. Siga os passos:
   - Clique em **"1. Criar Match Pending"**
   - Aguarde alguns segundos (3-5s)
   - Clique em **"2. Tornar Match Mutual 🎉"**
   - **O bottom sheet deve aparecer!** 🎊

5. Verifique os logs no console:
   ```
   🔔 Iniciando subscrição de matches para usuário: [ID]
   📡 Status da subscrição: SUBSCRIBED
   📝 UPDATE recebido: [payload]
   🎊 Match acabou de se tornar mutual!
   ✅ Match mutual confirmado!
   👤 Perfil do outro usuário: [profile]
   ```

### Opção 2: Manualmente no Supabase Dashboard

1. **Abra o Supabase Dashboard** → SQL Editor

2. **Crie um match pending:**
   ```sql
   -- Substitua os IDs pelos IDs reais dos usuários
   INSERT INTO matches (user1_id, user2_id, compatibility_score, status)
   VALUES (
     'SEU_USER_ID_AQUI',
     'OUTRO_USER_ID_AQUI',
     85,
     'pending'
   )
   RETURNING *;
   ```

3. **Copie o ID do match** retornado

4. **Aguarde alguns segundos** (3-5s)

5. **Atualize para mutual:**
   ```sql
   -- Substitua MATCH_ID pelo ID do match criado
   UPDATE matches
   SET status = 'mutual', matched_at = NOW()
   WHERE id = 'MATCH_ID'
   RETURNING *;
   ```

6. **O bottom sheet deve aparecer!**

### Opção 3: Testar com Match Existente

1. **Encontre um match mutual existente:**
   ```sql
   SELECT id, user1_id, user2_id, status
   FROM matches
   WHERE status = 'mutual'
   LIMIT 1;
   ```

2. **Mude temporariamente para pending:**
   ```sql
   UPDATE matches
   SET status = 'pending'
   WHERE id = 'MATCH_ID';
   ```

3. **Aguarde 3-5 segundos**

4. **Mude de volta para mutual:**
   ```sql
   UPDATE matches
   SET status = 'mutual', matched_at = NOW()
   WHERE id = 'MATCH_ID';
   ```

5. **O bottom sheet deve aparecer!**

## Verificando os Logs

Abra o console/terminal onde o app está rodando e procure por:

- `🔔` - Subscrição iniciada
- `📡` - Status da conexão Realtime
- `📝` - Evento UPDATE recebido
- `🎊` - Match mutual detectado
- `✅` - Match confirmado
- `👤` - Perfil carregado

## Se Não Funcionar

1. **Verifique se o Realtime está ativo** no Supabase:
   ```sql
   SELECT schemaname, tablename
   FROM pg_publication_tables
   WHERE pubname = 'supabase_realtime';
   ```

   Deve retornar a tabela `matches`

2. **Verifique os logs** no console - se não aparecer nenhum log, o Realtime pode não estar conectado

3. **Reinicie o app** - às vezes a conexão Realtime precisa ser restabelecida

4. **Verifique a conexão com o Supabase** - certifique-se de que as credenciais estão corretas

## Limpeza

Para remover os matches de teste:

### Via Componente de Teste:
Clique no botão **"🧹 Limpar Matches de Teste"**

### Via SQL:
```sql
-- Remove matches criados nos últimos 10 minutos
DELETE FROM matches
WHERE matched_at > NOW() - INTERVAL '10 minutes';
```

## Arquivos Modificados

1. [hooks/useRealtimeMatches.ts](hooks/useRealtimeMatches.ts) - Hook com logs detalhados
2. [components/TestMatchRealtime.tsx](components/TestMatchRealtime.tsx) - Componente de teste
3. [app/(tabs)/profile.tsx](app/(tabs)/profile.tsx) - Componente de teste integrado
4. [scripts/test-match-realtime.sql](scripts/test-match-realtime.sql) - Scripts SQL para teste manual

## Próximos Passos

Após confirmar que está funcionando:
1. ✅ Testar em diferentes cenários
2. ✅ Verificar performance com múltiplos matches
3. ✅ Remover o componente de teste em produção
4. ✅ Remover logs excessivos em produção

---

**Nota:** O componente de teste só aparece em modo de desenvolvimento (`__DEV__`)
