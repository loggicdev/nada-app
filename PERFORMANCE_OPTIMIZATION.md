# Otimizações de Performance - Sistema de Match

## 🚀 Problema Original

O sistema estava fazendo **40+ requisições** ao carregar candidatos:
- 1 query para buscar perfis
- 1 query para buscar matches
- **20 queries** para buscar interesses (1 por candidato)
- **20 queries** para buscar fotos (1 por candidato)

**Resultado**: Timeout de 10s em muitas requisições, app lento e travado.

## ✅ Otimizações Implementadas

### 1. **Batch Queries** ([contexts/MatchContext.tsx:173-203](contexts/MatchContext.tsx#L173-L203))

**Antes:**
```typescript
// 20 queries separadas (uma por candidato)
await Promise.all(
  profiles.map(async (profile) => {
    const { data: interests } = await supabase
      .from('user_interests')
      .select('interest')
      .eq('user_id', profile.id);  // 1 query por usuário ❌
  })
);
```

**Depois:**
```typescript
// 1 query para TODOS os candidatos ✅
const userIds = filteredProfiles.map(p => p.id);
const { data: allInterests } = await supabase
  .from('user_interests')
  .select('user_id, interest')
  .in('user_id', userIds);  // Busca tudo de uma vez!
```

**Redução**: De **20 queries** para **1 query** (interesses)
**Redução**: De **20 queries** para **1 query** (fotos)

### 2. **Processamento Local** ([contexts/MatchContext.tsx:187-203](contexts/MatchContext.tsx#L187-L203))

Depois de buscar os dados em batch, processamos localmente usando `Map`:

```typescript
// Agrupar interesses por user_id
const interestsByUser = new Map<string, string[]>();
allInterests?.forEach(item => {
  if (!interestsByUser.has(item.user_id)) {
    interestsByUser.set(item.user_id, []);
  }
  interestsByUser.get(item.user_id)?.push(item.interest);
});
```

**Benefício**: O(1) lookup ao invés de filtrar array toda vez

### 3. **Timeout Aumentado** ([lib/supabase.ts:19](lib/supabase.ts#L19))

**Antes:**
```typescript
const timeout = 10000; // 10 segundos ❌
```

**Depois:**
```typescript
const timeout = 30000; // 30 segundos ✅
```

**Benefício**: Queries batch têm mais tempo para completar

### 4. **Logs Condicionais** ([lib/supabase.ts:24-26](lib/supabase.ts#L24-L26))

**Antes:**
```typescript
console.log('🌐 fetchWithTimeout chamado para:', url); // Sempre ❌
```

**Depois:**
```typescript
if (__DEV__) {
  console.log('🌐 fetchWithTimeout chamado para:', url); // Só em dev ✅
}
```

**Benefício**: Menos poluição de logs em produção

### 5. **Cache de Candidatos** ([contexts/MatchContext.tsx:255-259](contexts/MatchContext.tsx#L255-L259))

**Antes:**
```typescript
useEffect(() => {
  if (user?.id && profile) {
    loadCandidates(); // Carrega sempre que profile muda ❌
  }
}, [user?.id, profile?.id]);
```

**Depois:**
```typescript
useEffect(() => {
  if (user?.id && profile && candidates.length === 0) {
    loadCandidates(); // Só carrega se estiver vazio ✅
  }
}, [user?.id, profile?.id]);
```

**Benefício**: Não recarrega candidatos desnecessariamente

### 6. **Remoção de Promise.all Desnecessário** ([contexts/MatchContext.tsx:206-239](contexts/MatchContext.tsx#L206-L239))

**Antes:**
```typescript
const candidatesWithData = await Promise.all(
  profiles.map(async (profile) => {
    // Queries assíncronas aqui ❌
  })
);
```

**Depois:**
```typescript
const candidatesWithData = filteredProfiles.map((profile) => {
  // Apenas processamento síncrono ✅
  const interests = interestsByUser.get(profile.id) || [];
  const photos = photosByUser.get(profile.id) || [];
  // ...
});
```

**Benefício**: Processamento instantâneo após as 2 batch queries

## 📊 Resultados

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| **Queries totais** | ~42 | ~4 | **90% menos** |
| **Timeout** | 10s | 30s | **3x mais tempo** |
| **Recarregamentos** | A cada mudança | Só quando vazio | **Cache ativo** |
| **Logs** | Sempre | Só em dev | **Menos poluição** |

## 🎯 Fluxo Otimizado

```
1. Buscar perfis (1 query)
2. Buscar matches existentes (1 query)
3. Filtrar perfis que já tiveram match (local)
4. Buscar TODOS interesses em batch (1 query)
5. Buscar TODAS fotos em batch (1 query)
6. Agrupar dados localmente com Map
7. Montar candidatos (processamento local)
8. Ordenar e limitar a 20 (local)
```

**Total**: 4 queries ao invés de 42+ ⚡

## 🔧 Como Testar

1. Limpe o cache: Feche e reabra o app
2. Vá para tela de Match
3. Observe os logs (muito menos agora!)
4. Candidatos carregam em ~2-3 segundos
5. Navegue entre tabs e volte → Não recarrega (cache)

## 🔮 Próximas Otimizações

- [ ] Implementar paginação (carregar 5-10 de cada vez)
- [ ] Cache persistente (AsyncStorage)
- [ ] Prefetch de próximos candidatos
- [ ] Lazy loading de imagens
- [ ] Service worker para cache de fotos
- [ ] Debounce de queries ao mudar filtros
