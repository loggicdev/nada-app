import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Keyboard
} from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { 
  ArrowLeft, 
  Send, 
  Image as ImageIcon, 
  Smile,
  User as UserIcon,
  MoreVertical
} from 'lucide-react-native';
import colors from '@/constants/colors';
import { useMatch } from '@/contexts/MatchContext';
import { mockUsers } from '@/mocks/users';
import { Message } from '@/types/user';

const REACTION_EMOJIS = ['❤️', '😍', '😂', '😮', '😢', '👍'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReaction: (messageId: string, emoji: string) => void;
}

function MessageBubble({ message, isOwn, onReaction }: MessageBubbleProps) {
  const [showReactions, setShowReactions] = useState<boolean>(false);

  const handleLongPress = () => {
    setShowReactions(true);
  };

  const handleReaction = (emoji: string) => {
    onReaction(message.id, emoji);
    setShowReactions(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <TouchableOpacity
        onLongPress={handleLongPress}
        style={[
          styles.messageBubble,
          isOwn ? styles.ownBubble : styles.otherBubble
        ]}
      >
        {message.type === 'image' ? (
          <Image source={{ uri: message.content }} style={styles.messageImage} />
        ) : (
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
        )}
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <View style={styles.reactionsContainer}>
            {message.reactions.map((reaction) => (
              <View key={reaction.id} style={styles.reactionBubble}>
                <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
              </View>
            ))}
          </View>
        )}
      </TouchableOpacity>
      
      <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
        {formatTime(message.timestamp)}
      </Text>

      {/* Reaction Picker */}
      {showReactions && (
        <View style={[styles.reactionPicker, isOwn ? styles.ownReactionPicker : styles.otherReactionPicker]}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.reactionOption}
              onPress={() => handleReaction(emoji)}
            >
              <Text style={styles.reactionOptionText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { conversations, messages, sendMessage, addReaction, markAsRead } = useMatch();
  const [inputText, setInputText] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const conversation = conversations.find(c => c.id === id);
  const conversationMessages = messages[id || ''] || [];
  
  const otherUserId = conversation?.participants.find(p => p !== 'current-user');
  const otherUser = mockUsers.find(u => u.id === otherUserId);

  useEffect(() => {
    // Configure SystemUI safely
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  useEffect(() => {
    if (id) {
      markAsRead(id);
    }
  }, [id, markAsRead]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive or keyboard changes
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [conversationMessages.length, keyboardHeight]);

  const handleSend = () => {
    if (inputText.trim() && id) {
      sendMessage(id, inputText.trim());
      setInputText('');
      // Scroll to bottom after sending message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Enviar Imagem',
      'Funcionalidade em desenvolvimento',
      [{ text: 'OK' }]
    );
  };

  const handleReaction = (messageId: string, emoji: string) => {
    addReaction(messageId, emoji);
  };

  if (!conversation || !otherUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text>Conversa não encontrada</Text>
      </View>
    );
  }

  const renderUserImage = () => {
    const hasPhoto = otherUser.photos && otherUser.photos.length > 0 && !imageError;
    
    if (hasPhoto) {
      return (
        <Image 
          source={{ uri: otherUser.photos[0] }} 
          style={styles.headerAvatar}
          onError={() => setImageError(true)}
        />
      );
    } else {
      return (
        <View style={[styles.headerAvatar, styles.avatarPlaceholder]}>
          <UserIcon size={20} color={colors.neutral[400]} />
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
          {renderUserImage()}
          <View style={styles.headerText}>
            <Text style={styles.headerName}>{otherUser.name}</Text>
            <Text style={styles.headerStatus}>Online agora</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={20} color={colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={[
          styles.messagesContainer,
          { marginBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 80 }
        ]}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 10
        }}
        onContentSizeChange={() => {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }}
        onLayout={() => {
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }, 50);
        }}
      >
        {conversationMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Vocês deram match! 🎉</Text>
            <Text style={styles.emptySubtitle}>
              Que tal começar uma conversa? Pergunte sobre os interesses em comum!
            </Text>
          </View>
        ) : (
          conversationMessages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.senderId === 'current-user'}
              onReaction={handleReaction}
            />
          ))
        )}
      </ScrollView>

      {/* Input */}
      <View style={[
        styles.inputContainer,
        { 
          paddingBottom: insets.bottom + 12,
          marginBottom: Platform.OS === 'android' ? keyboardHeight : 0
        }
      ]}>
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.imageButton}
            onPress={handleImagePicker}
          >
            <ImageIcon size={20} color={colors.cosmic.purple} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={colors.neutral[400]}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            returnKeyType="send"
            enablesReturnKeyAutomatically
          />
          
          <TouchableOpacity 
            style={styles.emojiButton}
            onPress={() => {}}
          >
            <Smile size={20} color={colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : {}]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={inputText.trim() ? 'white' : colors.neutral[400]} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },


  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[800],
  },
  headerStatus: {
    fontSize: 12,
    color: colors.semantic.success,
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    flexGrow: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 20,
  },
  messageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    position: 'relative',
  },
  ownBubble: {
    backgroundColor: colors.cosmic.purple,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  ownText: {
    color: 'white',
  },
  otherText: {
    color: colors.neutral[800],
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    marginHorizontal: 4,
  },
  ownTime: {
    color: colors.neutral[500],
    textAlign: 'right',
  },
  otherTime: {
    color: colors.neutral[500],
    textAlign: 'left',
  },
  reactionsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: -8,
    right: 8,
    gap: 2,
  },
  reactionBubble: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionPicker: {
    position: 'absolute',
    top: -50,
    backgroundColor: 'white',
    borderRadius: 25,
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  ownReactionPicker: {
    right: 0,
  },
  otherReactionPicker: {
    left: 0,
  },
  reactionOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reactionOptionText: {
    fontSize: 20,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  imageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 8 : 10,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 36,
    backgroundColor: colors.neutral[50],
    textAlignVertical: Platform.OS === 'ios' ? 'center' : 'top',
  },
  emojiButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.cosmic.purple,
  },
});