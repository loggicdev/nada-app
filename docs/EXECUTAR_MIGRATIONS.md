# 🗄️ Executar Migrações - URGENTE

## ⚡ **PASSO A PASSO (2 minutos):**

### **1. Acesse o Supabase Dashboard:**
🔗 https://supabase.com/dashboard/project/zxdpgfndcgbidtnrrnwj

### **2. Vá em "SQL Editor"**
(Menu lateral esquerdo)

### **3. Copie e cole este SQL:**

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER,
  bio TEXT,
  location TEXT,
  gender TEXT CHECK (gender IN ('feminine', 'masculine', 'non-binary')),
  looking_for TEXT CHECK (looking_for IN ('women', 'men', 'everyone')),
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_interests table
CREATE TABLE IF NOT EXISTS user_interests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  interest TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, interest)
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  goal TEXT CHECK (goal IN ('dating', 'serious', 'marriage', 'friendship')) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal)
);

-- Create astrological_profiles table
CREATE TABLE IF NOT EXISTS astrological_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  zodiac_sign TEXT,
  moon_sign TEXT,
  rising_sign TEXT,
  birth_date DATE,
  birth_time TIME,
  birth_place TEXT,
  personality_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create lifestyle_preferences table
CREATE TABLE IF NOT EXISTS lifestyle_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  alcohol TEXT CHECK (alcohol IN ('never', 'socially', 'regularly')),
  smoking TEXT CHECK (smoking IN ('never', 'socially', 'regularly')),
  exercise TEXT CHECK (exercise IN ('never', 'sometimes', 'regularly', 'daily')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE astrological_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can manage own interests" ON user_interests FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own goals" ON user_goals FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own astrological profile" ON astrological_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own lifestyle preferences" ON lifestyle_preferences FOR ALL USING (auth.uid() = user_id);
```

### **4. Clique em "Run"**

### **5. Teste:**
```bash
node scripts/test-db.js
```

**Deve mostrar:** ✅ Tabela profiles existe!

## 🎯 **Depois disso:**
- O onboarding vai salvar todos os dados no banco
- Steps 1-7 vão funcionar com dados persistidos
- App estará completo com banco funcionando