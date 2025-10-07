const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

// URLs das imagens extraídas do Freepik
const imageUrls = [
  "https://img.freepik.com/free-photo/medium-shot-smiley-woman-low-angle_23-2149213172.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/close-up-portrait-tender-lovely-woman-with-curly-hair-nude-make-up-posing-camera-with-lovely-smile-brunette-woman-brown-shirt-feels-good-weekend-home-comfort-concept_291650-2699.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/happy-excited-woman-with-long-dark-hair-wearing-beige-coat-sitting-open-space-cafeteria-waiting-coffee_291650-953.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/sensual-woman-looking-front_197531-19790.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/medium-shot-woman-spending-quality-time-outdoors_23-2150757174.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/portrait-stylish-brunette-woman-posing-smiling_23-2149021863.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/fashion-portrait-young-elegant-woman_1328-2614.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/happy-portrait-life-closeup-carrying-women_1303-3371.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/smiling-brunette-looking-camera_1915756.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/portrait-smiling-woman-look-away-white-shirt_27440288.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/young-happy-woman-sweater_3565143.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/close-up-happy-woman-holding-flowers_21252895.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/woman-with-beautiful-gladiolus-flowers_27593526.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/young-woman-wearing-chain-necklace_28952014.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/smiley-woman-holding-hat-medium-shot_21252824.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/ginger-head-woman-with-colorful-outfit_27586950.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/eastern-woman_1602941.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/close-up-smiley-beautiful-woman-posing_12813282.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/young-pretty-woman-smiling-camera_7572077.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/woman-with-white-blouse_1128135.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/medium-shot-happy-woman-portrait_21252868.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/beautiful-woman-posing-front-view_28476486.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/vertical-closeup-shot-young-attractive-caucasian-female-posing-outdoors_18813238.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/smiley-woman-posing-by-beach_9468533.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/confident-woman-supporting-body-positivity_14478631.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/portrait-young-beautiful-woman-smiling_9320975.jpg?semt=ais_hybrid&w=740&q=80",
  "https://img.freepik.com/free-photo/medium-shot-smiley-woman-portrait_25128981.jpg?semt=ais_hybrid&w=740&q=80"
];

async function downloadImage(url, filename) {
  try {
    console.log(`⬇️ Baixando: ${filename}`);

    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Referer': 'https://www.freepik.com/'
      },
      timeout: 30000 // 30 segundos timeout
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
    console.error(`❌ Erro ao baixar ${url}:`, error.message);
    throw error;
  }
}

async function downloadAllImages() {
  const imagesDir = path.join(__dirname, 'downloaded_images');
  await fs.ensureDir(imagesDir);

  console.log(`📁 Salvando imagens em: ${imagesDir}`);
  console.log(`📊 Total de imagens para baixar: ${imageUrls.length}`);
  console.log('=' .repeat(50));

  const downloadedImages = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    const filename = `avatar_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(imagesDir, filename);

    try {
      await downloadImage(url, filepath);
      downloadedImages.push({
        filename,
        filepath,
        url,
        index: i + 1
      });

      // Pequena pausa para não sobrecarregar o servidor
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log(`⚠️ Pulando imagem ${i + 1} devido a erro`);
    }
  }

  console.log('\n🎉 Download concluído!');
  console.log(`📊 Total baixado: ${downloadedImages.length}/${imageUrls.length}`);

  // Salvar metadados
  const metadataPath = path.join(imagesDir, 'metadata.json');
  await fs.writeJson(metadataPath, {
    total: downloadedImages.length,
    images: downloadedImages,
    generated_at: new Date().toISOString(),
    source: 'freepik'
  });

  console.log(`📄 Metadados salvos em: ${metadataPath}`);

  return downloadedImages;
}

// Executar se chamado diretamente
if (require.main === module) {
  console.log('🚀 Iniciando download de imagens do Freepik...');
  console.log('=' .repeat(50));

  downloadAllImages()
    .then(() => {
      console.log('\n🎉 Processo concluído com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Erro durante o processo:', error);
      process.exit(1);
    });
}

module.exports = { downloadAllImages, downloadImage };