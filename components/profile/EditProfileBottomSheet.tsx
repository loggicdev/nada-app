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
import { X, ChevronDown, ChevronUp, User, Heart, Target, Dumbbell, Star, MapPin } from 'lucide-react-native';
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

const SUGGESTED_GOALS = [
  'Namoro sério',
  'Relacionamento casual',
  'Novas amizades',
  'Networking',
  'Crescimento pessoal',
  'Aventuras',
  'Encontros casuais',
  'Conexões profundas',
];

export default function EditProfileBottomSheet({ visible, onClose }: EditProfileBottomSheetProps) {
  const { profile, user } = useAuthContext();
  const [saving, setSaving] = useState(false);

  // Animated values
  const backgroundOpacity = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(600)).current;

  // Accordion states
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

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

      // Load goals
      const { data: goalsData } = await supabase
        .from('user_goals')
        .select('goal')
        .eq('user_id', user.id);

      if (goalsData) {
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

  const handleGoalToggle = (goal: string) => {
    if (goals.includes(goal)) {
      setGoals(prev => prev.filter(item => item !== goal));
    } else if (goals.length < 5) {
      setGoals(prev => [...prev, goal]);
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      // Convert date back to ISO format if needed
      let isoDate = birthDate;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(birthDate)) {
        const [day, month, year] = birthDate.split('/');
        isoDate = `${year}-${month}-${day}`;
      }

      // Update user_profiles
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
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
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update interests - delete old ones and insert new ones
      await supabase.from('user_interests').delete().eq('user_id', user.id);

      if (interests.length > 0) {
        const interestsData = interests.map(interest => ({
          user_id: user.id,
          interest,
        }));
        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(interestsData);

        if (interestsError) throw interestsError;
      }

      // Update goals - delete old ones and insert new ones
      await supabase.from('user_goals').delete().eq('user_id', user.id);

      if (goals.length > 0) {
        const goalsData = goals.map(goal => ({
          user_id: user.id,
          goal,
        }));
        const { error: goalsError } = await supabase
          .from('user_goals')
          .insert(goalsData);

        if (goalsError) throw goalsError;
      }

      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      handleClose();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Erro', error.message || 'Não foi possível atualizar o perfil.');
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
                      Selecionados ({goals.length}/5)
                    </Text>
                    <View style={styles.tagsContainer}>
                      {goals.length > 0 ? (
                        goals.map((goal) => (
                          <TouchableOpacity
                            key={goal}
                            style={styles.selectedTag}
                            onPress={() => handleGoalToggle(goal)}
                          >
                            <Text style={styles.selectedTagText}>{goal}</Text>
                            <X size={14} color="white" />
                          </TouchableOpacity>
                        ))
                      ) : (
                        <Text style={styles.helperText}>Nenhum objetivo selecionado</Text>
                      )}
                    </View>

                    <Text style={[styles.label, { marginTop: 16 }]}>Sugestões</Text>
                    <View style={styles.tagsContainer}>
                      {SUGGESTED_GOALS.filter(g => !goals.includes(g)).map((goal) => (
                        <TouchableOpacity
                          key={goal}
                          style={styles.suggestionTag}
                          onPress={() => handleGoalToggle(goal)}
                          disabled={goals.length >= 5}
                        >
                          <Text style={styles.suggestionTagText}>{goal}</Text>
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
