# Toast Feedback - Sistema de Match

## ✅ Implementação de Toasts

Adicionei feedback visual com toasts para todas as ações na tela de match.

### 📋 Tipos de Toast

#### 1. **Curtir (Like) - Success**
- **Mensagem**: `💜 Você curtiu [Nome]`
- **Tipo**: `success` (verde - cosmic.sage)
- **Duração**: 2.5 segundos
- **Quando**: Ao dar like sem haver match mútuo

#### 2. **Match Mútuo - Success**
- **Mensagem**: `🎉 Match com [Nome]!`
- **Tipo**: `success` (verde - cosmic.sage)
- **Duração**: 2.5 segundos
- **Quando**: Quando há match mútuo
- **Extras**:
  - Alert aparece 1 segundo depois do toast
  - Opções: "Ver depois" ou "Conversar"

#### 3. **Rejeitar (Pass) - Info**
- **Mensagem**: `Você dispensou [Nome]`
- **Tipo**: `info` (roxo - cosmic.purple)
- **Duração**: 2.5 segundos
- **Quando**: Ao dar pass/swipe esquerda

#### 4. **Erro - Error**
- **Mensagem**: `Erro ao curtir perfil`
- **Tipo**: `error` (vermelho - cosmic.rose)
- **Duração**: 2.5 segundos
- **Quando**: Ocorre algum erro na ação de like

## 🎨 Design do Toast

O toast utiliza o componente existente em [`components/common/Toast.tsx`](components/common/Toast.tsx):

- **Posição**: Topo da tela (60px iOS / 40px Android)
- **Animação**: Slide down + fade in/out
- **Cores**:
  - Success: Verde (#8B9D83 - cosmic.sage)
  - Error: Rose (#D4A5A5 - cosmic.rose)
  - Info: Roxo (#9B87B5 - cosmic.purple)
- **Ícones**:
  - Success: ✓ (Check)
  - Error: ✕ (X)
  - Info: ⓘ (AlertCircle)

## 🔄 Fluxo Completo

### Like sem Match
```
1. Usuário dá like (swipe/botão)
2. Toast aparece: "💜 Você curtiu [Nome]"
3. Card muda para próximo candidato
4. Toast desaparece após 2.5s
```

### Like com Match
```
1. Usuário dá like (swipe/botão)
2. Toast aparece: "🎉 Match com [Nome]!"
3. Card muda para próximo candidato
4. Após 1s, Alert aparece: "💫 É um Match!"
5. Toast desaparece após 2.5s
6. Usuário escolhe: "Ver depois" ou "Conversar"
```

### Pass/Rejeitar
```
1. Usuário dá pass (swipe/botão)
2. Toast aparece: "Você dispensou [Nome]"
3. Card muda para próximo candidato
4. Toast desaparece após 2.5s
```

## 📝 Código Adicionado

### Match Screen ([app/(tabs)/match.tsx](app/(tabs)/match.tsx))

```typescript
// Estados do Toast
const [toastVisible, setToastVisible] = useState<boolean>(false);
const [toastMessage, setToastMessage] = useState<string>('');
const [toastType, setToastType] = useState<ToastType>('success');

// Helper para mostrar toast
const showToast = (message: string, type: ToastType = 'success') => {
  setToastMessage(message);
  setToastType(type);
  setToastVisible(true);
};

// No render
<Toast
  visible={toastVisible}
  message={toastMessage}
  type={toastType}
  onHide={() => setToastVisible(false)}
  duration={2500}
/>
```

## 🎯 Benefícios

1. **Feedback Imediato**: Usuário sabe instantaneamente que a ação foi processada
2. **Não-Intrusivo**: Toast desaparece sozinho, não bloqueia a tela
3. **Claro e Objetivo**: Mensagens curtas e diretas
4. **Visual Consistente**: Usa o design system do app
5. **Duplo Feedback no Match**: Toast + Alert garantem que o usuário não perca o match

## 🔮 Melhorias Futuras

- [ ] Adicionar som/vibração no match mútuo
- [ ] Animação especial de confete no toast de match
- [ ] Toast customizado com foto do match
- [ ] Histórico de toasts (desfazer última ação)
- [ ] Toast com botão de ação rápida ("Ver perfil" no like)
