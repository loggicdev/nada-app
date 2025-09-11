import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Match, MatchCandidate, MatchResult, Message, Conversation } from '@/types/user';
import { mockUsers, mockMatches, mockMessages, mockConversations } from '@/mocks/users';

interface MatchContextType {
  // Match candidates
  candidates: MatchCandidate[];
  currentCandidate: MatchCandidate | null;
  
  // Matches
  matches: Match[];
  
  // Conversations
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  
  // Actions
  likeUser: (userId: string) => Promise<MatchResult>;
  dislikeUser: (userId: string) => void;
  sendMessage: (conversationId: string, content: string, type?: 'text' | 'image') => void;
  addReaction: (messageId: string, emoji: string) => void;
  markAsRead: (conversationId: string) => void;
  getNextCandidate: () => void;
}

export const [MatchContext, useMatch] = createContextHook<MatchContextType>(() => {
  // Convert all users to match candidates for testing
  const allCandidates: MatchCandidate[] = mockUsers.map(user => ({
    ...user,
    distance: Math.round((Math.random() * 5 + 0.5) * 10) / 10, // Random distance 0.5-5.5km
    compatibilityScore: Math.floor(Math.random() * 15) + 85 // Random score 85-99%
  }));
  
  const [candidates, setCandidates] = useState<MatchCandidate[]>(allCandidates);
  const [matches, setMatches] = useState<Match[]>(mockMatches);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({
    'conv-1': mockMessages,
    'conv-2': []
  });

  // Filter out disliked candidates for display, but keep all in the array
  const availableCandidates = candidates.filter(c => !c.isDisliked);
  const currentCandidate = availableCandidates[0] || null;

  const likeUser = useCallback(async (userId: string): Promise<MatchResult> => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return { isMatch: false, user: user! };
    }

    // Simulate match probability (80% chance)
    const isMatch = Math.random() > 0.2;
    
    if (isMatch) {
      const newMatch: Match = {
        id: `match-${Date.now()}`,
        user,
        compatibilityScore: Math.floor(Math.random() * 20) + 80, // 80-99%
        sharedValues: ['Astrologia', 'Crescimento pessoal'],
        cosmicInsights: [
          'Vocês têm uma conexão cósmica especial',
          'Potencial para uma relação transformadora'
        ],
        matchedAt: new Date().toISOString()
      };

      const conversationId = `conv-${Date.now()}`;
      const newConversation: Conversation = {
        id: conversationId,
        participants: ['current-user', userId],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setMatches(prev => [newMatch, ...prev]);
      setConversations(prev => [newConversation, ...prev]);
      setMessages(prev => ({ ...prev, [conversationId]: [] }));

      return { isMatch: true, user, conversationId };
    }

    return { isMatch: false, user };
  }, []);

  const dislikeUser = useCallback((userId: string) => {
    setCandidates(prev => prev.map(c => 
      c.id === userId ? { ...c, isDisliked: true } : c
    ));
  }, []);

  const getNextCandidate = useCallback(() => {
    const availableCandidates = candidates.filter(c => !c.isDisliked);
    
    if (availableCandidates.length === 0) {
      // In a real app, you'd fetch more candidates
      // For demo, we'll reset to show candidates again
      setCandidates(allCandidates); // Reset candidates
    }
  }, [candidates, allCandidates]);

  const sendMessage = useCallback((conversationId: string, content: string, type: 'text' | 'image' = 'text') => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      senderId: 'current-user',
      receiverId: conversations.find(c => c.id === conversationId)?.participants.find(p => p !== 'current-user') || '',
      content,
      type,
      timestamp: new Date().toISOString(),
      read: false
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }));

    setConversations(prev => prev.map(conv => 
      conv.id === conversationId 
        ? { ...conv, lastMessage: newMessage, updatedAt: new Date().toISOString() }
        : conv
    ));
  }, [conversations]);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    setMessages(prev => {
      const newMessages = { ...prev };
      Object.keys(newMessages).forEach(convId => {
        newMessages[convId] = newMessages[convId].map(msg => {
          if (msg.id === messageId) {
            const reactions = msg.reactions || [];
            const existingReaction = reactions.find(r => r.userId === 'current-user');
            
            if (existingReaction) {
              return {
                ...msg,
                reactions: reactions.map(r => 
                  r.userId === 'current-user' ? { ...r, emoji } : r
                )
              };
            } else {
              return {
                ...msg,
                reactions: [...reactions, {
                  id: `reaction-${Date.now()}`,
                  userId: 'current-user',
                  emoji,
                  timestamp: new Date().toISOString()
                }]
              };
            }
          }
          return msg;
        });
      });
      return newMessages;
    });
  }, []);

  const markAsRead = useCallback((conversationId: string) => {
    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg => ({ ...msg, read: true }))
    }));
  }, []);

  return useMemo(() => ({
    candidates,
    currentCandidate,
    matches,
    conversations,
    messages,
    likeUser,
    dislikeUser,
    sendMessage,
    addReaction,
    markAsRead,
    getNextCandidate
  }), [
    candidates,
    currentCandidate,
    matches,
    conversations,
    messages,
    likeUser,
    dislikeUser,
    sendMessage,
    addReaction,
    markAsRead,
    getNextCandidate
  ]);
});