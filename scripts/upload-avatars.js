const { createClient } = require('@supabase/supabase-js');
const fs = require('fs-extra');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas. Verifique .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createStorageBucket(bucketName = 'avatars') {
  try {
    console.log(`📦 Criando/verificando bucket: ${bucketName}`);

    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      throw error;
    }

    console.log(`✅ Bucket ${bucketName} pronto!`);
    return bucketName;
  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error.message);
    throw error;
  }
}

async function uploadImageToStorage(bucketName, filePath, fileName) {
  try {
    console.log(`⬆️ Fazendo upload: ${fileName}`);

    const fileBuffer = await fs.readFile(filePath);

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Gerar URL pública
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    console.log(`✅ Upload concluído: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`❌ Erro no upload de ${fileName}:`, error.message);
    throw error;
  }
}

async function uploadAllImages(bucketName = 'avatars') {
  const imagesDir = path.join(__dirname, '..', 'scripts', 'downloaded_images');

  if (!await fs.pathExists(imagesDir)) {
    console.error(`❌ Diretório de imagens não encontrado: ${imagesDir}`);
    console.log('📝 Execute primeiro: node scripts/download-freepik-images.js');
    return [];
  }

  const files = await fs.readdir(imagesDir);
  const imageFiles = files.filter(file =>
    file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')
  );

  console.log(`📸 Encontradas ${imageFiles.length} imagens para upload`);

  const uploadedImages = [];

  for (let i = 0; i < imageFiles.length; i++) {
    const fileName = imageFiles[i];
    const filePath = path.join(imagesDir, fileName);

    try {
      const publicUrl = await uploadImageToStorage(bucketName, filePath, fileName);
      uploadedImages.push({
        filename: fileName,
        storage_url: publicUrl,
        local_path: filePath
      });

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`⚠️ Pulando ${fileName} devido a erro`);
    }
  }

  console.log(`\n✅ Upload concluído! ${uploadedImages.length} imagens enviadas`);

  // Salvar URLs em arquivo
  const urlsPath = path.join(imagesDir, 'uploaded_urls.json');
  await fs.writeJson(urlsPath, {
    total: uploadedImages.length,
    images: uploadedImages,
    bucket: bucketName,
    uploaded_at: new Date().toISOString()
  });

  console.log(`📄 URLs salvas em: ${urlsPath}`);

  return uploadedImages;
}

async function updateUserProfilesWithAvatars() {
  const urlsPath = path.join(__dirname, '..', 'scripts', 'downloaded_images', 'uploaded_urls.json');

  if (!await fs.pathExists(urlsPath)) {
    console.error('❌ Arquivo de URLs não encontrado. Execute o upload primeiro.');
    return;
  }

  const urlsData = await fs.readJson(urlsPath);
  const { images } = urlsData;

  console.log(`👥 Atualizando ${images.length} perfis de usuário com avatares...`);

  // Buscar usuários que precisam de avatar
  const { data: users, error: fetchError } = await supabase
    .from('user_profiles')
    .select('id, name')
    .is('avatar_url', null)
    .limit(images.length);

  if (fetchError) {
    console.error('❌ Erro ao buscar usuários:', fetchError.message);
    return;
  }

  if (!users || users.length === 0) {
    console.log('ℹ️ Nenhum usuário precisa de avatar');
    return;
  }

  console.log(`📊 Encontrados ${users.length} usuários sem avatar`);

  let updatedCount = 0;

  for (let i = 0; i < Math.min(users.length, images.length); i++) {
    const user = users[i];
    const image = images[i];

    try {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: image.storage_url })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar ${user.name}:`, updateError.message);
      } else {
        console.log(`✅ ${user.name}: ${image.filename}`);
        updatedCount++;
      }

    } catch (error) {
      console.error(`❌ Erro ao atualizar ${user.name}:`, error.message);
    }
  }

  console.log(`\n🎉 Atualização concluída! ${updatedCount} perfis atualizados`);
}

// Executar se chamado diretamente
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'create-bucket':
      createStorageBucket()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'upload':
      uploadAllImages()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'update-profiles':
      updateUserProfilesWithAvatars()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;

    case 'all':
      console.log('🚀 Executando processo completo...');
      createStorageBucket()
        .then(bucket => uploadAllImages(bucket))
        .then(() => updateUserProfilesWithAvatars())
        .then(() => {
          console.log('\n🎉 Processo completo!');
          process.exit(0);
        })
        .catch(error => {
          console.error('\n❌ Erro no processo:', error);
          process.exit(1);
        });
      break;

    default:
      console.log('📖 Uso:');
      console.log('  node scripts/upload-avatars.js create-bucket    # Criar bucket');
      console.log('  node scripts/upload-avatars.js upload          # Fazer upload das imagens');
      console.log('  node scripts/upload-avatars.js update-profiles # Atualizar perfis');
      console.log('  node scripts/upload-avatars.js all             # Executar tudo');
      process.exit(1);
  }
}

module.exports = {
  createStorageBucket,
  uploadImageToStorage,
  uploadAllImages,
  updateUserProfilesWithAvatars
};