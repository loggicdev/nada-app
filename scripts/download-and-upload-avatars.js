const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Lista de imagens filtradas do Lorem Picsum (retratos)
const portraitImages = [
  { id: "5", author: "Alejandro Escamilla", width: 5000, height: 3334, download_url: "https://picsum.photos/id/5/5000/3334", avatar_url: "https://picsum.photos/id/5/400/400.jpg" },
  { id: "7", author: "Alejandro Escamilla", width: 4728, height: 3168, download_url: "https://picsum.photos/id/7/4728/3168", avatar_url: "https://picsum.photos/id/7/400/400.jpg" },
  { id: "10", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/10/2500/1667", avatar_url: "https://picsum.photos/id/10/400/400.jpg" },
  { id: "11", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/11/2500/1667", avatar_url: "https://picsum.photos/id/11/400/400.jpg" },
  { id: "12", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/12/2500/1667", avatar_url: "https://picsum.photos/id/12/400/400.jpg" },
  { id: "13", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/13/2500/1667", avatar_url: "https://picsum.photos/id/13/400/400.jpg" },
  { id: "14", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/14/2500/1667", avatar_url: "https://picsum.photos/id/14/400/400.jpg" },
  { id: "15", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/15/2500/1667", avatar_url: "https://picsum.photos/id/15/400/400.jpg" },
  { id: "16", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/16/2500/1667", avatar_url: "https://picsum.photos/id/16/400/400.jpg" },
  { id: "17", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/17/2500/1667", avatar_url: "https://picsum.photos/id/17/400/400.jpg" },
  { id: "18", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/18/2500/1667", avatar_url: "https://picsum.photos/id/18/400/400.jpg" },
  { id: "19", author: "Paul Jarvis", width: 2500, height: 1667, download_url: "https://picsum.photos/id/19/2500/1667", avatar_url: "https://picsum.photos/id/19/400/400.jpg" },
  { id: "20", author: "Aleks Dorohovich", width: 3670, height: 2462, download_url: "https://picsum.photos/id/20/3670/2462", avatar_url: "https://picsum.photos/id/20/400/400.jpg" },
  { id: "21", author: "Alejandro Escamilla", width: 3008, height: 2008, download_url: "https://picsum.photos/id/21/3008/2008", avatar_url: "https://picsum.photos/id/21/400/400.jpg" },
  { id: "22", author: "Alejandro Escamilla", width: 4434, height: 3729, download_url: "https://picsum.photos/id/22/4434/3729", avatar_url: "https://picsum.photos/id/22/400/400.jpg" },
  { id: "23", author: "Alejandro Escamilla", width: 3887, height: 4899, download_url: "https://picsum.photos/id/23/3887/4899", avatar_url: "https://picsum.photos/id/23/400/400.jpg" },
  { id: "29", author: "Go Wild", width: 4000, height: 2670, download_url: "https://picsum.photos/id/29/4000/2670", avatar_url: "https://picsum.photos/id/29/400/400.jpg" },
  { id: "30", author: "Shyamanta Baruah", width: 1280, height: 901, download_url: "https://picsum.photos/id/30/1280/901", avatar_url: "https://picsum.photos/id/30/400/400.jpg" },
  { id: "32", author: "Rodrigo Melo", width: 4032, height: 3024, download_url: "https://picsum.photos/id/32/4032/3024", avatar_url: "https://picsum.photos/id/32/400/400.jpg" },
  { id: "34", author: "Aleks Dorohovich", width: 3872, height: 2592, download_url: "https://picsum.photos/id/34/3872/2592", avatar_url: "https://picsum.photos/id/34/400/400.jpg" },
  { id: "35", author: "Shane Colella", width: 2758, height: 3622, download_url: "https://picsum.photos/id/35/2758/3622", avatar_url: "https://picsum.photos/id/35/400/400.jpg" },
  { id: "36", author: "Vadim Sherbakov", width: 4179, height: 2790, download_url: "https://picsum.photos/id/36/4179/2790", avatar_url: "https://picsum.photos/id/36/400/400.jpg" },
  { id: "38", author: "Allyson Souza", width: 1280, height: 960, download_url: "https://picsum.photos/id/38/1280/960", avatar_url: "https://picsum.photos/id/38/400/400.jpg" },
  { id: "39", author: "Luke Chesser", width: 3456, height: 2304, download_url: "https://picsum.photos/id/39/3456/2304", avatar_url: "https://picsum.photos/id/39/400/400.jpg" },
  { id: "40", author: "Ryan Mcguire", width: 4106, height: 2806, download_url: "https://picsum.photos/id/40/4106/2806", avatar_url: "https://picsum.photos/id/40/400/400.jpg" },
  { id: "42", author: "Luke Chesser", width: 3456, height: 2304, download_url: "https://picsum.photos/id/42/3456/2304", avatar_url: "https://picsum.photos/id/42/400/400.jpg" },
  { id: "44", author: "Christopher Sardegna", width: 4272, height: 2848, download_url: "https://picsum.photos/id/44/4272/2848", avatar_url: "https://picsum.photos/id/44/400/400.jpg" },
  { id: "46", author: "Jeffrey Kam", width: 3264, height: 2448, download_url: "https://picsum.photos/id/46/3264/2448", avatar_url: "https://picsum.photos/id/46/400/400.jpg" },
  { id: "47", author: "Christopher Sardegna", width: 4272, height: 2848, download_url: "https://picsum.photos/id/47/4272/2848", avatar_url: "https://picsum.photos/id/47/400/400.jpg" },
  { id: "50", author: "Tyler Wanlass", width: 4608, height: 3072, download_url: "https://picsum.photos/id/50/4608/3072", avatar_url: "https://picsum.photos/id/50/400/400.jpg" },
  { id: "53", author: "J Duclos", width: 1280, height: 1280, download_url: "https://picsum.photos/id/53/1280/1280", avatar_url: "https://picsum.photos/id/53/400/400.jpg" },
  { id: "54", author: "Nicholas Swanson", width: 3264, height: 2176, download_url: "https://picsum.photos/id/54/3264/2176", avatar_url: "https://picsum.photos/id/54/400/400.jpg" },
  { id: "55", author: "Tyler Wanlass", width: 4608, height: 3072, download_url: "https://picsum.photos/id/55/4608/3072", avatar_url: "https://picsum.photos/id/55/400/400.jpg" },
  { id: "56", author: "Sebastian Muller", width: 2880, height: 1920, download_url: "https://picsum.photos/id/56/2880/1920", avatar_url: "https://picsum.photos/id/56/400/400.jpg" },
  { id: "57", author: "Nicholas Swanson", width: 2448, height: 3264, download_url: "https://picsum.photos/id/57/2448/3264", avatar_url: "https://picsum.photos/id/57/400/400.jpg" },
  { id: "61", author: "Alex", width: 3264, height: 2448, download_url: "https://picsum.photos/id/61/3264/2448", avatar_url: "https://picsum.photos/id/61/400/400.jpg" },
  { id: "64", author: "Alexander Shustov", width: 4326, height: 2884, download_url: "https://picsum.photos/id/64/4326/2884", avatar_url: "https://picsum.photos/id/64/400/400.jpg" },
  { id: "66", author: "Nicholas Swanson", width: 3264, height: 2448, download_url: "https://picsum.photos/id/66/3264/2448", avatar_url: "https://picsum.photos/id/66/400/400.jpg" },
  { id: "68", author: "Cristian Moscoso", width: 4608, height: 3072, download_url: "https://picsum.photos/id/68/4608/3072", avatar_url: "https://picsum.photos/id/68/400/400.jpg" },
  { id: "72", author: "Tyler Finck", width: 3000, height: 2000, download_url: "https://picsum.photos/id/72/3000/2000", avatar_url: "https://picsum.photos/id/72/400/400.jpg" },
  { id: "77", author: "May Pamintuan", width: 1631, height: 1102, download_url: "https://picsum.photos/id/77/1631/1102", avatar_url: "https://picsum.photos/id/77/400/400.jpg" },
  { id: "80", author: "Sonja Langford", width: 3888, height: 2592, download_url: "https://picsum.photos/id/80/3888/2592", avatar_url: "https://picsum.photos/id/80/400/400.jpg" },
  { id: "83", author: "Julie Geiger", width: 2560, height: 1920, download_url: "https://picsum.photos/id/83/2560/1920", avatar_url: "https://picsum.photos/id/83/400/400.jpg" },
  { id: "87", author: "Barcelona", width: 1280, height: 960, download_url: "https://picsum.photos/id/87/1280/960", avatar_url: "https://picsum.photos/id/87/400/400.jpg" },
  { id: "88", author: "Barcelona", width: 1280, height: 1707, download_url: "https://picsum.photos/id/88/1280/1707", avatar_url: "https://picsum.photos/id/88/400/400.jpg" },
  { id: "91", author: "Jennifer Trovato", width: 3504, height: 2336, download_url: "https://picsum.photos/id/91/3504/2336", avatar_url: "https://picsum.photos/id/91/400/400.jpg" },
  { id: "93", author: "Caroline Sada", width: 2000, height: 1334, download_url: "https://picsum.photos/id/93/2000/1334", avatar_url: "https://picsum.photos/id/93/400/400.jpg" },
  { id: "95", author: "Kundan Ramisetti", width: 2048, height: 2048, download_url: "https://picsum.photos/id/95/2048/2048", avatar_url: "https://picsum.photos/id/95/400/400.jpg" },
  { id: "96", author: "Pawel Kadysz", width: 4752, height: 3168, download_url: "https://picsum.photos/id/96/4752/3168", avatar_url: "https://picsum.photos/id/96/400/400.jpg" },
  { id: "98", author: "Laurice Solomon", width: 3264, height: 2176, download_url: "https://picsum.photos/id/98/3264/2176", avatar_url: "https://picsum.photos/id/98/400/400.jpg" }
];

// Configuração do Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas. Configure EXPO_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downloadImage(url, filename, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⬇️ Baixando: ${filename} (tentativa ${attempt})`);

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 15000
      });

      const writer = fs.createWriteStream(filename);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ Salvo: ${filename}`);
          resolve();
        });
        writer.on('error', (error) => {
          console.error(`❌ Erro ao salvar ${filename}:`, error.message);
          reject(error);
        });
      });

    } catch (error) {
      console.log(`⚠️ Tentativa ${attempt} falhou para ${filename}: ${error.message}`);

      if (attempt === retries) {
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function createStorageBucket() {
  console.log('📦 Verificando/criando bucket de storage...');

  try {
    // Tentar criar o bucket (vai falhar se já existir, mas isso é ok)
    const { data, error } = await supabase.storage.createBucket('avatars', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });

    if (error && !error.message.includes('already exists')) {
      throw error;
    }

    console.log('✅ Bucket "avatars" pronto!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao criar bucket:', error);
    return false;
  }
}

async function uploadImageToStorage(filepath, filename) {
  try {
    console.log(`📤 Fazendo upload: ${filename}`);

    const fileBuffer = await fs.readFile(filepath);

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filename, fileBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) {
      throw error;
    }

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filename);

    console.log(`✅ Upload concluído: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error(`❌ Erro no upload de ${filename}:`, error);
    return null;
  }
}

async function updateUserProfilesWithAvatars(avatarUrls) {
  console.log('👥 Atualizando perfis dos usuários...');

  try {
    // Buscar todos os usuários
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, name')
      .limit(45); // Limitar aos primeiros 45 usuários

    if (usersError) {
      throw usersError;
    }

    console.log(`📊 Encontrados ${users.length} usuários para atualizar`);

    // Atualizar cada usuário com um avatar aleatório
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const avatarUrl = avatarUrls[i % avatarUrls.length]; // Ciclo através dos avatares

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Erro ao atualizar usuário ${user.name}:`, updateError);
      } else {
        console.log(`✅ Atualizado: ${user.name} -> ${avatarUrl}`);
      }

      // Pequena pausa para não sobrecarregar
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('🎉 Atualização de perfis concluída!');

  } catch (error) {
    console.error('❌ Erro ao atualizar perfis:', error);
  }
}

async function main() {
  const imagesDir = path.join(__dirname, 'downloaded_avatars');
  await fs.ensureDir(imagesDir);

  console.log('🚀 Iniciando processo completo de avatares...');
  console.log('=' .repeat(50));

  // 1. Criar bucket de storage
  const bucketCreated = await createStorageBucket();
  if (!bucketCreated) {
    console.error('❌ Não foi possível configurar o storage. Abortando.');
    return;
  }

  // 2. Baixar imagens
  console.log('\n📥 Baixando imagens do Lorem Picsum...');
  const downloadedImages = [];

  for (let i = 0; i < portraitImages.length; i++) {
    const image = portraitImages[i];
    const filename = `avatar_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(imagesDir, filename);

    try {
      await downloadImage(image.avatar_url, filepath);
      downloadedImages.push({
        filename,
        filepath,
        source: 'lorem-picsum',
        picsum_id: image.id
      });

      // Pausa entre downloads
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.log(`⚠️ Pulando imagem ${i + 1} (${image.id})`);
    }
  }

  console.log(`\n📊 Download concluído: ${downloadedImages.length}/${portraitImages.length} imagens`);

  // 3. Fazer upload para Supabase Storage
  console.log('\n☁️ Fazendo upload para Supabase Storage...');
  const uploadedUrls = [];

  for (const image of downloadedImages) {
    const publicUrl = await uploadImageToStorage(image.filepath, image.filename);
    if (publicUrl) {
      uploadedUrls.push(publicUrl);
    }

    // Pausa entre uploads
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log(`\n📊 Upload concluído: ${uploadedUrls.length}/${downloadedImages.length} imagens`);

  // 4. Atualizar perfis dos usuários
  if (uploadedUrls.length > 0) {
    await updateUserProfilesWithAvatars(uploadedUrls);
  }

  // 5. Salvar metadados
  const metadataPath = path.join(imagesDir, 'metadata.json');
  await fs.writeJson(metadataPath, {
    total_downloaded: downloadedImages.length,
    total_uploaded: uploadedUrls.length,
    images: downloadedImages,
    uploaded_urls: uploadedUrls,
    generated_at: new Date().toISOString(),
    source: 'lorem-picsum'
  });

  console.log(`\n📄 Metadados salvos em: ${metadataPath}`);
  console.log('\n🎉 Processo completo finalizado!');
  console.log(`📊 Resumo: ${uploadedUrls.length} avatares atualizados nos perfis dos usuários`);
}

// Executar se chamado diretamente
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n✅ Script executado com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante execução:', error);
      process.exit(1);
    });
}

module.exports = { main, downloadImage, createStorageBucket, uploadImageToStorage, updateUserProfilesWithAvatars };