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
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as SystemUI from 'expo-system-ui';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, Send, Image as ImageIcon, MoreVertical } from 'lucide-react-native';
import colors from '@/constants/colors';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';
import ImageViewer from '@/components/ImageViewer';
import { ChatScreenSkeleton } from '@/components/SkeletonLoaders';

type Message = Database['public']['Tables']['messages']['Row'];

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onImagePress: (imageUri: string) => void;
}

function MessageBubble({ message, isOwn, onImagePress }: MessageBubbleProps) {
  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <View style={[
        styles.messageBubble, 
        isOwn ? styles.ownBubble : styles.otherBubble,
        message.message_type === 'image' && styles.imageBubble
      ]}>
        {message.message_type === 'image' ? (
          <TouchableOpacity 
            onPress={() => onImagePress(message.content)}
          >
            <Image 
              source={{ uri: message.content }} 
              style={styles.messageImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ) : (
          <Text style={[styles.messageText, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
        )}
      </View>

      <Text style={[styles.messageTime, isOwn ? styles.ownTime : styles.otherTime]}>
        {formatTime(message.sent_at)}
      </Text>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuthContext();

  // Hook de mensagens em tempo real
  const { messages, loading, sendMessage: sendRealtimeMessage, markAsRead } = useRealtimeMessages(id);

  const [inputText, setInputText] = useState<string>('');
  const [imageError, setImageError] = useState<boolean>(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [isImageViewerVisible, setIsImageViewerVisible] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      try {
        SystemUI.setBackgroundColorAsync('#ffffff');
      } catch (error) {
        console.log('SystemUI not available:', error);
      }
    }
  }, []);

  // Carregar informações da conversa e do outro usuário
  useEffect(() => {
    const loadConversationData = async () => {
      if (!id) {
        setIsLoadingUser(false);
        return;
      }

      try {
        // Buscar conversa
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .select(`
            *,
            match:matches (
              *
            )
          `)
          .eq('id', id)
          .single();

        if (convError || !conversation) {
          console.error('Erro ao carregar conversa:', convError);
          setIsLoadingUser(false);
          return;
        }

        const match = (conversation as any).match;
        if (!match) {
          setIsLoadingUser(false);
          return;
        }

        // Identificar o outro usuário
        const otherUserId =
          match.user1_id === currentUser?.id ? match.user2_id : match.user1_id;

        // Buscar perfil do outro usuário
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', otherUserId)
          .single();

        if (profileError || !profile) {
          console.error('Erro ao carregar perfil:', profileError);
          setIsLoadingUser(false);
          return;
        }

        // Buscar fotos do usuário
        const { data: photos } = await supabase
          .from('user_photos')
          .select('photo_url')
          .eq('user_id', otherUserId)
          .order('order_index', { ascending: true });

        const userPhotos = photos?.map((p) => p.photo_url) || [];
        if (profile.avatar_url && !userPhotos.includes(profile.avatar_url)) {
          userPhotos.unshift(profile.avatar_url);
        }

        setOtherUser({
          ...profile,
          photos: userPhotos,
        });
      } catch (error) {
        console.error('Erro ao carregar dados da conversa:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    loadConversationData();
  }, [id, currentUser?.id]);

  // Marcar mensagens como lidas
  useEffect(() => {
    if (!messages.length || !currentUser?.id) return;

    const unreadMessages = messages.filter(
      (msg) => msg.sender_id !== currentUser.id && !msg.read_at
    );

    unreadMessages.forEach((msg) => {
      markAsRead(msg.id);
    });
  }, [messages, currentUser?.id, markAsRead]);

  // Scroll para o final quando novas mensagens chegarem
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  // Função para fazer upload da imagem para o Supabase Storage
  const uploadImageToSupabase = async (uri: string, fileName: string): Promise<string | null> => {
    try {
      // Criar caminho único para o arquivo
      const fileExt = fileName.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${currentUser?.id}/${Date.now()}.${fileExt}`;
      
      // Ler o arquivo como ArrayBuffer usando fetch
      const response = await fetch(uri);
      const blob = await response.arrayBuffer();
      
      // Fazer upload usando ArrayBuffer
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        throw error;
      }

      // Obter URL pública da imagem
      const { data: publicUrl } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filePath);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw error;
    }
  };

  // Função para selecionar e enviar imagem
  const handleImagePicker = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Abrir seletor de imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7, // Reduzir qualidade para melhor performance
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        setIsUploadingImage(true);
        
        try {
          // Fazer upload da imagem
          const imageUrl = await uploadImageToSupabase(
            asset.uri, 
            asset.fileName || `image_${Date.now()}.jpg`
          );

          if (imageUrl) {
            // Enviar mensagem com a imagem
            await sendRealtimeMessage(imageUrl, 'image');
            
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 150);
          }
        } catch (uploadError) {
          console.error('Erro no upload:', uploadError);
          Alert.alert('Erro', 'Não foi possível enviar a imagem. Verifique sua conexão e tente novamente.');
        } finally {
          setIsUploadingImage(false);
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Ocorreu um erro ao selecionar a imagem.');
      setIsUploadingImage(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !id) return;

    const content = inputText.trim();
    setInputText('');

    await sendRealtimeMessage(content, 'text');

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Funções para controle do visualizador de imagens
  const handleImagePress = (imageUri: string) => {
    setSelectedImageUri(imageUri);
    setIsImageViewerVisible(true);
  };

  const handleCloseImageViewer = () => {
    setIsImageViewerVisible(false);
    setSelectedImageUri(null);
  };

  // Função para navegar para o perfil do usuário
  const handleProfilePress = () => {
    if (otherUser?.id) {
      router.push(`/profile/${otherUser.id}`);
    }
  };

  if (isLoadingUser || loading) {
    return <ChatScreenSkeleton />;
  }

  if (!otherUser) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 16, color: colors.neutral[700] }}>Conversa não encontrada</Text>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/messages')}
          style={{ marginTop: 16, padding: 12, backgroundColor: colors.cosmic.purple, borderRadius: 8 }}
        >
          <Text style={{ color: 'white' }}>Voltar</Text>
        </TouchableOpacity>
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
          <Text style={styles.avatarPlaceholderText}>
            {otherUser.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.push('/(tabs)/messages')}>
          <ArrowLeft size={24} color={colors.neutral[800]} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.headerInfo} onPress={handleProfilePress}>
          {renderUserImage()}
          <View style={styles.headerText}>
            <Text style={styles.headerName}>
              {otherUser.name}, {otherUser.age}
            </Text>
            <Text style={styles.headerStatus}>Online agora</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.moreButton}>
          <MoreVertical size={20} color={colors.neutral[600]} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      {loading ? (
        <ChatScreenSkeleton />
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Vocês deram match! 🎉</Text>
              <Text style={styles.emptySubtitle}>
                Que tal começar uma conversa? Pergunte sobre os interesses em comum!
              </Text>
            </View>
          ) : (
            messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isOwn={message.sender_id === currentUser?.id}
                onImagePress={handleImagePress}
              />
            ))
          )}
        </ScrollView>
      )}

      {/* Input */}
      <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.imageButton} 
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size={20} color={colors.cosmic.purple} />
            ) : (
              <ImageIcon size={20} color={colors.cosmic.purple} />
            )}
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
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : {}]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Send size={18} color={inputText.trim() ? 'white' : colors.neutral[400]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Visualizador de imagens */}
      <ImageViewer
        visible={isImageViewerVisible}
        imageUri={selectedImageUri}
        onClose={handleCloseImageViewer}
      />
    </KeyboardAvoidingView>
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
    color: colors.neutral[500],
    marginTop: 2,
  },
  avatarPlaceholder: {
    backgroundColor: colors.cosmic.purple + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.cosmic.purple,
  },
  moreButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
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
    borderRadius: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  ownBubble: {
    backgroundColor: colors.cosmic.purple,
    borderBottomRightRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  otherBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  imageBubble: {
    padding: 0,
    backgroundColor: 'transparent',
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
  inputContainer: {
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
