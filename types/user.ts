export interface User {
  id: string;
  name: string;
  age: number;
  photos: string[];
  bio: string;
  location: string;
  zodiacSign: string;
  personalityType: string;
  intentions: string[];
  interests: string[];
  compatibilityScore?: number;
  lastActive: string;
}

export interface CosmicProfile {
  zodiacSign: string;
  moonSign: string;
  risingSign: string;
  personalityType: string;
  coreValues: string[];
  communicationStyle: string;
  loveLanguage: string;
}

export interface Match {
  id: string;
  user: User;
  compatibilityScore: number;
  sharedValues: string[];
  cosmicInsights: string[];
  matchedAt: string;
}

export type UserMode = 'paquera' | 'casal' | 'casamento' | 'vida';

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  type: 'text' | 'image';
  timestamp: string;
  read: boolean;
  reactions?: MessageReaction[];
}

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export interface MatchCandidate extends User {
  distance?: number;
  isLiked?: boolean;
  isDisliked?: boolean;
}

export interface MatchResult {
  isMatch: boolean;
  user: User;
  conversationId?: string;
}