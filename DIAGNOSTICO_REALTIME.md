# 🔍 Diagnóstico do Realtime de Matches

## Status da Configuração

### ✅ Realtime Habilitado
- Publication: `supabase_realtime`
- INSERT: ✅ Habilitado
- UPDATE: ✅ Habilitado
- DELETE: ✅ Habilitado

### ✅ Tabelas no Realtime
```sql
-- Verificado que a tabela matches está na publicação
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
```

## Possíveis Causas do Problema

### 1. **Filtros do Realtime (Mais Provável)**
O Supabase Realtime **não suporta filtros OR** diretamente no subscription.

**Problema:**
```typescript
// ❌ Isso NÃO funciona no Realtime
filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`
```

**Solução Atual:**
- Removemos o filtro
- Filtramos no lado do cliente (no callback)
- ✅ Implementado em `useRealtimeMatches.ts`

### 2. **Payload.old pode estar vazio**
Em alguns casos, o Supabase não envia o `payload.old` nos eventos UPDATE.

**Solução Atual:**
```typescript
// Verificamos se old existe E se era diferente
if (!oldMatch?.status || oldMatch.status !== 'mutual') {
  // Mostra o match
}
```

### 3. **Conexão Realtime não estabelecida**
A conexão pode não estar sendo estabelecida corretamente.

**Verificação:**
Procure no console por:
```
📡 Status da subscrição: SUBSCRIBED
```

Se aparecer `CLOSED` ou `CHANNEL_ERROR`, há problema na conexão.

## Logs Implementados

### No Hook `useRealtimeMatches`:

1. **🔔 Iniciando subscrição** - Hook iniciado
2. **📡 Status da subscrição** - Status da conexão (SUBSCRIBED, CLOSED, etc)
3. **📥 INSERT recebido** - Novo match inserido
4. **📝 UPDATE recebido** - Match atualizado
5. **❌ Match não envolve o usuário** - Filtrado (não é do usuário)
6. **⏳ Match ainda não é mutual** - Filtrado (status != mutual)
7. **🎊 Match acabou de se tornar mutual** - Passou nas validações!
8. **✅ Match mutual confirmado** - Match processado
9. **👤 Perfil do outro usuário** - Perfil carregado
10. **🔕 Removendo subscrição** - Hook desmontado

## Como Interpretar os Logs

### ✅ Cenário Funcionando:
```
🔔 Iniciando subscrição de matches para usuário: abc-123
📡 Status da subscrição: SUBSCRIBED
📝 UPDATE recebido: { new: {...}, old: {...} }
Novo status: mutual | Status anterior: pending
🎊 Match acabou de se tornar mutual!
✅ Match mutual confirmado!
👤 Perfil do outro usuário: { name: "João", ... }
```

### ❌ Cenário com Problema:

#### Problema 1: Subscrição não conecta
```
🔔 Iniciando subscrição de matches para usuário: abc-123
📡 Status da subscrição: CLOSED
```
**Solução:** Verificar credenciais do Supabase e conexão de internet

#### Problema 2: Nenhum evento recebido
```
🔔 Iniciando subscrição de matches para usuário: abc-123
📡 Status da subscrição: SUBSCRIBED
(nada mais aparece)
```
**Solução:** O UPDATE não está sendo propagado. Verificar se a tabela está no Realtime.

#### Problema 3: Eventos recebidos mas filtrados
```
🔔 Iniciando subscrição de matches para usuário: abc-123
📡 Status da subscrição: SUBSCRIBED
📝 UPDATE recebido: { new: {...}, old: {...} }
❌ Match não envolve o usuário atual, ignorando
```
**Solução:** O match não envolve o usuário logado (user1_id ou user2_id diferente)

#### Problema 4: Status já era mutual
```
📝 UPDATE recebido: { new: {...}, old: {...} }
Novo status: mutual | Status anterior: mutual
ℹ️ Match já era mutual, ignorando
```
**Solução:** Normal - o match já estava mutual antes

## Comandos de Verificação

### 1. Verificar se tabela está no Realtime:
```sql
SELECT schemaname, tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime';
```

### 2. Verificar matches do usuário:
```sql
SELECT id, user1_id, user2_id, status, matched_at
FROM matches
WHERE user1_id = 'SEU_USER_ID' OR user2_id = 'SEU_USER_ID'
ORDER BY matched_at DESC;
```

### 3. Verificar RLS policies:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'matches';
```

## Teste Manual Passo a Passo

### Preparação:
1. Abra o app
2. Abra o console do Metro Bundler ou Expo
3. Vá para a aba Perfil (para ver os logs)

### Execução:
1. No componente de teste, clique em "Criar Match Pending"
2. **Verifique:** Log `📥 INSERT recebido` deve aparecer
3. Aguarde 3 segundos
4. Clique em "Tornar Match Mutual"
5. **Verifique:** Log `📝 UPDATE recebido` deve aparecer
6. **Verifique:** Log `🎊 Match acabou de se tornar mutual!` deve aparecer
7. **Resultado:** Bottom sheet deve abrir

### Se Não Funcionar:

Capture os logs e procure por:
- O que apareceu?
- O que NÃO apareceu?
- Há algum erro?

## Alternativa: Polling

Se o Realtime continuar não funcionando, podemos implementar polling como fallback:

```typescript
// Verificar a cada 5 segundos se há novos matches
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'mutual')
      .gte('matched_at', new Date(Date.now() - 10000).toISOString());

    if (data && data.length > 0) {
      // Processar novo match
    }
  }, 5000);

  return () => clearInterval(interval);
}, []);
```

## Próximos Passos

1. ✅ Execute o teste usando o componente
2. ✅ Capture os logs completos
3. ✅ Compartilhe os logs para diagnóstico
4. ✅ Se necessário, implementar polling como fallback
