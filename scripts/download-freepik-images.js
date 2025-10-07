const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

async function downloadImage(url, filename) {
  try {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const writer = fs.createWriteStream(filename);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    console.error(`Erro ao baixar ${url}:`, error.message);
    throw error;
  }
}

async function scrapeFreepikImages(searchTerm = 'people faces', numImages = 50) {
  const imagesDir = path.join(__dirname, 'downloaded_images');
  await fs.ensureDir(imagesDir);

  console.log(`🔍 Procurando por "${searchTerm}" no Freepik...`);
  console.log(`📁 Salvando imagens em: ${imagesDir}`);

  // URLs do Freepik para diferentes tipos de pessoas
  const freepikUrls = [
    'https://freepik.com/search?query=portrait+woman&orientation=portrait',
    'https://freepik.com/search?query=portrait+man&orientation=portrait',
    'https://freepik.com/search?query=young+woman+face&orientation=portrait',
    'https://freepik.com/search?query=young+man+face&orientation=portrait',
    'https://freepik.com/search?query=beautiful+face&orientation=portrait',
    'https://freepik.com/search?query=person+portrait&orientation=portrait'
  ];

  const downloadedImages = [];
  let imageCount = 0;

  for (const url of freepikUrls) {
    if (imageCount >= numImages) break;

    try {
      console.log(`🌐 Acessando: ${url}`);

      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Extrair URLs de imagens do HTML (simplificado)
      const html = response.data;
      const imageRegex = /https:\/\/img\.freepik\.com\/[^"']*\.(jpg|jpeg|png|webp)/g;
      const matches = html.match(imageRegex);

      if (matches) {
        console.log(`📸 Encontradas ${matches.length} imagens nesta página`);

        for (const imageUrl of matches) {
          if (imageCount >= numImages) break;

          try {
            const filename = `avatar_${String(imageCount + 1).padStart(3, '0')}.jpg`;
            const filepath = path.join(imagesDir, filename);

            console.log(`⬇️ Baixando imagem ${imageCount + 1}/${numImages}: ${filename}`);
            await downloadImage(imageUrl, filepath);

            downloadedImages.push({
              filename,
              filepath,
              url: imageUrl
            });

            imageCount++;

            // Pequena pausa para não sobrecarregar
            await new Promise(resolve => setTimeout(resolve, 500));

          } catch (error) {
            console.log(`⚠️ Erro ao baixar imagem: ${error.message}`);
          }
        }
      }

    } catch (error) {
      console.log(`⚠️ Erro ao acessar ${url}: ${error.message}`);
    }
  }

  console.log(`\n✅ Download concluído!`);
  console.log(`📊 Total de imagens baixadas: ${downloadedImages.length}`);
  console.log(`📁 Imagens salvas em: ${imagesDir}`);

  // Salvar lista de imagens em JSON
  const metadataPath = path.join(imagesDir, 'metadata.json');
  await fs.writeJson(metadataPath, {
    total: downloadedImages.length,
    images: downloadedImages,
    generated_at: new Date().toISOString()
  });

  console.log(`📄 Metadados salvos em: ${metadataPath}`);

  return downloadedImages;
}

// Executar se chamado diretamente
if (require.main === module) {
  const searchTerm = process.argv[2] || 'people faces';
  const numImages = parseInt(process.argv[3]) || 45;

  console.log(`🚀 Iniciando download de ${numImages} imagens de "${searchTerm}"`);
  console.log('=' .repeat(50));

  scrapeFreepikImages(searchTerm, numImages)
    .then(() => {
      console.log('\n🎉 Processo concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante o processo:', error);
      process.exit(1);
    });
}

module.exports = { scrapeFreepikImages, downloadImage };