import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  ScrollView,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from 'react-native';
import { X, ChevronDown, ChevronUp, User, Heart, Target, Dumbbell, Star, MapPin, GraduationCap, Briefcase, Globe } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Toast, { ToastType } from '@/components/common/Toast';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface EditProfileBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

const genderOptions = [
  { id: 'feminine', label: 'Feminino' },
  { id: 'masculine', label: 'Masculino' },
  { id: 'non-binary', label: 'Não-binário' },
];

const lookingForOptions = [
  { id: 'women', label: 'Mulheres' },
  { id: 'men', label: 'Homens' },
  { id: 'everyone', label: 'Todos' },
];

const lifestyleOptions = {
  smoking: [
    { id: 'never', label: 'Nunca' },
    { id: 'socially', label: 'Socialmente' },
    { id: 'regularly', label: 'Regularmente' },
  ],
  alcohol: [
    { id: 'never', label: 'Nunca' },
    { id: 'socially', label: 'Socialmente' },
    { id: 'regularly', label: 'Regularmente' },
  ],
  exercise: [
    { id: 'never', label: 'Nunca' },
    { id: 'sometimes', label: 'Às vezes' },
    { id: 'regularly', label: 'Regularmente' },
    { id: 'daily', label: 'Diariamente' },
  ],
};

const SUGGESTED_INTERESTS = [
  'Música', 'Cinema', 'Leitura', 'Esportes', 'Viagem', 'Fotografia',
  'Culinária', 'Arte', 'Dança', 'Tecnologia', 'Natureza', 'Fitness',
  'Yoga', 'Meditação', 'Astrologia', 'Psicologia', 'Filosofia', 'Moda',
  'Camping', 'Vegetarianismo', 'R&B', 'Sustentabilidade'
];

// Mapeamento de goals display (português) -> valor do banco (inglês)
const GOAL_OPTIONS = [
  { id: 'dating', label: 'Namoro casual' },
  { id: 'serious', label: 'Relacionamento sério' },
  { id: 'marriage', label: 'Casamento' },
  { id: 'friendship', label: 'Amizade' },
];

// Mapa reverso para converter valor do banco para display
const GOAL_LABELS: { [key: string]: string } = {
  'dating': 'Namoro casual',
  'serious': 'Relacionamento sério',
  'marriage': 'Casamento',
  'friendship': 'Amizade',
};

const LOVE_LANGUAGE_OPTIONS = [
  { id: 'words_of_affirmation', label: 'Palavras de afirmação' },
  { id: 'quality_time', label: 'Tempo de qualidade' },
  { id: 'acts_of_service', label: 'Atos de serviço' },
  { id: 'physical_touch', label: 'Toque físico' },
  { id: 'receiving_gifts', label: 'Receber presentes' },
];

const SUGGESTED_VALUES = [
  'Honestidade', 'Criatividade', 'Liberdade', 'Empatia', 'Conexão',
  'Crescimento', 'Aventura', 'Imaginação', 'Natureza', 'Autenticidade',
  'Família', 'Espiritualidade', 'Inovação', 'Sustentabilidade', 'Respeito'
];

const SUGGESTED_LANGUAGES = [
  'Português', 'Inglês', 'Espanhol', 'Francês', 'Italiano',
  'Alemão', 'Mandarim', 'Japonês', 'Coreano', 'Árabe'
];

export default function EditProfileBottomSheet({ visible, onClose, onSaveSuccess }: EditProfileBottomSheetProps) {
  const { profile, user, updateProfile } = useAuthContext();
  const [saving, setSaving] = useState(false);

  // Toast states
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<ToastType>('success');

  // Animated values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  // Accordion states
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const showToast = (message: string, type: ToastType = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  // Form states - Informações Básicas
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  // Form states - Astrologia
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // Form states - Interesses
  const [interests, setInterests] = useState<string[]>([]);

  // Form states - Objetivos
  const [goals, setGoals] = useState<string[]>([]);

  // Form states - Estilo de Vida
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [exercise, setExercise] = useState('');

  // Form states - Valores e Linguagens do Amor
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);

  // Form states - Informações Profissionais
  const [education, setEducation] = useState('');
  const [profession, setProfession] = useState('');
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);

  // Load profile data
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || '');
      setLookingFor(profile.looking_for || '');

      // Convert YYYY-MM-DD to DD/MM/YYYY for display
      if (profile.birth_date) {
        const [year, month, day] = profile.birth_date.split('-');
        setBirthDate(`${day}/${month}/${year}`);
      }
      setBirthTime(profile.birth_time || '');
      setBirthPlace(profile.birth_place || '');

      if (profile.lifestyle && typeof profile.lifestyle === 'object') {
        const lifestyle = profile.lifestyle as any;
        setSmoking(lifestyle.smoking || '');
        setAlcohol(lifestyle.alcohol || '');
        setExercise(lifestyle.exercise || '');
      }

      // Load new fields
      setCoreValues(profile.core_values || []);
      setLoveLanguages(profile.love_languages || []);
      setEducation(profile.education || '');
      setProfession(profile.profession || '');
      setLanguagesSpoken(profile.languages_spoken || []);
    }
  }, [profile, visible]);

  // Load interests and goals from separate tables
  useEffect(() => {
    if (user?.id && visible) {
      loadInterestsAndGoals();
    }
  }, [user?.id, visible]);

  const loadInterestsAndGoals = async () => {
    if (!user?.id) return;

    try {
      // Load interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('interest')
        .eq('user_id', user.id);

      if (interestsData) {
        setInterests(interestsData.map(i => i.interest));
      }

      // Load goals - eles vêm do banco em inglês (dating, serious, etc)
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('goal')
        .eq('user_id', user.id);

      if (goalsData) {
        // Manter os IDs (inglês) no estado, não os labels
        setGoals(goalsData.map(g => g.goal));
      }
    } catch (error) {
      console.error('Error loading interests and goals:', error);
    }
  };

  // Animation on open
  useEffect(() => {
    if (visible) {
      sheetTranslateY.setValue(600);
      backgroundOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(backgroundOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 600,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const toggleSection = (section: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleInterestToggle = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(prev => prev.filter(item => item !== interest));
    } else if (interests.length < 8) {
      setInterests(prev => [...prev, interest]);
    }
  };

  const handleGoalToggle = (goalId: string) => {
    if (goals.includes(goalId)) {
      setGoals(prev => prev.filter(item => item !== goalId));
    } else {
      setGoals(prev => [...prev, goalId]);
    }
  };

  const handleCoreValueToggle = (value: string) => {
    if (coreValues.includes(value)) {
      setCoreValues(prev => prev.filter(item => item !== value));
    } else if (coreValues.length < 8) {
      setCoreValues(prev => [...prev, value]);
    }
  };

  const handleLoveLanguageToggle = (language: string) => {
    if (loveLanguages.includes(language)) {
      setLoveLanguages(prev => prev.filter(item => item !== language));
    } else if (loveLanguages.length < 3) {
      setLoveLanguages(prev => [...prev, language]);
    }
  };

  const handleLanguageSpokenToggle = (language: string) => {
    if (languagesSpoken.includes(language)) {
      setLanguagesSpoken(prev => prev.filter(item => item !== language));
    } else if (languagesSpoken.length < 5) {
      setLanguagesSpoken(prev => [...prev, language]);
    }
  };

  const handleSave = async () => {
    if (!user?.id) {
      console.error('❌ Usuário não autenticado');
      showToast('Você precisa estar autenticado para editar o perfil.', 'error');
      return;
    }

    console.log('🔄 Iniciando salvamento do perfil...');
    console.log('👤 User ID:', user.id);

    setSaving(true);

    try {
      // Convert date back to ISO format if needed
      let isoDate = birthDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
        const [day, month, year] = birthDate.split('/');
        isoDate = `${year}-${month}-${day}`;
      }

      const updateData = {
        name,
        age: parseInt(age) || null,
        gender,
        looking_for: lookingFor,
        birth_date: isoDate || null,
        birth_time: birthTime || null,
        birth_place: birthPlace || null,
        lifestyle: {
          smoking,
          alcohol,
          exercise,
        },
        core_values: coreValues,
        love_languages: loveLanguages,
        education: education || null,
        profession: profession || null,
        languages_spoken: languagesSpoken,
      };

      console.log('📝 Dados a serem salvos:', updateData);

      // Update user_profiles usando o método do contexto
      // Isso atualiza o banco E o estado local automaticamente
      await updateProfile(updateData);

      console.log('✅ Perfil atualizado com sucesso!');

      // Update interests - delete old ones and insert new ones
      console.log('🔄 Atualizando interesses...');
      const { error: deleteInterestsError } = await supabase
        .from('user_interests')
        .delete()
        .eq('user_id', user.id);

      if (deleteInterestsError) {
        console.error('❌ Erro ao deletar interesses:', deleteInterestsError);
      }

      if (interests.length > 0) {
        const interestsData = interests.map(interest => ({
          user_id: user.id,
          interest,
        }));
        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(interestsData);

        if (interestsError) {
          console.error('❌ Erro ao inserir interesses:', interestsError);
          throw interestsError;
        }
        console.log('✅ Interesses atualizados!');
      }

      // Update goals - delete old ones and insert new ones
      console.log('🔄 Atualizando objetivos...');
      const { error: deleteGoalsError } = await supabase
        .from('user_goals')
        .delete()
        .eq('user_id', user.id);

      if (deleteGoalsError) {
        console.error('❌ Erro ao deletar objetivos:', deleteGoalsError);
      }

      if (goals.length > 0) {
        const goalsData = goals.map(goal => ({
          user_id: user.id,
          goal,
        }));
        const { error: goalsError } = await supabase
          .from('user_goals')
          .insert(goalsData);

        if (goalsError) {
          console.error('❌ Erro ao inserir objetivos:', goalsError);
          throw goalsError;
        }
        console.log('✅ Objetivos atualizados!');
      }

      console.log('🎉 Salvamento completo!');

      // Chamar callback de sucesso se fornecido
      if (onSaveSuccess) {
        onSaveSuccess();
      }

      // Mostrar toast de sucesso
      showToast('Perfil atualizado com sucesso!', 'success');

      // Fechar o sheet após um pequeno delay para o usuário ver o toast
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error: any) {
      console.error('❌ Erro geral ao atualizar perfil:', error);
      showToast(error.message || 'Não foi possível atualizar o perfil.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const renderAccordionSection = (
    title: string,
    icon: React.ReactNode,
    sectionKey: string,
    content: React.ReactNode
  ) => {
    const isExpanded = expandedSection === sectionKey;

    return (
      <View style={styles.accordionSection}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.7}
        >
          <View style={styles.accordionHeaderLeft}>
            {icon}
            <Text style={styles.accordionTitle}>{title}</Text>
          </View>
          {isExpanded ? (
            <ChevronUp size={20} color={colors.cosmic.purple} />
          ) : (
            <ChevronDown size={20} color={colors.neutral[400]} />
          )}
        </TouchableOpacity>

        {isExpanded && <View style={styles.accordionContent}>{content}</View>}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalContainer}>
        {/* Toast */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
          duration={2500}
        />

        {/* Background */}
        <Animated.View style={[styles.background, { opacity: backgroundOpacity }]}>
          <Pressable style={styles.fullPressable} onPress={handleClose} />
        </Animated.View>

        {/* Bottom Sheet */}
        <Pressable style={styles.sheetPressable} onPress={handleClose}>
          <Animated.View
            style={[styles.bottomSheet, { transform: [{ translateY: sheetTranslateY }] }]}
          >
            <Pressable onPress={(e) => e.stopPropagation()} style={styles.sheetInnerContainer}>
              {/* Header */}
              <View style={styles.handle} />
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Editar Perfil</Text>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
              >
                {/* Informações Básicas */}
                {renderAccordionSection(
                  'Informações Básicas',
                  <User size={20} color={colors.cosmic.purple} />,
                  'basic',
                  <View>
                    <Text style={styles.label}>Nome</Text>
                    <TextInput
                      style={styles.input}
                      value={name}
                      onChangeText={setName}
                      placeholder="Seu nome"
                      placeholderTextColor={colors.neutral[400]}
                    />

                    <Text style={styles.label}>Idade</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      placeholder="Sua idade"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Gênero</Text>
                    <View style={styles.optionsRow}>
                      {genderOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            gender === option.id && styles.optionButtonActive,
                          ]}
                          onPress={() => setGender(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              gender === option.id && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Procurando por</Text>
                    <View style={styles.optionsRow}>
                      {lookingForOptions.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            lookingFor === option.id && styles.optionButtonActive,
                          ]}
                          onPress={() => setLookingFor(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              lookingFor === option.id && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Astrologia */}
                {renderAccordionSection(
                  'Astrologia',
                  <Star size={20} color={colors.cosmic.purple} />,
                  'astrology',
                  <View>
                    <Text style={styles.label}>Data de Nascimento</Text>
                    <TextInput
                      style={styles.input}
                      value={birthDate}
                      onChangeText={setBirthDate}
                      placeholder="DD/MM/AAAA"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Hora de Nascimento (Opcional)</Text>
                    <TextInput
                      style={styles.input}
                      value={birthTime}
                      onChangeText={setBirthTime}
                      placeholder="HH:MM"
                      placeholderTextColor={colors.neutral[400]}
                      keyboardType="number-pad"
                    />

                    <Text style={styles.label}>Local de Nascimento</Text>
                    <TextInput
                      style={styles.input}
                      value={birthPlace}
                      onChangeText={setBirthPlace}
                      placeholder="Cidade, Estado, País"
                      placeholderTextColor={colors.neutral[400]}
                    />
                  </View>
                )}

                {/* Interesses */}
                {renderAccordionSection(
                  'Interesses',
                  <Heart size={20} color={colors.cosmic.purple} />,
                  'interests',
                  <View>
                    <Text style={styles.label}>
                      Selecionados ({interests.length}/8)
                    </Text>
                    <View style={styles.tagsContainer}>
                      {interests.length > 0 ? (
                        interests.map((interest) => (
                          <TouchableOpacity
                            key={interest}
                            style={styles.selectedTag}
                            onPress={() => handleInterestToggle(interest)}
                          >
                            <Text style={styles.selectedTagText}>{interest}</Text>
                            <X size={14} color="white" />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.helperText}>Nenhum interesse selecionado</Text>
                      )}
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Sugestões</Text>
                    <View style={styles.tagsContainer}>
                      {SUGGESTED_INTERESTS.filter(i => !interests.includes(i)).map((interest) => (
                        <TouchableOpacity
                          key={interest}
                          style={styles.suggestionTag}
                          onPress={() => handleInterestToggle(interest)}
                          disabled={interests.length >= 8}
                        >
                          <Text style={styles.suggestionTagText}>{interest}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Objetivos */}
                {renderAccordionSection(
                  'Objetivos',
                  <Target size={20} color={colors.cosmic.purple} />,
                  'goals',
                  <View>
                    <Text style={styles.label}>
                      Selecione seus objetivos
                    </Text>
                    <View style={styles.optionsRow}>
                      {GOAL_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            goals.includes(option.id) && styles.optionButtonActive,
                          ]}
                          onPress={() => handleGoalToggle(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              goals.includes(option.id) && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Valores */}
                {renderAccordionSection(
                  'Valores',
                  <Heart size={20} color={colors.cosmic.purple} />,
                  'values',
                  <View>
                    <Text style={styles.label}>
                      Selecionados ({coreValues.length}/8)
                    </Text>
                    <View style={styles.tagsContainer}>
                      {coreValues.length > 0 ? (
                        coreValues.map((value) => (
                          <TouchableOpacity
                            key={value}
                            style={styles.selectedTag}
                            onPress={() => handleCoreValueToggle(value)}
                          >
                            <Text style={styles.selectedTagText}>{value}</Text>
                            <X size={14} color="white" />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.helperText}>Nenhum valor selecionado</Text>
                      )}
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Sugestões</Text>
                    <View style={styles.tagsContainer}>
                      {SUGGESTED_VALUES.filter(v => !coreValues.includes(v)).map((value) => (
                        <TouchableOpacity
                          key={value}
                          style={styles.suggestionTag}
                          onPress={() => handleCoreValueToggle(value)}
                          disabled={coreValues.length >= 8}
                        >
                          <Text style={styles.suggestionTagText}>{value}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Linguagens do Amor */}
                {renderAccordionSection(
                  'Linguagens do Amor',
                  <Heart size={20} color={colors.cosmic.purple} />,
                  'love_languages',
                  <View>
                    <Text style={styles.label}>
                      Selecione até 3 linguagens do amor
                    </Text>
                    <View style={styles.optionsRow}>
                      {LOVE_LANGUAGE_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            loveLanguages.includes(option.id) && styles.optionButtonActive,
                          ]}
                          onPress={() => handleLoveLanguageToggle(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              loveLanguages.includes(option.id) && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Informações Profissionais */}
                {renderAccordionSection(
                  'Informações Profissionais',
                  <Briefcase size={20} color={colors.cosmic.purple} />,
                  'professional',
                  <View>
                    <Text style={styles.label}>Formação</Text>
                    <TextInput
                      style={styles.input}
                      value={education}
                      onChangeText={setEducation}
                      placeholder="Ex: Psicologia - USP"
                      placeholderTextColor={colors.neutral[400]}
                    />

                    <Text style={styles.label}>Profissão</Text>
                    <TextInput
                      style={styles.input}
                      value={profession}
                      onChangeText={setProfession}
                      placeholder="Ex: Psicóloga Clínica"
                      placeholderTextColor={colors.neutral[400]}
                    />

                    <Text style={styles.label}>
                      Idiomas ({languagesSpoken.length}/5)
                    </Text>
                    <View style={styles.tagsContainer}>
                      {languagesSpoken.length > 0 ? (
                        languagesSpoken.map((language) => (
                          <TouchableOpacity
                            key={language}
                            style={styles.selectedTag}
                            onPress={() => handleLanguageSpokenToggle(language)}
                          >
                            <Text style={styles.selectedTagText}>{language}</Text>
                            <X size={14} color="white" />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.helperText}>Nenhum idioma selecionado</Text>
                      )}
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Sugestões</Text>
                    <View style={styles.tagsContainer}>
                      {SUGGESTED_LANGUAGES.filter(l => !languagesSpoken.includes(l)).map((language) => (
                        <TouchableOpacity
                          key={language}
                          style={styles.suggestionTag}
                          onPress={() => handleLanguageSpokenToggle(language)}
                          disabled={languagesSpoken.length >= 5}
                        >
                          <Text style={styles.suggestionTagText}>{language}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Estilo de Vida */}
                {renderAccordionSection(
                  'Estilo de Vida',
                  <Dumbbell size={20} color={colors.cosmic.purple} />,
                  'lifestyle',
                  <View>
                    <Text style={styles.label}>Fumo</Text>
                    <View style={styles.optionsRow}>
                      {lifestyleOptions.smoking.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            smoking === option.id && styles.optionButtonActive,
                          ]}
                          onPress={() => setSmoking(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              smoking === option.id && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Álcool</Text>
                    <View style={styles.optionsRow}>
                      {lifestyleOptions.alcohol.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            alcohol === option.id && styles.optionButtonActive,
                          ]}
                          onPress={() => setAlcohol(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              alcohol === option.id && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.label}>Exercícios</Text>
                    <View style={styles.optionsRow}>
                      {lifestyleOptions.exercise.map((option) => (
                        <TouchableOpacity
                          key={option.id}
                          style={[
                            styles.optionButton,
                            exercise === option.id && styles.optionButtonActive,
                          ]}
                          onPress={() => setExercise(option.id)}
                        >
                          <Text
                            style={[
                              styles.optionText,
                              exercise === option.id && styles.optionTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.bottomSpacing} />
              </ScrollView>

              {/* Footer Buttons */}
              <View style={styles.footer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={saving}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullPressable: {
    flex: 1,
  },
  sheetPressable: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '85%',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sheetInnerContainer: {
    flex: 1,
    paddingBottom: 34,
  },
  sheetHeader: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    textAlign: 'center',
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  accordionSection: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 12,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.neutral[50],
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accordionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[900],
  },
  accordionContent: {
    padding: 16,
    backgroundColor: 'white',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.neutral[300],
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.neutral[900],
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[300],
    backgroundColor: 'white',
  },
  optionButtonActive: {
    backgroundColor: colors.cosmic.purple,
    borderColor: colors.cosmic.purple,
  },
  optionText: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  optionTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  sectionDescription: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  helperText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 8,
    fontStyle: 'italic',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  selectedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.cosmic.purple,
  },
  selectedTagText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  suggestionTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  suggestionTagText: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  bottomSpacing: {
    height: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  cancelButtonText: {
    color: colors.neutral[700],
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.cosmic.purple,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
