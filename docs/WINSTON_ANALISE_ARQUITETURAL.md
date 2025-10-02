# 🏗️ ANÁLISE ARQUITETURAL - WINSTON

**Arquiteto:** Winston (Agente Especializado)
**Data:** 01/10/2025
**Projeto:** Cosmic Dating App (nada-app)
**Status:** 🔴 CRÍTICO - Requer ação imediata

---

## 📋 ÍNDICE

1. [Avaliação do Estado Atual](#1-avaliação-do-estado-atual)
2. [Problemas Críticos Identificados](#2-problemas-críticos-identificados)
3. [Arquitetura Proposta](#3-arquitetura-proposta)
4. [Plano de Ação Detalhado](#4-plano-de-ação-detalhado)
5. [Decisões Arquiteturais](#5-decisões-arquiteturais)
6. [Regras de Implementação](#6-regras-de-implementação)

---

## 1. Avaliação do Estado Atual

### 1.1 Arquitetura de Autenticação

#### **Pontos Positivos:**
- ✅ Uso correto do Supabase Auth com `createClient` e configuração adequada de AsyncStorage
- ✅ Hook `useAuth` bem estruturado com gestão de estados (user, session, profile, loading)
- ✅ Context API implementada corretamente para propagação do estado de auth
- ✅ Fluxo de navegação baseado em estado de autenticação (`RootLayoutNav`)
- ✅ Auto-criação de perfil ao detectar usuário sem perfil (código PGRST116)
- ✅ Listener de `onAuthStateChange` configurado adequadamente
- ✅ Timeout de 5 segundos para prevenir loading infinito

#### **Problemas Arquiteturais Críticos:**
- ❌ **Duplicação de tabelas de perfil**: Existem `profiles` E `user_profiles` com propósitos sobrepostos
- ❌ **Inconsistência FK**: Algumas tabelas referenciam `profiles.id`, outras `user_profiles.id`
- ❌ **RLS desabilitado em tabelas críticas**: `user_profiles`, `profiles`, `user_goals`, `user_interests`, `lifestyle_preferences` têm políticas RLS mas RLS está DESABILITADO
- ❌ **Onboarding não marca completude no banco**: Flag armazenada apenas em AsyncStorage local
- ❌ **Falta de estratégia de rollback**: Se onboarding falha no step 5, dados dos steps 2-4 ficam órfãos
- ❌ **Não retoma onboarding**: Usuário que fecha app no meio do onboarding perde progresso

### 1.2 Estrutura de Banco de Dados

**Schema Atual Identificado:**

```
auth.users (1 registro) ← Tabela padrão Supabase
    ↓
├── public.profiles (0 registros) ← ❌ PROBLEMA: Duplicação
│   ├── FK: astrological_profiles.user_id
│   ├── FK: user_photos.user_id
│   ├── FK: user_goals.user_id
│   ├── FK: user_interests.user_id
│   └── FK: lifestyle_preferences.user_id
│
└── public.user_profiles (1 registro) ← Tabela atualmente em uso
    └── Todos os dados consolidados
```

**Problemas de Modelagem:**
1. **Normalização vs Denormalização confusa**: `user_profiles` tem campos consolidados (zodiac_sign, lifestyle JSON) enquanto existem tabelas separadas (`astrological_profiles`, `lifestyle_preferences`)
2. **FKs apontando para tabela errada**: `astrological_profiles`, `user_goals`, etc referenciam `profiles.id` mas app usa `user_profiles`
3. **Falta campo de controle de progresso**: Não há `onboarding_current_step` para retomar de onde parou

### 1.3 Sistema de Onboarding

**Arquitetura Atual:**
```typescript
OnboardingContext (AsyncStorage) → 8 Steps → completeOnboarding()
                                                      ↓
                                              Marca flag local apenas
                                              (não persiste no Supabase)
```

**Problemas Identificados:**
- ❌ Flag `onboarding_completed` apenas em AsyncStorage (pode ser perdida)
- ❌ Usuário pode desinstalar app e perder flag, mas dados estão no banco
- ❌ Não há campo `onboarding_completed_at` em `user_profiles` ou `profiles`
- ❌ **CRÍTICO**: Não há campo `onboarding_current_step` para retomar progresso
- ❌ Steps salvam dados incrementalmente mas sem transação (pode ficar inconsistente)
- ❌ CreateAccountScreen aguarda 1 segundo após signup (setTimeout gambiarra)

### 1.4 Segurança (RLS)

**Estado Crítico de Segurança:**

```
🔴 ERRO CRÍTICO (15 issues detectados):
- 5 tabelas com políticas RLS mas RLS DESABILITADO
  • user_profiles
  • profiles
  • user_goals
  • user_interests
  • lifestyle_preferences

⚠️ AVISO (6 issues):
- Funções sem search_path definido (vulnerabilidade de SQL injection)
  • update_updated_at_column
  • create_user_profile
  • update_user_profile
  • add_user_interests
  • add_user_goals
```

**Implicações de Segurança:**
- Qualquer usuário autenticado pode ler/modificar dados de outros usuários
- Anon key exposta no código (normal para client-side, mas RLS deve proteger)

---

## 2. Problemas Críticos Identificados

### P1 - CRÍTICO: Violação de Segurança - RLS Desabilitado
**Severidade:** 🔴 CRÍTICO
**Impacto:** Usuários podem acessar/modificar dados de outros usuários
**Tabelas Afetadas:** `user_profiles`, `profiles`, `user_goals`, `user_interests`, `lifestyle_preferences`
**Solução:** Habilitar RLS imediatamente em todas as tabelas

### P2 - CRÍTICO: Arquitetura de Dados Duplicada e Inconsistente
**Severidade:** 🔴 CRÍTICO
**Impacto:** Confusão arquitetural, desperdício de recursos, bugs futuros
**Problema:**
- Tabela `profiles` duplica `user_profiles`
- FKs apontam para tabela errada (`profiles` vs `user_profiles`)

**Solução:** Consolidar em UMA arquitetura única

### P3 - CRÍTICO: Onboarding Não Retoma de Onde Parou
**Severidade:** 🔴 CRÍTICO
**Impacto:** UX RUIM - Usuário perde progresso ao fechar app
**Solução:**
- Adicionar campo `onboarding_current_step` em `user_profiles`
- Adicionar campo `onboarding_completed_at` em `user_profiles`
- Persistir cada step imediatamente após preenchimento
- Verificar na abertura do app qual step retomar

### P4 - ALTO: Usuário que Já Criou Conta Volta para "Criar Conta"
**Severidade:** 🟠 ALTO
**Impacto:** Confusão, tentativa de criar conta duplicada
**Solução:**
- CreateAccountScreen detecta email já registrado
- Redireciona para tela de login
- Após login, retoma onboarding do step correto

### P5 - MÉDIO: Funções SQL sem search_path
**Severidade:** 🟡 MÉDIO
**Impacto:** Vulnerabilidade potencial de SQL injection
**Solução:** Adicionar `SET search_path = public, pg_temp` nas funções

---

## 3. Arquitetura Proposta

### 3.1 Decisão: Modelo de Dados Único

**Escolha Arquitetural: Usar APENAS `user_profiles` como tabela principal**

**Justificativa:**
1. `user_profiles` já está em uso pelo hook `useAuth`
2. Possui 1 registro (sistema ativo)
3. Campos mais completos e consolidados
4. Menos refatoração de código necessária

**Ação:** Deprecar e remover `profiles`

### 3.2 Estrutura de Dados Consolidada

```sql
-- ARQUITETURA DEFINITIVA

auth.users (Supabase padrão)
    ↓ (1:1)
user_profiles (Perfil principal)
    ├── id: uuid (PK, FK → auth.users.id)
    ├── name: text
    ├── age: integer
    ├── gender: text
    ├── looking_for: text
    ├── birth_date: date
    ├── birth_time: time
    ├── birth_place: text
    ├── zodiac_sign: text (calculado)
    ├── moon_sign: text
    ├── rising_sign: text
    ├── lifestyle: jsonb (álcool, fumo, exercício)
    ├── core_values: text[]
    ├── communication_style: text
    ├── personality_type: text
    ├── onboarding_current_step: integer ← NOVO (0-8, NULL = não iniciado)
    ├── onboarding_completed_at: timestamptz ← NOVO (NULL = incompleto)
    ├── created_at: timestamptz
    └── updated_at: timestamptz

    ↓ (1:N)
user_interests
    ├── id: uuid (PK)
    ├── user_id: uuid (FK → user_profiles.id)
    ├── interest: text
    └── created_at: timestamptz

    ↓ (1:N)
user_goals
    ├── id: uuid (PK)
    ├── user_id: uuid (FK → user_profiles.id)
    ├── goal: text
    └── created_at: timestamptz
```

### 3.3 Fluxo de Onboarding Robusto com Retomada

```typescript
// ARQUITETURA PROPOSTA COM RETOMADA DE PROGRESSO

┌──────────────────────────────────────────────────────────────┐
│  CENÁRIO 1: NOVO USUÁRIO                                      │
│  ────────────────────────────────────────────────────────────│
│  1. Abre app → Tela Welcome                                  │
│  2. Clica "Criar Conta" → CreateAccountScreen (Step 1)      │
│  3. Insere email/senha → supabase.auth.signUp()             │
│  4. onAuthStateChange → useAuth cria user_profiles           │
│     - onboarding_current_step = 1                            │
│     - onboarding_completed_at = NULL                         │
│  5. Avança para Step 2 (BasicInfo)                           │
│  6. Preenche dados → UPDATE user_profiles                    │
│     - onboarding_current_step = 2                            │
│  7. Continua steps 3-8...                                    │
│  8. Step 8 (Completion) → UPDATE user_profiles               │
│     - onboarding_completed_at = NOW()                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  CENÁRIO 2: USUÁRIO FECHA APP NO MEIO DO ONBOARDING          │
│  ────────────────────────────────────────────────────────────│
│  1. Usuário estava no Step 4 (Goals)                         │
│  2. Fecha o app                                              │
│  3. Banco tem: onboarding_current_step = 4                   │
│  4. Reabre app → useAuth carrega profile                     │
│  5. RootLayoutNav verifica:                                  │
│     - user existe? ✅                                         │
│     - onboarding_completed_at NULL? ✅                       │
│     - onboarding_current_step = 4                            │
│  6. OnboardingContext.setCurrentStep(4)                      │
│  7. Usuário continua do Step 4                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  CENÁRIO 3: USUÁRIO TENTA CRIAR CONTA NOVAMENTE              │
│  ────────────────────────────────────────────────────────────│
│  1. Usuário criou conta mas fechou no Step 3                 │
│  2. Reabre app → Tela Welcome                                │
│  3. Clica "Criar Conta" novamente                            │
│  4. Insere mesmo email/senha                                 │
│  5. supabase.auth.signUp() retorna erro:                     │
│     "User already registered"                                │
│  6. CreateAccountScreen detecta erro                         │
│  7. Mostra Alert: "Você já tem conta. Redirecionando..."    │
│  8. router.replace('/auth/login')                            │
│  9. Usuário faz login                                        │
│ 10. onAuthStateChange → carrega profile                      │
│     - onboarding_current_step = 3                            │
│ 11. RootLayoutNav redireciona para Step 3                    │
│ 12. Usuário continua de onde parou                           │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  CENÁRIO 4: USUÁRIO COMPLETOU ONBOARDING                     │
│  ────────────────────────────────────────────────────────────│
│  1. Reabre app → useAuth carrega profile                     │
│  2. onboarding_completed_at NOT NULL? ✅                     │
│  3. RootLayoutNav redireciona para /(tabs)                   │
│  4. App principal                                            │
└──────────────────────────────────────────────────────────────┘
```

### 3.4 Políticas RLS Adequadas

```sql
-- user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Profiles públicos para matching (SELECT)
CREATE POLICY "Users can view all profiles for matching"
    ON user_profiles FOR SELECT
    USING (true);

-- Usuário só pode criar próprio perfil
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Usuário só pode atualizar próprio perfil
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- user_goals
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all goals"
    ON user_goals FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own goals"
    ON user_goals FOR ALL
    USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

-- user_interests (similar)
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all interests"
    ON user_interests FOR SELECT
    USING (true);

CREATE POLICY "Users can manage own interests"
    ON user_interests FOR ALL
    USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));
```

---

## 4. Plano de Ação Detalhado

### FASE 1: Segurança Imediata (URGENTE - 30min)

**1.1 Habilitar RLS em Todas as Tabelas**
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrological_profiles ENABLE ROW LEVEL SECURITY;
```

**1.2 Corrigir Funções SQL**
```sql
-- Se existirem essas funções
ALTER FUNCTION update_updated_at_column() SET search_path = public, pg_temp;
```

### FASE 2: Consolidação de Dados (1h)

**2.1 Adicionar Campos de Controle de Onboarding**
```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN user_profiles.onboarding_current_step IS
'Step atual do onboarding (0-8). 0 = não iniciado, 8 = completo';

COMMENT ON COLUMN user_profiles.onboarding_completed_at IS
'Timestamp de quando onboarding foi completado. NULL = incompleto';
```

**2.2 Recriar Foreign Keys**
```sql
-- user_interests
ALTER TABLE user_interests DROP CONSTRAINT IF EXISTS user_interests_user_id_fkey;
ALTER TABLE user_interests
ADD CONSTRAINT user_interests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- user_goals
ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;
ALTER TABLE user_goals
ADD CONSTRAINT user_goals_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;
```

**2.3 Migrar Dados de profiles (se houver)**
```sql
-- Verificar se há dados em profiles
INSERT INTO user_profiles (id, name, age, gender, looking_for, created_at)
SELECT id, name, age, gender, looking_for, created_at
FROM profiles
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
```

**2.4 Remover Tabelas Duplicadas (CUIDADO)**
```sql
-- EXECUTAR APÓS MIGRAÇÃO E TESTES
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS astrological_profiles CASCADE;
DROP TABLE IF EXISTS lifestyle_preferences CASCADE;
```

### FASE 3: Refatoração de Código (3-4h)

**3.1 Atualizar useAuth Hook**

```typescript
// hooks/useAuth.ts

const getProfile = async (userId: string) => {
  try {
    console.log('🔍 Buscando perfil para usuário:', userId);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('🆕 Perfil não existe, criando...');
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            name: null,
            age: null,
            gender: null,
            looking_for: null,
            onboarding_current_step: 0, // ← NOVO
            onboarding_completed_at: null, // ← NOVO
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Erro ao criar perfil:', createError);
        } else if (newProfile) {
          console.log('✅ Perfil criado com sucesso:', newProfile);
          setProfile(newProfile);
        }
      } else {
        console.error('❌ Erro desconhecido ao carregar perfil:', error);
      }
    } else {
      console.log('✅ Perfil encontrado:', data);
      setProfile(data);
    }
  } catch (error) {
    console.error('❌ Erro catch ao carregar perfil:', error);
  } finally {
    setLoading(false);
  }
};
```

**3.2 Atualizar RootLayoutNav**

```typescript
// app/_layout.tsx

function RootLayoutNav() {
  const { user, profile, loading: authLoading } = useAuthContext();
  const { setCurrentStep } = useOnboarding();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  // If user is not authenticated, show public routes
  if (!user) {
    return (
      <Stack screenOptions={{ headerBackTitle: "Back" }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      </Stack>
    );
  }

  // User is authenticated - check onboarding status
  if (profile) {
    // ← NOVA LÓGICA
    const isOnboardingComplete = profile.onboarding_completed_at !== null;
    const currentStep = profile.onboarding_current_step || 0;

    if (!isOnboardingComplete) {
      // Retomar onboarding do step correto
      console.log('🔄 Retomando onboarding do step:', currentStep);

      // Sincronizar step com OnboardingContext
      useEffect(() => {
        if (currentStep > 0) {
          setCurrentStep(currentStep);
        }
      }, [currentStep]);

      return <OnboardingScreen />;
    }
  }

  // User is authenticated and onboarding is complete
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="profile/[id]" options={{ title: "Perfil", headerShown: false }} />
    </Stack>
  );
}
```

**3.3 Atualizar OnboardingContext**

```typescript
// contexts/OnboardingContext.tsx

// Adicionar função para sincronizar step com banco
const saveCurrentStep = async (step: number) => {
  if (user?.id) {
    await supabase
      .from('user_profiles')
      .update({ onboarding_current_step: step })
      .eq('id', user.id);
  }
};

const nextStep = async () => {
  const newStep = currentStep + 1;
  setCurrentStep(newStep);
  await saveCurrentStep(newStep); // ← NOVO
};

const previousStep = async () => {
  const newStep = currentStep - 1;
  setCurrentStep(newStep);
  await saveCurrentStep(newStep); // ← NOVO
};
```

**3.4 Atualizar CreateAccountScreen (Detectar Usuário Existente)**

```typescript
// components/onboarding/screens/CreateAccountScreen.tsx

const handleNext = async () => {
  if (!isValid) return;

  setLoading(true);

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email }
      }
    });

    if (error) {
      console.error('Erro detalhado:', error);

      // ← NOVA LÓGICA: Detectar usuário já registrado
      if (
        error.message.includes('already registered') ||
        error.message.includes('User already registered') ||
        error.status === 422
      ) {
        Alert.alert(
          'Conta já existe',
          'Você já tem uma conta com este email. Redirecionando para o login...',
          [
            {
              text: 'OK',
              onPress: () => {
                setLoading(false);
                router.replace('/auth/login');
              }
            }
          ]
        );
        return;
      }

      // Outros erros
      let errorMessage = 'Não foi possível criar sua conta.';
      if (error.message.includes('Invalid API key')) {
        errorMessage = 'Erro de configuração. Tente novamente em alguns minutos.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'A senha deve ter pelo menos 6 caracteres.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Erro ao criar conta', errorMessage);
      setLoading(false);
      return;
    }

    console.log('Resultado signup:', data);

    if (data && data.user && !data.session) {
      Alert.alert(
        'Confirme seu email',
        'Verifique seu email para confirmar sua conta.',
        [{ text: 'OK' }]
      );
    }

    updateData({ email, password });

    // Aguardar auth state change processar
    setTimeout(() => {
      setLoading(false);
      nextStep();
    }, 1000);
  } catch (err) {
    setLoading(false);
    console.error('Erro inesperado:', err);
    Alert.alert('Erro', 'Erro inesperado ao criar conta. Verifique sua conexão.');
  }
};
```

**3.5 Atualizar Cada Step para Persistir Imediatamente**

```typescript
// EXEMPLO: components/onboarding/screens/BasicInfoScreen.tsx

const handleNext = async () => {
  if (!isValid) return;

  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      setLoading(false);
      return;
    }

    // Salvar dados no banco
    const { error } = await supabase
      .from('user_profiles')
      .update({
        name: fullName,
        age: parseInt(age),
        gender: gender,
        looking_for: interestedIn,
        onboarding_current_step: 2, // ← NOVO: Marca step atual
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar seus dados. Tente novamente.');
      setLoading(false);
      return;
    }

    // Salvar no contexto local (opcional)
    updateData({
      fullName,
      age: parseInt(age),
      gender,
      interestedIn,
    });

    setLoading(false);
    nextStep(); // OnboardingContext já atualiza onboarding_current_step
  } catch (error) {
    console.error('Erro ao salvar dados:', error);
    Alert.alert('Erro', 'Erro ao salvar dados');
    setLoading(false);
  }
};

// ⚠️ APLICAR MESMO PADRÃO EM TODOS OS STEPS:
// - AstrologyScreen
// - GoalsScreen
// - InterestsScreen
// - LifestyleScreen
```

**3.6 Implementar CompletionScreen**

```typescript
// components/onboarding/screens/CompletionScreen.tsx

const handleFinish = async () => {
  setLoading(true);

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      setLoading(false);
      return;
    }

    // Marcar onboarding como completo
    const { error } = await supabase
      .from('user_profiles')
      .update({
        onboarding_completed_at: new Date().toISOString(),
        onboarding_current_step: 8, // Última etapa
      })
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao finalizar onboarding:', error);
      Alert.alert('Erro', 'Não foi possível finalizar. Tente novamente.');
      setLoading(false);
      return;
    }

    // Marcar no AsyncStorage (cache)
    await completeOnboarding();

    setLoading(false);

    // Redirecionar para app principal
    router.replace('/(tabs)');
  } catch (error) {
    console.error('Erro ao finalizar onboarding:', error);
    Alert.alert('Erro', 'Erro ao finalizar onboarding');
    setLoading(false);
  }
};
```

### FASE 4: Criar Migrations Supabase

```sql
-- supabase/migrations/20251001_consolidate_auth_and_onboarding.sql

-- 1. Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar campos de controle
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS onboarding_current_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ NULL;

-- 3. Criar políticas RLS
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
CREATE POLICY "Users can view all profiles"
    ON user_profiles FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Políticas para user_goals
DROP POLICY IF EXISTS "Users can view all goals" ON user_goals;
CREATE POLICY "Users can view all goals"
    ON user_goals FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can manage own goals" ON user_goals;
CREATE POLICY "Users can manage own goals"
    ON user_goals FOR ALL
    USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

-- 5. Políticas para user_interests
DROP POLICY IF EXISTS "Users can view all interests" ON user_interests;
CREATE POLICY "Users can view all interests"
    ON user_interests FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can manage own interests" ON user_interests;
CREATE POLICY "Users can manage own interests"
    ON user_interests FOR ALL
    USING (user_id IN (SELECT id FROM user_profiles WHERE id = auth.uid()));

-- 6. Recriar FKs se necessário
ALTER TABLE user_interests DROP CONSTRAINT IF EXISTS user_interests_user_id_fkey;
ALTER TABLE user_interests
ADD CONSTRAINT user_interests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

ALTER TABLE user_goals DROP CONSTRAINT IF EXISTS user_goals_user_id_fkey;
ALTER TABLE user_goals
ADD CONSTRAINT user_goals_user_id_fkey
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 7. Comentários para documentação
COMMENT ON COLUMN user_profiles.onboarding_current_step IS
'Step atual do onboarding (0-8). 0 = não iniciado, 8 = completo';

COMMENT ON COLUMN user_profiles.onboarding_completed_at IS
'Timestamp de quando onboarding foi completado. NULL = incompleto';
```

### FASE 5: Testes e Validação (2h)

**5.1 Testes de Fluxo**
- [ ] Signup completo (8 steps) sem fechar app
- [ ] Signup até step 3, fechar app, reabrir → deve retomar step 3
- [ ] Tentar criar conta com email existente → deve redirecionar para login
- [ ] Fazer login com conta parcial → deve retomar onboarding
- [ ] Completar onboarding → deve ir para app principal
- [ ] Reinstalar app após onboarding completo → deve ir direto para app

**5.2 Testes de Segurança**
```sql
-- Conectar como usuário A
SELECT * FROM user_profiles WHERE id = 'user-b-id'; -- Deve ver perfil (matching)
UPDATE user_profiles SET name = 'Hacker' WHERE id = 'user-b-id'; -- Deve FALHAR
DELETE FROM user_profiles WHERE id = 'user-b-id'; -- Deve FALHAR

-- Inserir goals de outro usuário
INSERT INTO user_goals (user_id, goal) VALUES ('user-b-id', 'dating'); -- Deve FALHAR
```

**5.3 Testes de UX**
- [ ] Loading states corretos em todos os steps
- [ ] Mensagens de erro claras
- [ ] Transições suaves entre steps
- [ ] Dados persistem corretamente
- [ ] Progress bar atualiza corretamente

---

## 5. Decisões Arquiteturais

### D1: Consolidar em user_profiles (não profiles)

**Justificativa:**
- ✅ Já em uso pelo código atual
- ✅ Possui dados existentes (1 registro)
- ✅ Estrutura mais completa
- ✅ Menos refatoração necessária

**Decisão:** Usar `user_profiles` e remover `profiles`

### D2: Onboarding State: DB como Source of Truth

**Decisão:** **DB é autoridade + AsyncStorage é cache**

```typescript
// Prioridade de verificação:
1. user_profiles.onboarding_completed_at (DB) ← SOURCE OF TRUTH
2. AsyncStorage: 'onboarding_completed' (cache local)
```

**Justificativa:**
- ✅ DB sobrevive reinstall
- ✅ AsyncStorage melhora UX (evita query)
- ✅ Sincronização automática via useAuth

### D3: Persistência Incremental (Não Transacional)

**Decisão:** **Cada step salva imediatamente (soft-fail)**

**Arquitetura:**
- Cada step faz UPDATE em user_profiles
- Se falhar no step 5, dados dos steps 2-4 já salvos
- Campo `onboarding_current_step` indica progresso
- Usuário pode retomar de onde parou

**Alternativa Rejeitada:** Transação atômica
- ❌ Complexidade alta
- ❌ Ruim para UX (perde tudo se falhar)
- ❌ Não funciona bem com React state

### D4: Redirecionamento Automático para Login

**Decisão:** **CreateAccountScreen detecta email existente → redireciona para login**

```typescript
if (error.message.includes('already registered')) {
  Alert.alert(
    'Conta já existe',
    'Redirecionando para o login...',
    [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
  );
}
```

**Justificativa:**
- ✅ Evita confusão do usuário
- ✅ Guia naturalmente para login
- ✅ Após login, retoma onboarding automaticamente
- ✅ UX fluida

### D5: RLS - Profiles Públicos para Matching

**Decisão:** **SELECT público, UPDATE/DELETE apenas próprio**

```sql
-- Todos podem ver perfis (necessário para matching)
CREATE POLICY "view_all" ON user_profiles FOR SELECT USING (true);

-- Apenas próprio usuário pode modificar
CREATE POLICY "update_own" ON user_profiles FOR UPDATE
    USING (auth.uid() = id);
```

**Justificativa:**
- Dating app precisa mostrar perfis
- Dados sensíveis (email) já protegidos em auth.users
- RLS previne modificação não autorizada

---

## 6. Regras de Implementação

### 🎨 REGRA PRIORITÁRIA: NÃO ALTERAR DESIGN

**❌ PROIBIDO:**
- Mudar cores, fontes, espaçamentos
- Alterar layout das telas
- Modificar componentes visuais existentes
- Mudar textos sem aprovação

**✅ PERMITIDO:**
- Adicionar lógica de negócio (persistência, validação)
- Adicionar estados de loading
- Adicionar tratamento de erros
- Modificar navegação/fluxo

**Exemplo:**
```typescript
// ❌ ERRADO
<Text style={{ color: 'blue', fontSize: 20 }}>Bem-vindo</Text>

// ✅ CORRETO (mantém estilo original)
<Text style={styles.title}>Bem-vindo</Text>
```

### 📦 Estrutura de Commits

```bash
# Commits atômicos por fase
git commit -m "feat(security): habilitar RLS em todas as tabelas"
git commit -m "feat(db): adicionar campos onboarding_current_step e completed_at"
git commit -m "feat(auth): implementar retomada de onboarding"
git commit -m "feat(onboarding): persistir cada step no banco"
git commit -m "feat(auth): redirecionar usuário existente para login"
```

### 🧪 Testes Obrigatórios

Antes de considerar pronto:
- [ ] Signup completo funciona
- [ ] Retomada de onboarding funciona
- [ ] Redirecionamento para login funciona
- [ ] RLS bloqueia acesso não autorizado
- [ ] Dados persistem corretamente
- [ ] Design permanece idêntico ao original

---

## 📊 RESUMO EXECUTIVO

### Problemas Críticos:
1. 🔴 RLS desabilitado (VIOLAÇÃO DE SEGURANÇA)
2. 🔴 Onboarding não retoma progresso
3. 🔴 Usuário existente pode tentar criar conta novamente
4. 🟠 Arquitetura duplicada (profiles vs user_profiles)

### Arquitetura Recomendada:
- **Tabela única:** `user_profiles`
- **Controle de progresso:** `onboarding_current_step` + `onboarding_completed_at`
- **RLS habilitado:** Em TODAS as tabelas
- **Persistência incremental:** Cada step salva imediatamente
- **Retomada automática:** App detecta step correto ao reabrir

### Próximos Passos:
1. ⚡ **URGENTE:** Habilitar RLS (15min)
2. 🔧 Adicionar campos de controle (30min)
3. 🔧 Atualizar código (useAuth, RootLayout, steps) (3h)
4. 🔧 Implementar redirecionamento (1h)
5. ✅ Testar fluxo completo (2h)

### Estimativa Total:
**6-8 horas** para implementação completa

---

**Winston - Arquiteto de Software Sênior**
*Análise realizada em: 01/10/2025*
