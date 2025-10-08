import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
  Animated
} from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import {
  Heart,
  X,
  MapPin,
  Calendar,
  Briefcase,
  GraduationCap,
  Music,
  Camera,
  Book,
  Coffee,
  Star,
  ArrowLeft,
  MessageCircle
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { MatchCandidate } from '@/types/user';
import { supabase } from '@/lib/supabase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface PhotoCarouselProps {
  photos: string[];
}

function PhotoCarousel({ photos }: PhotoCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffset / screenWidth);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.photoCarousel}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {photos.map((photo, index) => (
          <Image
            key={index}
            source={{ uri: photo }}
            style={styles.carouselImage}
            resizeMode="cover"
          />
        ))}
      </ScrollView>
      
      {/* Photo indicators */}
      <View style={styles.photoIndicators}>
        {photos.map((_, index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              { opacity: index === currentIndex ? 1 : 0.3 }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

interface InfoSectionProps {
  title: string;
  children: React.ReactNode;
}

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <View style={styles.infoSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

interface InterestTagProps {
  interest: string;
  icon?: React.ReactNode;
}

function InterestTag({ interest, icon }: InterestTagProps) {
  return (
    <View style={styles.interestTag}>
      {icon && <View style={styles.interestIcon}><Text>{icon}</Text></View>}
      <Text style={styles.interestText}>{interest}</Text>
    </View>
  );
}

function SkeletonLoader() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    pulseAnimation.start();
    return () => pulseAnimation.stop();
  }, []);

  const animatedOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      
      {/* Skeleton Photo Carousel */}
      <Animated.View style={[styles.skeletonPhotoCarousel, { opacity: animatedOpacity }]} />
      
      {/* Skeleton Content */}
      <View style={styles.content}>
        {/* Skeleton Basic Info */}
        <View style={styles.basicInfo}>
          <View style={styles.nameRow}>
            <Animated.View style={[styles.skeletonBox, { width: 200, height: 32, opacity: animatedOpacity }]} />
            <Animated.View style={[styles.skeletonBox, { width: 60, height: 28, borderRadius: 14, opacity: animatedOpacity }]} />
          </View>
          <Animated.View style={[styles.skeletonBox, { width: 160, height: 20, marginBottom: 8, opacity: animatedOpacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: 140, height: 20, opacity: animatedOpacity }]} />
        </View>

        {/* Skeleton Bio Section */}
        <View style={styles.infoSection}>
          <Animated.View style={[styles.skeletonBox, { width: 120, height: 24, marginBottom: 16, opacity: animatedOpacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: '100%', height: 20, marginBottom: 8, opacity: animatedOpacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: '80%', height: 20, marginBottom: 8, opacity: animatedOpacity }]} />
          <Animated.View style={[styles.skeletonBox, { width: '60%', height: 20, opacity: animatedOpacity }]} />
        </View>

        {/* Skeleton Interests */}
        <View style={styles.infoSection}>
          <Animated.View style={[styles.skeletonBox, { width: 100, height: 24, marginBottom: 16, opacity: animatedOpacity }]} />
          <View style={styles.skeletonInterests}>
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <Animated.View key={item} style={[styles.skeletonBox, { width: 80, height: 36, borderRadius: 18, opacity: animatedOpacity }]} />
            ))}
          </View>
        </View>

        {/* Skeleton Values */}
        <View style={styles.infoSection}>
          <Animated.View style={[styles.skeletonBox, { width: 80, height: 24, marginBottom: 16, opacity: animatedOpacity }]} />
          <View style={styles.skeletonValuesList}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={styles.skeletonValueItem}>
                <Animated.View style={[styles.skeletonBox, { width: 8, height: 8, borderRadius: 4, opacity: animatedOpacity }]} />
                <Animated.View style={[styles.skeletonBox, { width: 120, height: 18, opacity: animatedOpacity }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 140 }} />
      </View>

      {/* Skeleton Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: 30 }]}>
        <Animated.View style={[styles.skeletonBox, { width: 60, height: 60, borderRadius: 30, opacity: animatedOpacity }]} />
        <Animated.View style={[styles.skeletonBox, { width: 60, height: 60, borderRadius: 30, opacity: animatedOpacity }]} />
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { likeUser, dislikeUser, loadConversations } = useMatch();
  const { user: currentUser } = useAuthContext();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(true);
  const [user, setUser] = useState<MatchCandidate | null>(null);
  const [userPhotos, setUserPhotos] = useState<string[]>([]);
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [coreValues, setCoreValues] = useState<string[]>([]);
  const [loveLanguages, setLoveLanguages] = useState<string[]>([]);
  const [education, setEducation] = useState<string | null>(null);
  const [profession, setProfession] = useState<string | null>(null);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  const [isMutualMatch, setIsMutualMatch] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);

  // Buscar dados do usuário do banco
  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) return;

      setIsFetching(true);
      try {
        // Buscar perfil
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', id)
          .single() as any;

        if (profileError || !profile) {
          console.error('Erro ao buscar perfil:', profileError);
          setIsFetching(false);
          return;
        }

        // Buscar fotos
        const { data: photos } = await supabase
          .from('user_photos')
          .select('photo_url, order_index')
          .eq('user_id', id)
          .order('order_index', { ascending: true });

        // Buscar interesses
        const { data: interests } = await supabase
          .from('user_interests')
          .select('interest')
          .eq('user_id', id);

        // Buscar objetivos
        const { data: goals } = await supabase
          .from('user_goals')
          .select('goal')
          .eq('user_id', id);

        // Montar array de fotos
        let allPhotos = photos?.map(p => p.photo_url) || [];

        // Adicionar avatar_url se existir e não estiver nas fotos
        if (profile.avatar_url && !allPhotos.includes(profile.avatar_url)) {
          allPhotos = [profile.avatar_url, ...allPhotos];
        }

        // Garantir que sempre há pelo menos uma foto
        if (allPhotos.length === 0 && profile.avatar_url) {
          allPhotos = [profile.avatar_url];
        }

        // Extrair cidade do birth_place
        const location = profile.birth_place
          ? profile.birth_place.split(',').slice(0, 2).join(',').trim()
          : 'Localização não informada';

        // Montar objeto de usuário
        const userData: MatchCandidate = {
          id: profile.id,
          name: profile.name || 'Usuário',
          age: profile.age || 0,
          photos: allPhotos,
          bio: profile.bio || 'Sem bio',
          location,
          zodiacSign: profile.zodiac_sign || 'Não informado',
          personalityType: profile.personality_type || 'Não informado',
          intentions: goals?.map(g => g.goal) || [],
          interests: interests?.map(i => i.interest) || [],
          compatibilityScore: 85, // Pode calcular depois
          lastActive: profile.updated_at || profile.created_at || new Date().toISOString(),
          distance: Math.round((Math.random() * 5 + 0.5) * 10) / 10,
        };

        setUser(userData);
        setUserPhotos(allPhotos);
        setUserInterests(interests?.map(i => i.interest) || []);
        setUserGoals(goals?.map(g => g.goal) || []);
        setCoreValues(profile.core_values || []);
        setLoveLanguages(profile.love_languages || []);
        setEducation(profile.education || null);
        setProfession(profile.profession || null);
        setLanguagesSpoken(profile.languages_spoken || []);

        // Definir que terminou o carregamento principal
        setIsFetching(false);

        // Verificar se é um match mútuo (em paralelo, sem bloquear UI)
        checkMutualMatch(profile.id);
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        setIsFetching(false);
      }
    };

    fetchUserData();
  }, [id]);

  // Função para verificar se é match mútuo
  const checkMutualMatch = async (profileId: string) => {
    if (!currentUser?.id) {
      console.log('❌ Usuário atual não encontrado');
      return;
    }
    
    try {
      console.log('🔍 Verificando match mútuo entre:', currentUser.id, 'e', profileId);
      
      // Primeira tentativa: buscar matches onde o usuário atual é user1_id
      const { data: match1, error: error1 } = await supabase
        .from('matches')
        .select('id, status, user1_id, user2_id')
        .eq('user1_id', currentUser.id)
        .eq('user2_id', profileId)
        .eq('status', 'mutual')
        .single();

      console.log('📊 Match 1 (currentUser->profile):', match1, error1);

      // Segunda tentativa: buscar matches onde o usuário atual é user2_id
      const { data: match2, error: error2 } = await supabase
        .from('matches')
        .select('id, status, user1_id, user2_id')
        .eq('user1_id', profileId)
        .eq('user2_id', currentUser.id)
        .eq('status', 'mutual')
        .single();

      console.log('📊 Match 2 (profile->currentUser):', match2, error2);

      const matchData = match1 || match2;

      if (matchData) {
        console.log('✅ Match mútuo encontrado:', matchData);
        setIsMutualMatch(true);
        
        // Buscar conversa correspondente
        const { data: conversationData, error: convError } = await supabase
          .from('conversations')
          .select('id')
          .eq('match_id', matchData.id)
          .single();

        console.log('💬 Conversa encontrada:', conversationData, convError);

        if (conversationData) {
          setConversationId(conversationData.id);
        }
      } else {
        console.log('❌ Nenhum match mútuo encontrado');
        setIsMutualMatch(false);
        setConversationId(null);
      }
    } catch (error) {
      console.log('ℹ️ Erro ao verificar match:', error);
      setIsMutualMatch(false);
      setConversationId(null);
    }
  };

  if (isFetching) {
    return <SkeletonLoader />;
  }

  if (!user) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Usuário não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleLike = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await likeUser(user.id);
      
      if (result.isMatch) {
        // Show match modal or navigate to chat
        router.push(`/chat/${result.conversationId}`);
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error liking user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePass = () => {
    dislikeUser(user.id);
    router.back();
  };

  const handleMessage = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      if (conversationId) {
        // Se já existe conversa, redireciona
        router.push(`/chat/${conversationId}`);
      } else {
        // Se não existe conversa, cria uma nova
        const { data: currentUser } = await supabase.auth.getUser();
        if (!currentUser.user) return;

        // Buscar o match correspondente
        const { data: matchData } = await supabase
          .from('matches')
          .select('id')
          .or(`and(user1_id.eq.${currentUser.user.id},user2_id.eq.${user.id}),and(user1_id.eq.${user.id},user2_id.eq.${currentUser.user.id})`)
          .eq('status', 'mutual')
          .single();

        if (matchData) {
          // Criar nova conversa
          const { data: newConversation, error } = await supabase
            .from('conversations')
            .insert({
              match_id: matchData.id,
              created_at: new Date().toISOString()
            })
            .select('id')
            .single();

          if (error) {
            console.error('Erro ao criar conversa:', error);
            return;
          }

          console.log('✅ Nova conversa criada:', newConversation.id);
          setConversationId(newConversation.id);
          
          // Recarregar conversas para incluir a nova
          console.log('🔄 Chamando loadConversations após criar conversa...');
          await loadConversations();
          console.log('✅ loadConversations executado');
          
          router.push(`/chat/${newConversation.id}`);
        }
      }
    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
    } finally {
      setIsLoading(false);
    }
  };



  const getInterestIcon = (interest: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Música': <Music size={16} color={colors.cosmic.purple} />,
      'Fotografia': <Camera size={16} color={colors.cosmic.purple} />,
      'Leitura': <Book size={16} color={colors.cosmic.purple} />,
      'Literatura': <Book size={16} color={colors.cosmic.purple} />,
      'Café': <Coffee size={16} color={colors.cosmic.purple} />,
      'Astrologia': <Star size={16} color={colors.cosmic.purple} />,
    };
    return iconMap[interest] || null;
  };

  // Usar as fotos do usuário carregadas do banco
  const displayPhotos = userPhotos.length > 0 ? userPhotos : user.photos;

  // Mapear love languages para português
  const loveLanguageLabels: { [key: string]: string } = {
    'words_of_affirmation': 'Palavras de afirmação',
    'quality_time': 'Tempo de qualidade',
    'acts_of_service': 'Atos de serviço',
    'physical_touch': 'Toque físico',
    'receiving_gifts': 'Receber presentes'
  };

  // Traduzir valores em inglês para português (se necessário)
  const valueLabels: { [key: string]: string } = {
    'Creativity': 'Criatividade',
    'Innovation': 'Inovação',
    'Freedom': 'Liberdade',
    'Empathy': 'Empatia',
    'Connection': 'Conexão',
    'Growth': 'Crescimento',
    'Adventure': 'Aventura',
    'Imagination': 'Imaginação',
    'Nature': 'Natureza',
    'Authenticity': 'Autenticidade',
    'Honesty': 'Honestidade',
    'Family': 'Família',
    'Spirituality': 'Espiritualidade'
  };

  // Valores traduzidos do banco ou fallback
  const displayValues = coreValues.length > 0
    ? coreValues.map(v => valueLabels[v] || v)
    : ['Honestidade', 'Crescimento pessoal', 'Família'];

  // Love languages traduzidas do banco ou fallback
  const displayLoveLanguages = loveLanguages.length > 0
    ? loveLanguages.map(l => loveLanguageLabels[l] || l)
    : ['Palavras de afirmação', 'Tempo de qualidade'];

  // Informações culturais do banco ou fallback
  const displayEducation = education || 'Não informado';
  const displayProfession = profession || 'Não informado';
  const displayLanguages = languagesSpoken.length > 0 ? languagesSpoken : ['Português'];

  // Lifestyle description (extrair do jsonb se existir)
  const lifestyleDescription = 'Vida saudável e equilibrada'; // Pode ser melhorado depois

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{
          title: "Perfil",
          headerShown: true,
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: colors.neutral[900],
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
          headerShadowVisible: true,
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.headerBackButton}
            >
              <ArrowLeft size={24} color={colors.neutral[900]} />
            </TouchableOpacity>
          ),
        }} 
      />
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Photo Carousel */}
        <PhotoCarousel photos={displayPhotos} />
        
        {/* Profile Content */}
        <View style={styles.content}>
          {/* Basic Info */}
          <View style={styles.basicInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{user.name}, {user.age}</Text>
              <View style={styles.compatibilityBadge}>
                <Text style={styles.compatibilityText}>{(user as MatchCandidate).compatibilityScore || 85}%</Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <MapPin size={16} color={colors.neutral[500]} />
              <Text style={styles.location}>{user.location}</Text>
              {(user as MatchCandidate).distance && (
                <Text style={styles.distance}>• {(user as MatchCandidate).distance}km</Text>
              )}
            </View>
            
            <Text style={styles.zodiacInfo}>{user.zodiacSign} • {user.personalityType}</Text>
          </View>

          {/* Bio */}
          <InfoSection title="Sobre mim">
            <Text style={styles.bioText}>{user.bio}</Text>
          </InfoSection>

          {/* Interests */}
          {userInterests.length > 0 && (
            <InfoSection title="Interesses">
              <View style={styles.interestsGrid}>
                {userInterests.map((interest, index) => (
                  <InterestTag
                    key={index}
                    interest={interest}
                    icon={getInterestIcon(interest)}
                  />
                ))}
              </View>
            </InfoSection>
          )}

          {/* Values */}
          {displayValues.length > 0 && (
            <InfoSection title="Valores">
              <View style={styles.valuesList}>
                {displayValues.map((value, index) => (
                  <View key={index} style={styles.valueItem}>
                    <View style={styles.valueDot} />
                    <Text style={styles.valueText}>{value}</Text>
                  </View>
                ))}
              </View>
            </InfoSection>
          )}

          {/* Love Languages */}
          {displayLoveLanguages.length > 0 && (
            <InfoSection title="Linguagem do Amor">
              <View style={styles.loveLanguagesList}>
                {displayLoveLanguages.map((language, index) => (
                  <View key={index} style={styles.loveLanguageItem}>
                    <Heart size={16} color={colors.semantic.success} fill={colors.semantic.success} />
                    <Text style={styles.loveLanguageText}>{language}</Text>
                  </View>
                ))}
              </View>
            </InfoSection>
          )}

          {/* Cultural Info */}
          <InfoSection title="Informações">
            <View style={styles.culturalInfo}>
              {education && (
                <View style={styles.culturalItem}>
                  <GraduationCap size={20} color={colors.cosmic.purple} />
                  <View style={styles.culturalTextContainer}>
                    <Text style={styles.culturalLabel}>Formação</Text>
                    <Text style={styles.culturalValue}>{displayEducation}</Text>
                  </View>
                </View>
              )}

              {profession && (
                <View style={styles.culturalItem}>
                  <Briefcase size={20} color={colors.cosmic.purple} />
                  <View style={styles.culturalTextContainer}>
                    <Text style={styles.culturalLabel}>Profissão</Text>
                    <Text style={styles.culturalValue}>{displayProfession}</Text>
                  </View>
                </View>
              )}

              <View style={styles.culturalItem}>
                <Calendar size={20} color={colors.cosmic.purple} />
                <View style={styles.culturalTextContainer}>
                  <Text style={styles.culturalLabel}>Estilo de vida</Text>
                  <Text style={styles.culturalValue}>{lifestyleDescription}</Text>
                </View>
              </View>

              {displayLanguages.length > 0 && (
                <View style={styles.culturalItem}>
                  <Book size={20} color={colors.cosmic.purple} />
                  <View style={styles.culturalTextContainer}>
                    <Text style={styles.culturalLabel}>Idiomas</Text>
                    <Text style={styles.culturalValue}>{displayLanguages.join(', ')}</Text>
                  </View>
                </View>
              )}
            </View>
          </InfoSection>

          {/* Bottom spacing for action buttons */}
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: Math.max(insets.bottom + 10, 30) }]}>
        {isMutualMatch ? (
          // Botão de mensagem para matches mútuos
          <TouchableOpacity 
            style={[styles.messageButton, isLoading && styles.buttonDisabled]}
            onPress={handleMessage}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <MessageCircle size={28} color={colors.cosmic.purple} />
          </TouchableOpacity>
        ) : (
          // Botões de like/pass para não matches
          <>
            <TouchableOpacity 
              style={styles.passButton}
              onPress={handlePass}
              activeOpacity={0.8}
            >
              <X size={28} color={colors.semantic.error} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.likeButton, isLoading && styles.buttonDisabled]}
              onPress={handleLike}
              activeOpacity={0.8}
              disabled={isLoading}
            >
              <Heart size={28} color={colors.semantic.success} fill={colors.semantic.success} />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },

  scrollView: {
    flex: 1,
  },
  photoCarousel: {
    height: screenHeight * 0.6,
    position: 'relative',
  },
  carouselImage: {
    width: screenWidth,
    height: '100%',
  },
  photoIndicators: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'white',
  },
  content: {
    backgroundColor: colors.neutral[50],
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: 24,
    paddingHorizontal: 20,
  },
  basicInfo: {
    marginBottom: 24,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  compatibilityBadge: {
    backgroundColor: colors.cosmic.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  compatibilityText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: colors.neutral[600],
    marginLeft: 6,
  },
  distance: {
    fontSize: 16,
    color: colors.neutral[600],
    marginLeft: 4,
  },
  zodiacInfo: {
    fontSize: 16,
    color: colors.cosmic.purple,
    fontWeight: '500',
  },
  infoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 16,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.neutral[700],
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  interestIcon: {
    marginRight: 8,
  },
  interestText: {
    fontSize: 14,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  valuesList: {
    gap: 12,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cosmic.purple,
    marginRight: 12,
  },
  valueText: {
    fontSize: 16,
    color: colors.neutral[700],
  },
  loveLanguagesList: {
    gap: 12,
  },
  loveLanguageItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loveLanguageText: {
    fontSize: 16,
    color: colors.neutral[700],
    marginLeft: 12,
  },
  culturalInfo: {
    gap: 20,
  },
  culturalItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  culturalTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  culturalLabel: {
    fontSize: 14,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  culturalValue: {
    fontSize: 16,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 40,
    backgroundColor: colors.neutral[50],
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  passButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.semantic.error,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  likeButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.semantic.success,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  messageButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.cosmic.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.neutral[600],
  },
  errorText: {
    fontSize: 18,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.cosmic.purple,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // Skeleton Loader Styles
  skeletonPhotoCarousel: {
    height: screenHeight * 0.6,
    backgroundColor: colors.neutral[200],
  },
  skeletonBox: {
    backgroundColor: colors.neutral[200],
    borderRadius: 8,
  },
  skeletonInterests: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skeletonValuesList: {
    gap: 12,
  },
  skeletonValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});