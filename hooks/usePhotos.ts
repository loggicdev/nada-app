import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

export function usePhotos(userId: string | undefined) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Carregar fotos do usuário
  const fetchPhotos = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_photos')
        .select('*')
        .eq('user_id', userId)
        .order('order_index', { ascending: true });

      if (error) throw error;

      setPhotos(data || []);
    } catch (error) {
      console.error('❌ Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  // Adicionar nova foto
  const addPhoto = useCallback(async () => {
    if (!userId) return;

    try {
      // Verificar limite de 6 fotos
      if (photos.length >= 6) {
        Alert.alert('Limite atingido', 'Você pode adicionar no máximo 6 fotos.');
        return;
      }

      // Solicitar permissão
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos de permissão para acessar suas fotos.'
        );
        return;
      }

      // Selecionar imagem
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);

      // Ler arquivo como ArrayBuffer
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();

      // Nome do arquivo
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${userId}/photo-${Date.now()}.${fileExt}`;

      // Upload para Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Salvar no banco
      const nextOrderIndex = photos.length;
      const { error: dbError } = await supabase
        .from('user_photos')
        .insert({
          user_id: userId,
          photo_url: urlData.publicUrl,
          order_index: nextOrderIndex,
        });

      if (dbError) throw dbError;

      // Recarregar fotos
      await fetchPhotos();

      console.log('✅ Foto adicionada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao adicionar foto:', error);
      Alert.alert('Erro', 'Não foi possível adicionar a foto.');
    } finally {
      setUploading(false);
    }
  }, [userId, photos.length, fetchPhotos]);

  // Deletar foto
  const deletePhoto = useCallback(async (photoId: string, photoUrl: string) => {
    if (!userId) return;

    try {
      setLoading(true);

      // Extrair nome do arquivo da URL
      const urlParts = photoUrl.split('/');
      const fileName = `${userId}/${urlParts[urlParts.length - 1]}`;

      // Deletar do Storage
      const { error: storageError } = await supabase.storage
        .from('avatars')
        .remove([fileName]);

      if (storageError) {
        console.warn('Aviso ao deletar do storage:', storageError);
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('user_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      // Reordenar fotos restantes
      const remainingPhotos = photos
        .filter(p => p.id !== photoId)
        .map((p, index) => ({ id: p.id, order_index: index }));

      if (remainingPhotos.length > 0) {
        for (const photo of remainingPhotos) {
          await supabase
            .from('user_photos')
            .update({ order_index: photo.order_index })
            .eq('id', photo.id);
        }
      }

      // Recarregar fotos
      await fetchPhotos();

      console.log('✅ Foto deletada com sucesso');
    } catch (error: any) {
      console.error('❌ Erro ao deletar foto:', error);
      Alert.alert('Erro', 'Não foi possível deletar a foto.');
    } finally {
      setLoading(false);
    }
  }, [userId, photos, fetchPhotos]);

  return {
    photos,
    loading,
    uploading,
    addPhoto,
    deletePhoto,
    refreshPhotos: fetchPhotos,
  };
}
