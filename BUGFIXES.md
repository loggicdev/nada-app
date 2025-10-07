# Correções de Bugs - Sistema de Match

## 🐛 Problemas Corrigidos

### 1. **Card não mudava após dar Match** ✅

**Problema**: Ao dar like/match, o toast aparecia mas o card permanecia na tela.

**Causa**: O filtro `availableCandidates` só verificava `isDisliked`, mas não `isLiked`.

**Solução** ([contexts/MatchContext.tsx:50](contexts/MatchContext.tsx#L50)):
```typescript
// Antes
const availableCandidates = candidates.filter(c => !c.isDisliked); ❌

// Depois
const availableCandidates = candidates.filter(c => !c.isDisliked && !c.isLiked); ✅
```

**Resultado**: Agora quando você dá like, o candidato é marcado como `isLiked: true` e automaticamente sai da lista disponível, mostrando o próximo card.

---

### 2. **Foto do usuário não aparecia no card** ✅

**Problema**: Cards apareciam sem foto, mostrando apenas o ícone de placeholder.

**Causa**:
- O `avatar_url` não estava sendo incluído no array de fotos
- Alguns usuários tinham fotos na tabela `user_photos` mas não tinham `avatar_url`

**Solução** ([contexts/MatchContext.tsx:221-237](contexts/MatchContext.tsx#L221-L237)):
```typescript
// Construir array de fotos
let userPhotos = [...photos];

// Se não tem fotos ou avatar_url não está nas fotos, adicionar avatar_url primeiro
if (candidateProfile.avatar_url && !photos.includes(candidateProfile.avatar_url)) {
  userPhotos = [candidateProfile.avatar_url, ...photos];
}

// Garantir que sempre há pelo menos uma foto
if (userPhotos.length === 0 && candidateProfile.avatar_url) {
  userPhotos = [candidateProfile.avatar_url];
}

// Debug
if (userPhotos.length === 0) {
  console.log(`⚠️ Candidato ${candidateProfile.name} sem fotos!`);
}
```

**Lógica**:
1. Copia array de fotos da tabela `user_photos`
2. Se `avatar_url` existe e não está no array, adiciona no início
3. Se array está vazio mas tem `avatar_url`, usa o avatar
4. Log de debug para candidatos sem foto

**Resultado**: Agora o avatar sempre aparece, mesmo que o usuário não tenha fotos adicionais.

---

## 🔄 Fluxo Correto Agora

### Like/Match
```
1. Usuário dá like
2. `likeUser()` marca candidato como `isLiked: true`
3. Toast aparece
4. `availableCandidates` é recalculado (filtra isLiked)
5. `currentCandidate` muda para próximo disponível
6. Card atualiza automaticamente ✅
```

### Pass/Rejeitar
```
1. Usuário dá pass
2. `dislikeUser()` marca candidato como `isDisliked: true`
3. Toast aparece
4. `availableCandidates` é recalculado (filtra isDisliked)
5. `currentCandidate` muda para próximo disponível
6. Card atualiza automaticamente ✅
```

---

## 🧪 Como Testar

### Teste 1: Troca de Card no Match
1. Abra a tela de Match
2. Dê like em um usuário (swipe direita ou ❤️)
3. ✅ Toast aparece
4. ✅ Card muda para próximo candidato imediatamente

### Teste 2: Troca de Card no Pass
1. Abra a tela de Match
2. Dê pass em um usuário (swipe esquerda ou ✕)
3. ✅ Toast aparece
4. ✅ Card muda para próximo candidato imediatamente

### Teste 3: Fotos Aparecem
1. Abra a tela de Match
2. ✅ Foto do usuário aparece no card
3. Se não aparecer, verifique logs: `⚠️ Candidato [Nome] sem fotos!`

---

## 📊 Estado do Candidato

Cada candidato agora tem 3 estados possíveis:

| Estado | Aparece na Lista? | Motivo |
|--------|------------------|---------|
| `{ isLiked: false, isDisliked: false }` | ✅ Sim | Candidato disponível |
| `{ isLiked: true, isDisliked: false }` | ❌ Não | Já deu like |
| `{ isLiked: false, isDisliked: true }` | ❌ Não | Já rejeitou |

---

## 🔮 Próximas Melhorias

- [ ] Animação de saída do card ao dar like/pass
- [ ] Prefetch de próximas fotos para loading instantâneo
- [ ] Botão "Desfazer" para voltar último candidato
- [ ] Indicador de progresso (X de Y candidatos)
- [ ] Lazy loading de imagens para performance
