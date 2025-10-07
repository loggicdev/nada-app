import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react-native';
import colors from '@/constants/colors';
import { usePhotos } from '@/hooks/usePhotos';

// Habilitar LayoutAnimation no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PhotoGridProps {
  userId: string;
  avatarUrl?: string | null;
}

const { width: screenWidth } = Dimensions.get('window');
const GRID_PADDING = 40;
const GRID_GAP = 12;
const PHOTO_SIZE = (screenWidth - GRID_PADDING - GRID_GAP * 2) / 3;

export default function PhotoGrid({ userId, avatarUrl }: PhotoGridProps) {
  const { photos, uploading, addPhoto, deletePhoto } = usePhotos(userId);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState<{ id: string; url: string } | null>(null);

  // Animated values para o background e bottom sheet
  const deleteSheetOpacity = useRef(new Animated.Value(0)).current;
  const deleteSheetTranslateY = useRef(new Animated.Value(300)).current;

  // Slots: avatar + 5 fotos adicionais
  const allSlots = [
    { type: 'avatar' as const, url: avatarUrl },
    ...photos.slice(0, 5).map((p, i) => ({ type: 'photo' as const, url: p.photo_url, id: p.id, index: i })),
  ];

  // Preencher slots vazios até 6
  while (allSlots.length < 6) {
    allSlots.push({ type: 'empty' as const, url: null });
  }

  // Animar abertura do bottom sheet apenas quando abre
  useEffect(() => {
    if (showDeleteSheet) {
      // Garantir que começa em 300 antes de animar
      deleteSheetTranslateY.setValue(300);
      deleteSheetOpacity.setValue(0);

      Animated.parallel([
        Animated.timing(deleteSheetOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(deleteSheetTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showDeleteSheet]);

  const handleOpenDeleteSheet = (photoId: string, photoUrl: string) => {
    setPhotoToDelete({ id: photoId, url: photoUrl });
    setShowDeleteSheet(true);
  };

  const closeDeleteSheet = () => {
    // Animar saída
    Animated.parallel([
      Animated.timing(deleteSheetOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(deleteSheetTranslateY, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Após animação, fechar modal
      setShowDeleteSheet(false);
      setPhotoToDelete(null);
    });
  };

  const handleConfirmDelete = async () => {
    if (!photoToDelete) return;

    closeDeleteSheet();
    // Aguardar animação antes de deletar
    setTimeout(async () => {
      await deletePhoto(photoToDelete.id, photoToDelete.url);
    }, 300);
  };

  const handleCancelDelete = () => {
    closeDeleteSheet();
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.header}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Fotos do Perfil</Text>
            <Text style={styles.subtitle}>
              {photos.length + 1}/6 fotos
            </Text>
          </View>
          <View style={styles.headerRight}>
            {isExpanded ? (
              <ChevronUp size={24} color={colors.neutral[600]} />
            ) : (
              <ChevronDown size={24} color={colors.neutral[600]} />
            )}
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            <Text style={styles.hint}>
              Adicione mais fotos para receber mais matches
            </Text>
            <View style={styles.grid}>
          {allSlots.map((slot, index) => (
            <View key={index} style={styles.photoSlot}>
              {slot.type === 'avatar' && slot.url ? (
                // Avatar (não pode deletar, é gerenciado pelo AvatarUploader)
                <TouchableOpacity
                  style={styles.photoContainer}
                  onPress={() => setPreviewPhoto(slot.url!)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: slot.url }} style={styles.photo} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Principal</Text>
                  </View>
                </TouchableOpacity>
              ) : slot.type === 'photo' && slot.url ? (
                // Foto adicional (pode deletar)
                <TouchableOpacity
                  style={styles.photoContainer}
                  onPress={() => setPreviewPhoto(slot.url!)}
                  activeOpacity={0.8}
                >
                  <Image source={{ uri: slot.url }} style={styles.photo} />
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleOpenDeleteSheet(slot.id!, slot.url!)}
                  >
                    <X size={16} color="white" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ) : (
                // Slot vazio
                <TouchableOpacity
                  style={styles.emptySlot}
                  onPress={addPhoto}
                  disabled={uploading}
                  activeOpacity={0.7}
                >
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.cosmic.purple} />
                  ) : (
                    <>
                      <Plus size={32} color={colors.neutral[400]} />
                      <Text style={styles.emptyText}>Adicionar</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          ))}
            </View>
          </>
        )}
      </View>

      {/* Modal de Preview */}
      <Modal
        visible={previewPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewPhoto(null)}
      >
        <Pressable style={styles.previewModalOverlay} onPress={() => setPreviewPhoto(null)}>
          <View style={styles.previewContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPreviewPhoto(null)}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            {previewPhoto && (
              <Image
                source={{ uri: previewPhoto }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </Pressable>
      </Modal>

      {/* Bottom Sheet de Confirmação de Delete */}
      <Modal
        visible={showDeleteSheet}
        transparent
        animationType="none"
        onRequestClose={handleCancelDelete}
      >
        <View style={styles.sheetModalContainer}>
          {/* Background com fade */}
          <Animated.View style={[styles.sheetModalOverlay, { opacity: deleteSheetOpacity }]}>
            <Pressable style={styles.fullPressable} onPress={handleCancelDelete} />
          </Animated.View>

          {/* Bottom Sheet com slide */}
          <Pressable style={styles.sheetModalOverlayPressable} onPress={handleCancelDelete}>
            <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: deleteSheetTranslateY }] }]}>
              <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.sheetHandle} />

              <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>Deletar foto</Text>
                <Text style={styles.sheetMessage}>
                  Tem certeza que deseja remover esta foto do seu perfil?
                </Text>

                <View style={styles.sheetButtons}>
                  <TouchableOpacity
                    style={styles.sheetButtonCancel}
                    onPress={handleCancelDelete}
                  >
                    <Text style={styles.sheetButtonCancelText}>Cancelar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sheetButtonConfirm}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={styles.sheetButtonConfirmText}>Deletar</Text>
                  </TouchableOpacity>
                </View>
              </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.neutral[800],
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  hint: {
    fontSize: 13,
    color: colors.neutral[500],
    marginBottom: 16,
    fontStyle: 'italic',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  photoSlot: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.3, // Proporção 3:4
  },
  photoContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: colors.cosmic.purple,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySlot: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral[50],
  },
  emptyText: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  // Modal de Preview
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal do Bottom Sheet
  sheetModalContainer: {
    flex: 1,
  },
  sheetModalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  fullPressable: {
    flex: 1,
  },
  sheetModalOverlayPressable: {
    flex: 1,
    justifyContent: 'flex-end',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  previewContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '90%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // Bottom Sheet
  bottomSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral[300],
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  sheetContent: {
    padding: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 12,
    textAlign: 'center',
  },
  sheetMessage: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  sheetButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetButtonCancel: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: 'center',
  },
  sheetButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[700],
  },
  sheetButtonConfirm: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.cosmic.rose,
    alignItems: 'center',
  },
  sheetButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
