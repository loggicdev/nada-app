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
  Platform
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
  ArrowLeft
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
import { mockUsers } from '@/mocks/users';
import { MatchCandidate } from '@/types/user';

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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { likeUser, dislikeUser } = useMatch();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  useEffect(() => {
    if (Platform.OS !== 'web') {
      SystemUI.setBackgroundColorAsync('#ffffff');
    }
  }, []);
  
  // Find user by ID
  const user = mockUsers.find(u => u.id === id) as MatchCandidate;
  
  if (!user) {
    return (
      <View style={styles.container}>
        <Text>Usuário não encontrado</Text>
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

  // Mock additional data for expanded profile - using same user's photos to avoid showing different people
  const additionalPhotos = [
    user.photos[0],
    user.photos[0], // Same photo to avoid confusion
    user.photos[0], // Same photo to avoid confusion  
    user.photos[0]  // Same photo to avoid confusion
  ];

  const values = ['Honestidade', 'Crescimento pessoal', 'Família', 'Aventura', 'Espiritualidade'];
  const loveLanguages = ['Palavras de afirmação', 'Tempo de qualidade'];
  const culturalInfo = {
    education: 'Psicologia - USP',
    profession: 'Psicóloga Clínica',
    languages: ['Português', 'Inglês', 'Espanhol'],
    lifestyle: 'Vida saudável e equilibrada'
  };

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
        <PhotoCarousel photos={additionalPhotos} />
        
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
          <InfoSection title="Interesses">
            <View style={styles.interestsGrid}>
              {user.interests.map((interest, index) => (
                <InterestTag 
                  key={index} 
                  interest={interest} 
                  icon={getInterestIcon(interest)}
                />
              ))}
            </View>
          </InfoSection>

          {/* Values */}
          <InfoSection title="Valores">
            <View style={styles.valuesList}>
              {values.map((value, index) => (
                <View key={index} style={styles.valueItem}>
                  <View style={styles.valueDot} />
                  <Text style={styles.valueText}>{value}</Text>
                </View>
              ))}
            </View>
          </InfoSection>

          {/* Love Languages */}
          <InfoSection title="Linguagem do Amor">
            <View style={styles.loveLanguagesList}>
              {loveLanguages.map((language, index) => (
                <View key={index} style={styles.loveLanguageItem}>
                  <Heart size={16} color={colors.semantic.success} fill={colors.semantic.success} />
                  <Text style={styles.loveLanguageText}>{language}</Text>
                </View>
              ))}
            </View>
          </InfoSection>

          {/* Cultural Info */}
          <InfoSection title="Informações">
            <View style={styles.culturalInfo}>
              <View style={styles.culturalItem}>
                <GraduationCap size={20} color={colors.cosmic.purple} />
                <View style={styles.culturalTextContainer}>
                  <Text style={styles.culturalLabel}>Formação</Text>
                  <Text style={styles.culturalValue}>{culturalInfo.education}</Text>
                </View>
              </View>
              
              <View style={styles.culturalItem}>
                <Briefcase size={20} color={colors.cosmic.purple} />
                <View style={styles.culturalTextContainer}>
                  <Text style={styles.culturalLabel}>Profissão</Text>
                  <Text style={styles.culturalValue}>{culturalInfo.profession}</Text>
                </View>
              </View>
              
              <View style={styles.culturalItem}>
                <Calendar size={20} color={colors.cosmic.purple} />
                <View style={styles.culturalTextContainer}>
                  <Text style={styles.culturalLabel}>Estilo de vida</Text>
                  <Text style={styles.culturalValue}>{culturalInfo.lifestyle}</Text>
                </View>
              </View>
            </View>
          </InfoSection>

          {/* Bottom spacing for action buttons */}
          <View style={{ height: 140 }} />
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={[styles.actionButtons, { paddingBottom: Math.max(insets.bottom + 10, 30) }]}>
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
  buttonDisabled: {
    opacity: 0.6,
  },
});