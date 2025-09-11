import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Star, MapPin, User as UserIcon } from 'lucide-react-native';
import colors from '@/constants/colors';
import { User } from '@/types/user';

interface CosmicCardProps {
  user: User;
  onLike?: () => void;
  onPass?: () => void;
  showCompatibility?: boolean;
}

export default function CosmicCard({ user, onLike, onPass, showCompatibility = true }: CosmicCardProps) {
  const [imageError, setImageError] = useState(false);
  const hasPhoto = user.photos && user.photos.length > 0 && user.photos[0] && !imageError;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {hasPhoto ? (
          <Image 
            source={{ uri: user.photos[0] }} 
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.placeholderContainer}>
            <UserIcon size={80} color={colors.neutral[400]} />
          </View>
        )}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradient}
        />
        
        {showCompatibility && user.compatibilityScore && (
          <View style={styles.compatibilityBadge}>
            <Star size={12} color={colors.cosmic.gold} fill={colors.cosmic.gold} />
            <Text style={styles.compatibilityText}>{user.compatibilityScore}% Compatível</Text>
          </View>
        )}
        
        <View style={styles.userInfo}>
          <Text style={styles.name}>{user.name}, {user.age}</Text>
          <View style={styles.locationRow}>
            <MapPin size={14} color={colors.neutral[300]} />
            <Text style={styles.location}>{user.location}</Text>
          </View>
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{user.zodiacSign}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{user.personalityType}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.bioContainer}>
        <Text style={styles.bio} numberOfLines={3}>{user.bio}</Text>
        
        <View style={styles.interestsContainer}>
          {user.interests.slice(0, 3).map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {(onLike || onPass) && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.passButton} onPress={onPass}>
            <Text style={styles.passText}>Passar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.likeButton} onPress={onLike}>
            <Heart size={20} color="white" fill="white" />
            <Text style={styles.likeText}>Conectar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  imageContainer: {
    position: 'relative',
    height: 400,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  compatibilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: colors.cosmic.deep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compatibilityText: {
    color: colors.cosmic.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  userInfo: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  name: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  location: {
    color: colors.neutral[300],
    fontSize: 14,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: colors.cosmic.purple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  bioContainer: {
    padding: 20,
  },
  bio: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.neutral[700],
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    color: colors.primary[700],
    fontSize: 12,
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  passButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    alignItems: 'center',
  },
  passText: {
    color: colors.neutral[600],
    fontSize: 16,
    fontWeight: '600',
  },
  likeButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 25,
    backgroundColor: colors.cosmic.purple,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  likeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});