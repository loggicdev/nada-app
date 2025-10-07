const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// Fontes gratuitas de imagens de pessoas
const imageSources = [
  // Unsplash API (gratuita, sem autenticação necessária para uso básico)
  {
    name: 'unsplash',
    baseUrl: 'https://source.unsplash.com/random/400x400/?face,portrait,person',
    getUrl: (index) => `https://source.unsplash.com/random/400x400/?face,portrait,person&w=${400 + index}`
  },
  // Picsum Photos (Lorem Picsum)
  {
    name: 'picsum',
    baseUrl: 'https://picsum.photos/400/400?random=',
    getUrl: (index) => `https://picsum.photos/400/400?random=${index}`
  },
  // Random User API (mas vamos usar as imagens)
  {
    name: 'randomuser',
    baseUrl: 'https://randomuser.me/api/portraits/',
    getUrl: (index, gender = 'men') => `https://randomuser.me/api/portraits/${gender}/${index % 99}.jpg`
  }
];

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
        timeout: 15000 // 15 segundos timeout
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

      // Espera antes de tentar novamente
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

async function downloadFromMultipleSources(numImages = 45) {
  const imagesDir = path.join(__dirname, 'downloaded_images');
  await fs.ensureDir(imagesDir);

  console.log(`📁 Salvando imagens em: ${imagesDir}`);
  console.log(`📊 Baixando ${numImages} imagens de múltiplas fontes...`);
  console.log('=' .repeat(50));

  const downloadedImages = [];
  let imageCount = 0;

  // Distribui downloads entre as fontes
  const imagesPerSource = Math.ceil(numImages / imageSources.length);

  for (const source of imageSources) {
    if (imageCount >= numImages) break;

    console.log(`\n🌐 Usando fonte: ${source.name}`);

    for (let i = 0; i < imagesPerSource && imageCount < numImages; i++) {
      try {
        let imageUrl;

        if (source.name === 'randomuser') {
          // Alterna entre homens e mulheres
          const gender = (imageCount % 2 === 0) ? 'men' : 'women';
          imageUrl = source.getUrl(imageCount, gender);
        } else {
          imageUrl = source.getUrl(imageCount);
        }

        const filename = `avatar_${String(imageCount + 1).padStart(3, '0')}.jpg`;
        const filepath = path.join(imagesDir, filename);

        await downloadImage(imageUrl, filepath);

        downloadedImages.push({
          filename,
          filepath,
          url: imageUrl,
          source: source.name,
          index: imageCount + 1
        });

        imageCount++;

        // Pequena pausa para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`⚠️ Pulando imagem ${imageCount + 1} da fonte ${source.name}`);
      }
    }
  }

  console.log(`\n🎉 Download concluído!`);
  console.log(`📊 Total baixado: ${downloadedImages.length}/${numImages}`);

  // Salvar metadados
  const metadataPath = path.join(imagesDir, 'metadata.json');
  await fs.writeJson(metadataPath, {
    total: downloadedImages.length,
    images: downloadedImages,
    generated_at: new Date().toISOString(),
    sources: imageSources.map(s => s.name)
  });

  console.log(`📄 Metadados salvos em: ${metadataPath}`);

  return downloadedImages;
}

// Executar se chamado diretamente
if (require.main === module) {
  const numImages = parseInt(process.argv[2]) || 45;

  console.log('🚀 Iniciando download de imagens de pessoas...');
  console.log(`📊 Objetivo: ${numImages} imagens`);
  console.log('=' .repeat(50));

  downloadFromMultipleSources(numImages)
    .then(() => {
      console.log('\n🎉 Processo concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante o processo:', error);
      process.exit(1);
    });
}

module.exports = { downloadFromMultipleSources, downloadImage };