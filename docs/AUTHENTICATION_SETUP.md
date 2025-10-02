# Configuração de Autenticação - Nada App

## Resumo do que foi implementado

### 1. **Estrutura do Banco de Dados**
- **Tabela auth.users**: Tabela padrão do Supabase para autenticação (email, senha, etc.)
- **Tabela profiles**: Dados básicos do usuário (nome, idade, localização, etc.)
- **Tabelas relacionadas**:
  - `user_photos`: Fotos do usuário
  - `astrological_profiles`: Perfil astrológico completo
  - `user_interests`: Interesses do usuário
  - `user_goals`: Objetivos de relacionamento
  - `lifestyle_preferences`: Preferências de estilo de vida
  - `matches`: Sistema de matches
  - `conversations` e `messages`: Sistema de mensagens

### 2. **Componentes de Autenticação**
- **AuthInput**: Input customizado com validação
- **AuthButton**: Botão com estados de loading
- **LoginScreen**: Tela de login (`/auth/login`)
- **SignupScreen**: Tela de cadastro (`/auth/signup`)

### 3. **Gerenciamento de Estado**
- **useAuth**: Hook customizado para gerenciar autenticação
- **AuthContext**: Contexto global de autenticação
- **AuthProvider**: Provider integrado no app principal

### 4. **Integração Supabase**
- Cliente configurado com AsyncStorage para persistência
- Types TypeScript gerados para o banco
- Políticas RLS (Row Level Security) configuradas
- Triggers para updated_at automático

## Como usar o MCP para executar as migrações

### 1. **Configurar variáveis de ambiente**
```bash
export SUPABASE_SERVICE_ROLE_KEY="sua-service-role-key-aqui"
```

### 2. **Executar migração manual via Supabase Dashboard**
1. Acesse o Supabase Dashboard
2. Vá para SQL Editor
3. Execute o conteúdo do arquivo `supabase/migrations/001_create_profile_tables.sql`

### 3. **Testar a autenticação**
1. Execute `npm start` para iniciar o app
2. Na tela de boas-vindas, clique em "Entrar" ou "Criar Conta"
3. Teste o fluxo completo de cadastro/login

## Próximos passos recomendados

### 1. **Configurar Google Authentication**
```bash
npm install expo-auth-session expo-crypto
```

### 2. **Implementar recuperação de senha**
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(email);
```

### 3. **Adicionar validação de email**
Configure no Supabase Dashboard:
- Auth > Settings > Email confirmations

### 4. **Implementar onboarding pós-cadastro**
- Criar perfil astrológico
- Upload de fotos
- Definir preferências

### 5. **Configurar políticas RLS mais granulares**
- Baseadas em matches
- Privacidade de fotos
- Controle de mensagens

## Estrutura de arquivos criada

```
nada-app/
├── lib/
│   └── supabase.ts                 # Cliente Supabase configurado
├── types/
│   └── database.ts                 # Types do banco de dados
├── hooks/
│   └── useAuth.ts                  # Hook de autenticação
├── contexts/
│   └── AuthContext.tsx             # Contexto de autenticação
├── components/
│   └── auth/
│       ├── AuthInput.tsx           # Input customizado
│       └── AuthButton.tsx          # Botão customizado
├── app/
│   └── auth/
│       ├── login.tsx               # Tela de login
│       └── signup.tsx              # Tela de cadastro
├── supabase/
│   └── migrations/
│       └── 001_create_profile_tables.sql  # Schema do banco
└── scripts/
    └── migrate.js                  # Script de migração
```

## Como usar no desenvolvimento

### 1. **Verificar se usuário está logado**
```typescript
import { useAuthContext } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuthContext();

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;

  return <AuthenticatedContent />;
}
```

### 2. **Fazer logout**
```typescript
const { signOut } = useAuthContext();

const handleLogout = async () => {
  await signOut();
};
```

### 3. **Atualizar perfil**
```typescript
const { updateProfile } = useAuthContext();

const handleUpdateProfile = async () => {
  await updateProfile({
    name: 'Novo Nome',
    bio: 'Nova bio'
  });
};
```

### 4. **Acessar dados do usuário**
```typescript
const { user, profile } = useAuthContext();

// user: dados da auth.users (email, id, etc.)
// profile: dados da tabela profiles (nome, idade, etc.)
```