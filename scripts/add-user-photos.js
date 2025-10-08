const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addUserPhotos() {
  try {
    // 1. Listar todas as fotos disponíveis no storage
    const { data: storageFiles, error: storageError } = await supabase.storage
      .from('avatars')
      .list('', { limit: 100 });

    if (storageError) {
      console.error('❌ Erro ao listar fotos:', storageError);
      return;
    }

    console.log(`✅ Encontradas ${storageFiles.length} fotos no storage`);

    // Filtrar apenas arquivos de imagem
    const imageFiles = storageFiles.filter(file =>
      file.name.endsWith('.jpg') ||
      file.name.endsWith('.jpeg') ||
      file.name.endsWith('.png')
    );

    console.log(`✅ ${imageFiles.length} arquivos de imagem válidos`);

    // 2. Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, name, avatar_url');

    if (usersError) {
      console.error('❌ Erro ao buscar usuários:', usersError);
      return;
    }

    console.log(`✅ Encontrados ${users.length} usuários`);

    // 3. Para cada usuário, adicionar 3-5 fotos aleatórias
    for (const user of users) {
      // Pular se não tiver avatar_url
      if (!user.avatar_url) {
        console.log(`⏭️  Pulando ${user.name} (sem avatar)`);
        continue;
      }

      // Verificar quantas fotos já tem
      const { data: existingPhotos } = await supabase
        .from('user_photos')
        .select('id, order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false });

      const currentCount = existingPhotos?.length || 0;
      const nextOrderIndex = existingPhotos && existingPhotos.length > 0
        ? existingPhotos[0].order_index + 1
        : 0;

      // Já tem 4+ fotos? Pular
      if (currentCount >= 4) {
        console.log(`⏭️  ${user.name} já tem ${currentCount} foto(s)`);
        continue;
      }

      // Adicionar mais fotos até ter 4-5 no total
      const targetCount = Math.floor(Math.random() * 2) + 4; // 4 ou 5 fotos no total
      const photosToAdd = targetCount - currentCount;
      const selectedPhotos = [];

      // Embaralhar fotos disponíveis
      const shuffledFiles = [...imageFiles].sort(() => Math.random() - 0.5);

      let orderIndex = nextOrderIndex;
      for (let i = 0; i < Math.min(photosToAdd, shuffledFiles.length); i++) {
        const file = shuffledFiles[i];
        const photoUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${file.name}`;

        // Não adicionar a foto do avatar novamente
        if (photoUrl === user.avatar_url) continue;

        selectedPhotos.push({
          user_id: user.id,
          photo_url: photoUrl,
          order_index: orderIndex++
        });
      }

      if (selectedPhotos.length === 0) {
        console.log(`⏭️  Nenhuma foto adicional para ${user.name}`);
        continue;
      }

      // Inserir fotos
      const { error: insertError } = await supabase
        .from('user_photos')
        .insert(selectedPhotos);

      if (insertError) {
        console.error(`❌ Erro ao inserir fotos para ${user.name}:`, insertError);
      } else {
        console.log(`✅ Adicionadas ${selectedPhotos.length} fotos para ${user.name}`);
      }
    }

    console.log('\n🎉 Processo concluído!');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addUserPhotos();
