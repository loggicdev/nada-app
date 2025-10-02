# 🚨 Correções Urgentes - Onboarding NADA App

## ✅ **Problema Identificado:**
- **Erro**: "Invalid API key" no step 1/8 (CreateAccountScreen)
- **Causa**: Configurações de Authentication não habilitadas no Supabase
- **Status**: Token válido, conexão OK, mas signup bloqueado

## 🔧 **SOLUÇÃO (2 passos obrigatórios):**

### **1. Executar SQL das Tabelas:**
1. **Acesse**: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/sql
2. **Copie todo o conteúdo** do arquivo: `supabase_dashboard_onboarding_tables.sql`
3. **Cole no SQL Editor** e clique **"Run"**
4. **Verifique** que apareceu: "Setup complete!"

### **2. Habilitar Authentication:**
1. **Acesse**: https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj/auth/users
2. **Vá em**: Settings → Authentication
3. **Habilite**:
   - ✅ Enable email confirmations
   - ✅ Enable phone confirmations (opcional)
   - ✅ Enable signup (se estiver desabilitado)
4. **Salve** as configurações

### **3. Verificar se funcionou:**
```bash
node scripts/debug-supabase-auth.js
```
**Deve mostrar**: ✅ Signup funcionou!

## 📱 **Fluxo Correto do Onboarding:**

### **Como deve funcionar agora:**
1. **Step 0**: WelcomeScreen → "Criar Conta"
2. **Step 1/8**: CreateAccountScreen → Cria conta no Supabase
3. **Step 2/8**: BasicInfoScreen → Dados básicos (nome, idade, etc.)
4. **Step 3/8**: AstrologyScreen → Data de nascimento
5. **Step 4/8**: GoalsScreen → Objetivos relacionamento
6. **Step 5/8**: InterestsScreen → Interesses (mín 3)
7. **Step 6/8**: LifestyleScreen → Álcool, fumo, exercícios
8. **Step 7/8**: CompletionScreen → Finalização

### **Dados salvos automaticamente:**
- **Step 1**: `auth.users` (email/senha)
- **Step 2**: `profiles` (nome, idade, gênero, preferências)
- **Step 3**: `astrological_profiles` (nascimento, hora, local)
- **Step 4**: `user_goals` (paquera, sério, casamento, amizade)
- **Step 5**: `user_interests` (lista de interesses)
- **Step 6**: `lifestyle_preferences` (álcool, fumo, exercícios)

## 🎯 **Status Atual:**

### ✅ **Já Implementado:**
- Sistema completo de onboarding (8 steps)
- Integração com banco em todos os steps
- Estados de loading e error handling
- Design consistente mantido
- Arquivos SQL criados pelo MCP
- Scripts de debug e verificação

### ⚠️ **Precisa Fazer:**
1. **Executar SQL** no Supabase Dashboard
2. **Habilitar Authentication** no Dashboard
3. **Testar fluxo** completo

## 🧪 **Teste Rápido:**

Após as correções:
```bash
# 1. Testar auth
node scripts/debug-supabase-auth.js

# 2. Testar tabelas
node check_existing_tables.js

# 3. Rodar app
npm start
# Clique "Criar Conta" → Deve funcionar sem erro
```

## 📋 **Arquivos Criados:**

- `✅ supabase_dashboard_onboarding_tables.sql` - SQL completo para executar
- `✅ scripts/debug-supabase-auth.js` - Debug de authentication
- `✅ check_existing_tables.js` - Verificar tabelas
- `✅ ONBOARDING_TABLES_SETUP_INSTRUCTIONS.md` - Instruções detalhadas

**Depois das correções, o onboarding estará 100% funcional!** 🎉