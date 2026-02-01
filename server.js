require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const PORT = process.env.PORT || 3000;
const MEDIASTREAM_TOKEN = process.env.MEDIASTREAM_TOKEN;
const MEDIASTREAM_API = process.env.MEDIASTREAM_API || 'https://platform.mediastre.am/api';

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Crear directorio de descargas si no existe
const DOWNLOADS_DIR = path.join(__dirname, 'downloads');
fs.mkdir(DOWNLOADS_DIR, { recursive: true }).catch(console.error);

// Función para obtener metadata de YouTube usando yt-dlp
async function getYouTubeMetadata(url) {
  try {
    console.log('🔍 Obteniendo metadata de YouTube con yt-dlp...');
    
    return new Promise((resolve, reject) => {
      const process = spawn('yt-dlp', [
        '--dump-json',
        '--no-download',
        '--no-warnings',
        '--cookies-from-browser', 'chrome',
        url
      ]);
      
      let jsonOutput = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        jsonOutput += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code === 0 && jsonOutput) {
          try {
            const info = JSON.parse(jsonOutput);
            
            const thumbnails = Array.isArray(info.thumbnails) ? info.thumbnails : [];
            // Ordenar thumbnails por resolución (desc)
            thumbnails.sort((a, b) => (b.width || 0) - (a.width || 0));

            const metadata = {
              title: info.title || 'YouTube Video',
              description: info.description || '',
              thumbnail: info.thumbnail || (thumbnails[0]?.url || ''),
              thumbnails: thumbnails,
              duration: parseInt(info.duration) || 0,
              author: info.uploader || info.channel || '',
              videoId: info.id || '',
              viewCount: parseInt(info.view_count) || 0,
              uploadDate: info.upload_date || ''
            };
            
            console.log('✅ Metadata obtenida:', {
              title: metadata.title.substring(0, 50) + (metadata.title.length > 50 ? '...' : ''),
              duration: `${Math.floor(metadata.duration / 60)}m ${metadata.duration % 60}s`,
              author: metadata.author
            });
            
            resolve(metadata);
          } catch (parseError) {
            console.error('⚠️  Error parseando JSON:', parseError.message);
            resolve(null);
          }
        } else {
          console.error('⚠️  Error obteniendo metadata:', errorOutput || 'Unknown error');
          resolve(null);
        }
      });
      
      process.on('error', (error) => {
        console.error('⚠️  Error ejecutando yt-dlp:', error.message);
        resolve(null);
      });
    });
  } catch (error) {
    console.error('⚠️  Error obteniendo metadata:', error.message);
    return null;
  }
}

// Función para descargar múltiples thumbnails de YouTube
async function downloadThumbnails(thumbnails, outputPrefix, maxCount = 5) {
  try {
    if (!thumbnails || thumbnails.length === 0) return [];
    const uniqueUrls = [];
    for (const t of thumbnails) {
      if (t?.url && !uniqueUrls.includes(t.url)) uniqueUrls.push(t.url);
    }
    const selected = uniqueUrls.slice(0, maxCount);
    const paths = [];

    for (let i = 0; i < selected.length; i++) {
      const url = selected[i];
      const outputPath = `${outputPrefix}_${i + 1}.jpg`;
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        await fs.writeFile(outputPath, response.data);
        paths.push(outputPath);
        console.log(`✅ Thumbnail descargado (${i + 1}/${selected.length})`);
      } catch (error) {
        console.warn(`⚠️  Error descargando thumbnail ${i + 1}:`, error.message);
      }
    }

    return paths;
  } catch (error) {
    console.error('⚠️  Error descargando thumbnails:', error.message);
    return [];
  }
}

// Helpers para tamaños y estimaciones
function parseSizeToBytes(sizeStr) {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/(\d+\.?\d*)\s*(KiB|MiB|GiB|B)/i);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers = { b: 1, kib: 1024, mib: 1024 * 1024, gib: 1024 * 1024 * 1024 };
  return Math.round(value * (multipliers[unit] || 1));
}

function estimateSizeFromBitrate(durationSec, videoKbps, audioKbps) {
  if (!durationSec || (!videoKbps && !audioKbps)) return 0;
  const totalKbps = (videoKbps || 0) + (audioKbps || 0);
  return Math.round((totalKbps * 1000 / 8) * durationSec);
}

async function getFormatFileSize(youtubeUrl, format) {
  return new Promise((resolve) => {
    const process = spawn('yt-dlp', [
      '--no-download',
      '--no-check-certificates',
      '--cookies-from-browser', 'chrome',
      '--print', 'filesize',
      '--print', 'filesize_approx',
      '-f', format,
      youtubeUrl
    ]);
    let output = '';
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    process.on('close', () => {
      const lines = output.split('\n').map(l => l.trim()).filter(Boolean);
      const sizeLine = lines.find(l => /^\d+$/.test(l));
      if (sizeLine) {
        resolve(parseInt(sizeLine, 10));
        return;
      }
      // Try approx size in bytes (sometimes printed as "12345")
      resolve(0);
    });
    process.on('error', () => resolve(0));
  });
}

async function waitForMediaCreation(uploadPath, token, maxAttempts = 30, waitMs = 10000) {
  const namePart = String(uploadPath || '').trim().split('.').pop();
  console.log(`🔍 Esperando creación de media con name_part: ${namePart}`);
  console.log(`🌐 Buscando en API: ${MEDIASTREAM_API}`);
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await axios.get(`${MEDIASTREAM_API}/media`, {
        params: {
          'title-rule': 'starts_with',
          title: namePart,
          all: 'true'
        },
        headers: {
          'X-Api-Token': token
        }
      });
      console.log(`🔎 Respuesta búsqueda (intento ${attempt}): status=${response.data?.status} items=${response.data?.data?.length || 0}`);
      if (response.data?.status === 'OK' && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const media = response.data.data[0];
        console.log(`✅ Media creado encontrado: ${media._id}`);
        return media;
      }
    } catch (error) {
      console.log(`⚠️  Error buscando media (intento ${attempt}/${maxAttempts}):`, error.message);
    }
    console.log(`⏳ Media no disponible aún, esperando ${waitMs / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, waitMs));
  }
  return null;
}

// Función para obtener el mejor formato 1080p disponible
async function getBest1080pFormat(youtubeUrl, durationSec = 0) {
  return new Promise((resolve) => {
    console.log('🔍 Analizando formatos disponibles en YouTube...');
    
    // Usar cookies para evitar bloqueo de YouTube
    const process = spawn('yt-dlp', [
      '-F', // Listar formatos
      '--no-check-certificates',
      '--cookies-from-browser', 'chrome',
      youtubeUrl
    ]);
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        console.log('⚠️  Error listando formatos:', errorOutput);
        console.log('⚠️  Usando selector automático de 1080p');
        resolve({
          format: 'bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
          sizeBytes: 0,
          videoId: null,
          audioId: null
        });
        return;
      }
      
      // Mostrar TODOS los formatos para debugging
      console.log('📋 TODOS los formatos disponibles:');
      console.log(output);
      console.log('─'.repeat(80));
      
      // Buscar formatos 1080p
      const lines = output.split('\n');
      let best1080pId = null;
      let bestBitrate = 0;
      let bestVideoSizeBytes = 0;
      
      for (const line of lines) {
        // Buscar 1920x1080 o 1080p en cualquier parte de la línea
        if ((line.includes('1920x1080') || line.includes('1080p') || line.includes('1920×1080')) && !line.includes('audio only')) {
          console.log(`✅ Encontrado 1080p: ${line.trim()}`);
          const formatMatch = line.match(/^(\d+)\s+/);
          if (formatMatch) {
            const formatId = formatMatch[1];
            // Buscar bitrate (puede estar en diferentes formatos)
            const bitrateMatch = line.match(/(\d+)[kK]/);
            const bitrate = bitrateMatch ? parseInt(bitrateMatch[1]) : 0;
            
            const sizeMatch = line.match(/\|\s*~?\s*([\d.]+\s*(KiB|MiB|GiB|B))/i);
            const sizeBytes = sizeMatch ? parseSizeToBytes(sizeMatch[1]) : 0;

            // Preferir H.264 (avc1) sobre VP9 (vp09) y evitar "Untested" o "Premium"
            // Formato 137 es el estándar 1080p H.264 de YouTube
            const isH264 = line.includes('avc1') && !line.includes('vp09');
            const isReliable = !line.includes('Untested') && !line.includes('Premium') && line.includes('https');
            const isMp4Dash = line.includes('mp4_dash');
            
            // Prioridad: H.264 confiable > bitrate alto
            if (isH264 && isReliable && isMp4Dash && bitrate > 1000 && bitrate > bestBitrate) {
              best1080pId = formatId;
              bestBitrate = bitrate;
              bestVideoSizeBytes = sizeBytes;
              console.log(`   ⭐ Formato 1080p H.264 confiable: ${formatId} (${bitrate}k)`);
            } else if (!best1080pId && line.includes('mp4') && bitrate > bestBitrate) {
              // Fallback a cualquier mp4
              best1080pId = formatId;
              bestBitrate = bitrate;
              bestVideoSizeBytes = sizeBytes;
            }
          }
        }
      }
      
      if (best1080pId) {
        // Buscar el mejor audio
        let bestAudioId = null;
        let bestAudioBitrate = 0;
        let bestAudioSizeBytes = 0;
        
        for (const line of lines) {
          if (line.includes('audio only')) {
            const formatMatch = line.match(/^(\d+)\s+/);
            const bitrateMatch = line.match(/(\d+)k/i);
            if (formatMatch && bitrateMatch) {
              const audioId = formatMatch[1];
              const audioBitrate = parseInt(bitrateMatch[1]);
              // Preferir m4a sobre webm, y https sobre m3u8
              const isM4a = line.includes('m4a');
              const isHttps = line.includes('https');
              
              if (audioBitrate > bestAudioBitrate && (isM4a || line.includes('mp4')) && isHttps) {
                bestAudioId = audioId;
                bestAudioBitrate = audioBitrate;
                const sizeMatch = line.match(/\|\s*~?\s*([\d.]+\s*(KiB|MiB|GiB|B))/i);
                bestAudioSizeBytes = sizeMatch ? parseSizeToBytes(sizeMatch[1]) : 0;
                console.log(`   🔊 Mejor audio: ${audioId} (${audioBitrate}k)`);
              }
            }
          }
        }
        
        const format = bestAudioId ? `${best1080pId}+${bestAudioId}` : best1080pId;
        let sizeBytes = 0;
        if (bestVideoSizeBytes || bestAudioSizeBytes) {
          sizeBytes = bestVideoSizeBytes + bestAudioSizeBytes;
        } else {
          sizeBytes = estimateSizeFromBitrate(durationSec, bestBitrate, bestAudioBitrate);
        }
        
        console.log('\n' + '═'.repeat(80));
        console.log('✅ FORMATO DE VIDEO SELECCIONADO:');
        console.log('═'.repeat(80));
        console.log(`   📹 CALIDAD: 1080p (Full HD)`);
        console.log(`   📐 RESOLUCIÓN: 1920x1080 pixels`);
        console.log(`   📦 FORMATO: MP4 (H.264/AVC)`);
        console.log(`   🎬 Video ID: ${best1080pId} (${bestBitrate}k bitrate)`);
        console.log(`   🔊 Audio ID: ${bestAudioId || 'integrado'} (${bestAudioBitrate}k bitrate)`);
        console.log(`   🔗 Formato yt-dlp: ${format}`);
        console.log(`   📦 Tamaño estimado: ${(sizeBytes / (1024 * 1024)).toFixed(2)}MB`);
        console.log('═'.repeat(80) + '\n');
        
        resolve({
          format,
          sizeBytes,
          videoId: best1080pId,
          audioId: bestAudioId
        });
      } else {
        console.log('❌ No se detectó formato 1080p en la lista');
        console.log('⚠️  Intentando con selector automático bestvideo[height=1080]...');
        // No rechazar, usar el selector automático que puede funcionar
        resolve({
          format: 'bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
          sizeBytes: estimateSizeFromBitrate(durationSec, 2000, 128),
          videoId: null,
          audioId: null
        });
      }
    });
  });
}

async function splitFileIntoChunks(filePath, chunkSize, tmpDir, fileName) {
  await fs.mkdir(tmpDir, { recursive: true });
  const chunks = [];
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;
  let offset = 0;
  let index = 0;

  while (offset < fileSize) {
    const end = Math.min(offset + chunkSize, fileSize);
    const size = end - offset;
    const chunkId = index.toString(36).padStart(5, '0');
    const chunkPath = path.join(tmpDir, `${fileName}.${chunkId}`);

    const buffer = Buffer.alloc(size);
    const handle = await fs.open(filePath, 'r');
    await handle.read(buffer, 0, size, offset);
    await handle.close();

    await fs.writeFile(chunkPath, buffer);
    chunks.push({ path: chunkPath, size, index: index + 1 });

    offset = end;
    index += 1;
  }

  return chunks;
}

async function uploadToMediastreamChunkedLikeBash(filePath, fileName, token, progressCallback) {
  const CHUNK_SIZE = 10 * 1024 * 1024;
  const stats = await fs.stat(filePath);
  const fileSize = stats.size;
  const tmpDir = path.join(DOWNLOADS_DIR, 'tmp');

  console.log(`📦 Preparando upload por chunks (bash): ${(fileSize / (1024 * 1024)).toFixed(2)} MB`);

  const { uploadPath } = await getUploadToken(fileName, fileSize, token);
  console.log(`✅ Upload token obtenido. Upload path: ${uploadPath.substring(0, 80)}...`);

  const chunks = await splitFileIntoChunks(filePath, CHUNK_SIZE, tmpDir, fileName);
  console.log(`📊 Total de chunks: ${chunks.length}`);

  let uploadedCount = 0;
  for (const chunk of chunks) {
    const chunkNumber = chunk.index;
    console.log(`\n📤 UPLOADING ${path.basename(chunk.path)} (Number ${chunkNumber})`);

    const headResp = await axios.get(`${uploadPath}?resumableChunkNumber=${chunkNumber}`, {
      validateStatus: (status) => status === 200 || status === 204
    });
    const mustUpload = headResp.status === 204;

    if (mustUpload) {
      const formData = new FormData();
      formData.append('file', fsSync.createReadStream(chunk.path));
      formData.append('name', fileName);

      const uploadResponse = await axios.post(
        `${uploadPath}?resumableChunkNumber=${chunkNumber}`,
        formData,
        { headers: { ...formData.getHeaders() }, maxBodyLength: Infinity, timeout: 180000 }
      );
      console.log(`CHUNK ${chunkNumber} UPLOAD RESPONSE: ${uploadResponse.data}`);
    } else {
      console.log(`CHUNK ${chunkNumber} ALREADY EXISTS IN SERVER - SKIPPING`);
    }

    uploadedCount += 1;
    const progress = Math.round((uploadedCount / chunks.length) * 100);
    if (progressCallback) progressCallback(progress);
  }

  console.log('🧹 Limpiando chunks temporales...');
  for (const chunk of chunks) {
    await fs.unlink(chunk.path).catch(() => {});
  }

  const media = await waitForMediaCreation(uploadPath, token, 30, 10000);
  if (!media) {
    throw new Error('No se pudo encontrar el media después de subir los chunks');
  }
  return media;
}

// Función MEJORADA para descargar Y subir SIMULTÁNEAMENTE por chunks
async function downloadAndUploadSimultaneously(youtubeUrl, fileName, token, durationSec, downloadCallback, uploadCallback) {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB chunks
  const tempFile = path.join(DOWNLOADS_DIR, `temp_${Date.now()}.mp4`);
  
  console.log('🎬 Iniciando descarga y upload simultáneo...');
  
  // 1. Obtener el mejor formato 1080p disponible
  const formatInfo = await getBest1080pFormat(youtubeUrl, durationSec);
  const sizeFromYtdlp = await getFormatFileSize(youtubeUrl, formatInfo.format);
  
  // 2. Obtener upload token y media ID
  const estimatedSize = sizeFromYtdlp || (formatInfo.sizeBytes && formatInfo.sizeBytes > 0 ? formatInfo.sizeBytes : 0);
  if (!estimatedSize) {
    throw new Error('NO_FILESIZE');
  }
  console.log(`🔑 Obteniendo upload token de Mediastream (size=${Math.round(estimatedSize / (1024 * 1024))}MB)...`);
  const { uploadPath, mediaId } = await getUploadToken(fileName, estimatedSize, token);
  console.log(`✅ Upload configurado:`, {
    path: uploadPath.substring(0, 80) + '...',
    mediaId: mediaId || 'Se obtendrá después'
  });
  
  // 3. Iniciar descarga con yt-dlp en background
  console.log('📥 Iniciando descarga con yt-dlp en 1080p...');
  
  // Argumentos base - usando formato seleccionado
  const ytdlpArgs = [
    '-f', formatInfo.format,
    '--merge-output-format', 'mp4',
    '--no-part', // Escribir directamente al archivo final (sin .part temporal)
    '--buffer-size', '8K', // Buffer pequeño para escribir más frecuentemente
    '--no-check-certificates',
    '--no-playlist', // Solo el video, no playlist
    '--cookies-from-browser', 'chrome', // Usar cookies de Chrome para autenticación
    '--newline',
    '--progress'
  ];
  
  // Archivo de salida y URL
  ytdlpArgs.push('-o', tempFile);
  ytdlpArgs.push(youtubeUrl);
  
  console.log('\n' + '─'.repeat(80));
  console.log(`📂 Archivo temporal: ${tempFile}`);
  console.log(`🎬 Descargando: 1080p MP4 (Formato: ${formatInfo.format})`);
  console.log(`📦 Tamaño estimado: ${(estimatedSize / (1024 * 1024)).toFixed(2)}MB`);
  console.log(`🔧 Iniciando descarga y upload simultáneo...`);
  console.log('─'.repeat(80) + '\n');
  
  const downloadProcess = spawn('yt-dlp', ytdlpArgs);
  
  let downloadComplete = false;
  let downloadError = null;
  let lastDownloadProgress = 0;
  let errorOutput = '';
  let stdoutBuffer = '';
  
  // Monitorear progreso de descarga
  downloadProcess.stdout.on('data', (data) => {
    const output = data.toString();
    stdoutBuffer += output;
    
    // Buscar información del formato seleccionado
    if (output.includes('[info]') || output.includes('format')) {
      console.log(`ℹ️  ${output.trim()}`);
    }
    
    const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
    if (progressMatch) {
      const progress = parseFloat(progressMatch[1]);
      if (progress - lastDownloadProgress >= 5 || progress === 100) {
        lastDownloadProgress = progress;
        console.log(`📥 Descarga: ${progress}%`);
        if (downloadCallback) downloadCallback(progress);
      }
    }
  });
  
  downloadProcess.stderr.on('data', (data) => {
    const output = data.toString();
    errorOutput += output;
    
    // Mostrar información importante del stderr (que no sea error)
    if (output.includes('Downloading') || output.includes('format') || output.includes('resolution')) {
      console.log(`📊 ${output.trim()}`);
    }
  });
  
  downloadProcess.on('error', (error) => {
    console.error('❌ Error en proceso de descarga:', error.message);
    downloadError = error;
    downloadComplete = true;
  });
  
  downloadProcess.on('close', (code) => {
    downloadComplete = true;
    if (code !== 0 && !downloadError) {
      downloadError = new Error(errorOutput || `Descarga falló con código ${code}`);
    }
    console.log(downloadError ? `❌ Descarga falló` : '✅ Descarga completada');
  });
  
  // 3. Subir chunks mientras descarga (SIMULTÁNEO)
  let uploadedBytes = 0;
  let chunkNumber = 0;
  let lastUploadProgress = 0;
  
  console.log('🚀 Iniciando upload por chunks simultáneo...');
  
  return new Promise((resolve, reject) => {
    let checkCount = 0;
    
    const uploadInterval = setInterval(async () => {
      checkCount++;
      try {
        // Verificar si el archivo existe
        let fileSize = 0;
        let fileExists = false;
        
        try {
          const stats = await fs.stat(tempFile);
          fileSize = stats.size;
          fileExists = true;
        } catch {
          // Archivo no existe aún
          console.log(`⏳ Check #${checkCount}: Esperando que se cree el archivo... (descarga: ${downloadComplete ? 'completa' : 'en progreso'})`);
          
          if (downloadComplete && downloadError) {
            clearInterval(uploadInterval);
            reject(downloadError);
          }
          return;
        }
        
        // Calcular bytes pendientes de subir
        const bytesAvailable = fileSize - uploadedBytes;
        
        console.log(`🔍 Check #${checkCount}: Archivo=${(fileSize / 1024 / 1024).toFixed(2)}MB | Subido=${(uploadedBytes / 1024 / 1024).toFixed(2)}MB | Disponible=${(bytesAvailable / 1024 / 1024).toFixed(2)}MB | Descarga=${downloadComplete ? 'COMPLETA' : 'en progreso'}`);
        
        // Subir chunk si:
        // - Hay un chunk completo disponible (10MB+), O
        // - La descarga terminó y quedan bytes por subir
        const shouldUpload = bytesAvailable >= CHUNK_SIZE || 
                            (downloadComplete && bytesAvailable > 0);
        
        if (shouldUpload) {
          const nextChunkNumber = chunkNumber + 1;
          const chunkEnd = Math.min(uploadedBytes + CHUNK_SIZE, fileSize);
          const chunkSize = chunkEnd - uploadedBytes;
          
          console.log(`\n📤 === SUBIENDO CHUNK #${nextChunkNumber} ===`);
          console.log(`   Tamaño: ${(chunkSize / 1024 / 1024).toFixed(2)}MB`);
          console.log(`   Rango: bytes ${uploadedBytes}-${chunkEnd} de ${fileSize}`);
          console.log(`   Progreso: ${((chunkEnd / fileSize) * 100).toFixed(1)}%`);
          
          let uploaded = false;
          let attempts = 0;
          
          while (!uploaded && attempts < 3) {
            attempts++;
            try {
              // Leer solo el chunk necesario (más eficiente)
              const fileHandle = await fs.open(tempFile, 'r');
              const chunkBuffer = Buffer.alloc(chunkSize);
              await fileHandle.read(chunkBuffer, 0, chunkSize, uploadedBytes);
              await fileHandle.close();
              
              console.log(`   ✓ Chunk leído del disco (intento ${attempts}/3)`);
              
              // Preparar y subir chunk
              const formData = new FormData();
              formData.append('file', chunkBuffer, {
                filename: fileName,
                contentType: 'application/octet-stream'
              });
              formData.append('name', fileName);
              
              console.log(`   ⬆️  Subiendo a Mediastream...`);
              
              await axios.post(
                `${uploadPath}?resumableChunkNumber=${nextChunkNumber}`,
                formData,
                {
                  headers: { ...formData.getHeaders() },
                  maxBodyLength: Infinity,
                  timeout: 180000
                }
              );
              
              uploaded = true;
              chunkNumber = nextChunkNumber;
              uploadedBytes = chunkEnd;
              console.log(`   ✅ Chunk #${chunkNumber} SUBIDO exitosamente\n`);
              
              // Actualizar progreso de upload
              if (downloadComplete && fileSize > 0) {
                const uploadProgress = Math.round((uploadedBytes / fileSize) * 100);
                if (uploadProgress - lastUploadProgress >= 5 || uploadProgress === 100) {
                  lastUploadProgress = uploadProgress;
                  if (uploadCallback) uploadCallback(uploadProgress);
                }
              }
            } catch (uploadError) {
              console.error(`   ❌ Error subiendo chunk #${nextChunkNumber} (intento ${attempts}/3):`, uploadError.message);
              if (attempts >= 3) {
                throw new Error(`Fallo al subir chunk #${nextChunkNumber} después de 3 intentos`);
              }
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        } else if (fileExists) {
          console.log(`⏸️  Esperando más datos (necesita ${(CHUNK_SIZE / 1024 / 1024).toFixed(2)}MB, disponible ${(bytesAvailable / 1024 / 1024).toFixed(2)}MB)...`);
        }
        
        // Verificar si terminamos TODO
        if (downloadComplete && uploadedBytes >= fileSize && fileSize > 0) {
          clearInterval(uploadInterval);
          
          if (downloadError) {
            reject(downloadError);
          } else {
            console.log(`\n🎉 ¡TODOS LOS CHUNKS SUBIDOS!`);
            console.log(`   Total de chunks: ${chunkNumber}`);
            console.log(`   Tamaño total: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
            console.log(`   Checks realizados: ${checkCount}`);
            console.log(`   ✅ Formato: MP4 1080p (1920x1080)`);
            console.log(`   ✅ Codec: H.264/AVC + AAC Audio`);
            
            // Esperar creación automática del media (según flujo oficial)
            console.log('\n📝 Esperando creación automática del media...');
            
            (async () => {
              const media = await waitForMediaCreation(uploadPath, token, 30, 10000);
              if (media?._id) {
                resolve({ uploadPath, tempFile, mediaId: media._id });
              } else {
                console.error('❌ No se pudo encontrar media creado');
                resolve({ uploadPath, tempFile, mediaId: null });
              }
            })();
          }
        }
        
      } catch (error) {
        console.error('❌ Error en loop de upload:', error.message);
        clearInterval(uploadInterval);
        reject(error);
      }
    }, 2000); // Revisar cada 2 segundos (antes 3s)
  });
}

// Función para descargar video de YouTube con progreso (FALLBACK sin streaming)
async function downloadYouTubeVideo(url, outputPath, progressCallback) {
  // Formatos en orden de preferencia - 1080p FORZADO
  const formatOptions = [
    'bestvideo[height=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]',
    'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]',
    'bestvideo+bestaudio/best',
    'best',
  ];
  
  for (let i = 0; i < formatOptions.length; i++) {
    const format = formatOptions[i];
    const command = `yt-dlp -f "${format}" --merge-output-format mp4 --no-check-certificates --no-playlist --newline --progress -o "${outputPath}" "${url}"`;
    
    try {
      console.log(`Intentando descargar con formato: ${format}`);
      
      return await new Promise((resolve, reject) => {
        const process = exec(command, { 
          maxBuffer: 1024 * 1024 * 100
        });
        
        let lastProgress = '';
        
        process.stdout.on('data', (data) => {
          const output = data.toString();
          console.log(output);
          
          const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (progressMatch && progressCallback) {
            const progress = progressMatch[1];
            if (progress !== lastProgress) {
              lastProgress = progress;
              progressCallback(progress);
            }
          }
        });
        
        process.stderr.on('data', (data) => {
          console.log('stderr:', data.toString());
        });
        
        process.on('close', (code) => {
          if (code === 0) {
            console.log('Descarga exitosa');
            resolve(true);
          } else {
            reject(new Error(`Proceso terminó con código ${code}`));
          }
        });
        
        process.on('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.log(`Formato ${format} falló, intentando siguiente...`);
      
      if (i === formatOptions.length - 1) {
        console.error('Error downloading video:', error);
        throw new Error(`No se pudo descargar el video. Intenta actualizar yt-dlp con: yt-dlp -U`);
      }
    }
  }
  
  throw new Error('No se pudo descargar el video con ningún formato');
}

// Función para obtener upload token de Mediastream
async function getUploadToken(fileName, fileSize, token) {
  try {
    console.log(`📝 Solicitando upload token para: ${fileName} (${fileSize} bytes)`);
    
    const response = await axios.get(`${MEDIASTREAM_API}/media/upload`, {
      params: {
        file_name: fileName,
        size: fileSize,
        token: token
      },
      headers: {
        'X-Api-Token': token
      }
    });
    
    console.log('📥 Respuesta upload token completa:', JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'OK' && response.data.data) {
      const data = response.data.data;
      const uploadPath = data.server;
      
      // Extraer el media ID si está disponible
      // Puede venir en data._id, data.id, data.media_id, o en el uploadPath
      let mediaId = data._id || data.id || data.media_id || null;
      
      // No extraer mediaId desde uploadPath (no es el ID del media)
      
      console.log(`✅ Upload configurado:`, {
        uploadPath: uploadPath?.substring(0, 80) + '...',
        mediaId: mediaId || 'No disponible aún'
      });
      
      return { uploadPath, mediaId };
    } else {
      console.error('❌ Respuesta inválida:', response.data);
      throw new Error('No se pudo obtener upload token');
    }
  } catch (error) {
    console.error('❌ Error obteniendo upload token:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
}

// Función para verificar si un chunk ya fue subido
async function checkChunkExists(uploadPath, chunkNumber) {
  try {
    const response = await axios.get(
      `${uploadPath}?resumableChunkNumber=${chunkNumber}`,
      { validateStatus: (status) => status === 200 || status === 204 }
    );
    
    // 204 = No Content = chunk no existe
    // 200 = OK = chunk ya existe
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Función para subir un archivo por chunks a Mediastream
async function uploadToMediastreamChunked(filePath, fileName, token, progressCallback) {
  const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
  
  try {
    const stats = await fs.stat(filePath);
    const fileSize = stats.size;
    const fileSizeInMB = fileSize / (1024 * 1024);
    
    console.log(`📦 Preparando upload por chunks: ${fileSizeInMB.toFixed(2)} MB`);
    
    // 1. Obtener upload token y media ID
    const { uploadPath, mediaId: initialMediaId } = await getUploadToken(fileName, fileSize, token);
    console.log(`✅ Upload token obtenido. Media ID: ${initialMediaId || 'No disponible aún'}`);
    
    // 2. Calcular número de chunks
    const totalChunks = Math.ceil(fileSize / CHUNK_SIZE);
    console.log(`📊 Total de chunks: ${totalChunks} (${CHUNK_SIZE / 1024 / 1024}MB cada uno)`);
    
    // 3. Leer archivo completo
    const fileBuffer = await fs.readFile(filePath);
    
    // 4. Subir cada chunk
    for (let chunkNumber = 1; chunkNumber <= totalChunks; chunkNumber++) {
      const start = (chunkNumber - 1) * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, fileSize);
      const chunkBuffer = fileBuffer.slice(start, end);
      const chunkSizeMB = (chunkBuffer.length / 1024 / 1024).toFixed(2);
      
      console.log(`\n📤 Chunk ${chunkNumber}/${totalChunks} (${chunkSizeMB} MB)`);
      
      // Verificar si el chunk ya existe
      const exists = await checkChunkExists(uploadPath, chunkNumber);
      
      if (exists) {
        console.log(`✓ Chunk ${chunkNumber} ya existe, saltando...`);
        const progress = Math.round((chunkNumber / totalChunks) * 100);
        if (progressCallback) progressCallback(progress);
        continue;
      }
      
      // Preparar FormData para el chunk
      const formData = new FormData();
      formData.append('file', chunkBuffer, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });
      formData.append('name', fileName);
      
      // Subir chunk con reintentos
      let uploaded = false;
      let retries = 3;
      
      while (!uploaded && retries > 0) {
        try {
          const uploadResponse = await axios.post(
            `${uploadPath}?resumableChunkNumber=${chunkNumber}`,
            formData,
            {
              headers: {
                ...formData.getHeaders()
              },
              maxBodyLength: Infinity,
              timeout: 120000
            }
          );
          
          console.log(`✅ Chunk ${chunkNumber}/${totalChunks} subido: ${uploadResponse.data}`);
          uploaded = true;
          
        } catch (error) {
          retries--;
          console.error(`❌ Error subiendo chunk ${chunkNumber}:`, {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
          });
          
          if (retries > 0) {
            console.log(`⚠️  Reintentando... (${retries} intentos restantes)`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          } else {
            throw new Error(`Error subiendo chunk ${chunkNumber}`);
          }
        }
      }
      
      // Actualizar progreso
      const progress = Math.round((chunkNumber / totalChunks) * 100);
      if (progressCallback) progressCallback(progress);
    }
    
    console.log('\n🎉 Todos los chunks subidos exitosamente');
    console.log(`   Total de chunks: ${totalChunks}`);
    console.log(`   Tamaño del archivo: ${(fileSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   ✅ Formato: MP4 1080p (1920x1080)`);
    console.log(`   ✅ Codec: H.264/AVC + AAC Audio`);
    
    // Esperar creación automática del media (según flujo oficial)
    console.log('\n📝 Esperando creación automática del media...');
    const media = await waitForMediaCreation(uploadPath, token, 30, 10000);
    if (media) {
      console.log('✅ Media creado exitosamente!');
      console.log(`   Media ID: ${media._id}`);
      console.log(`   Title: ${media.title}`);
      return media;
    }
    throw new Error('No se pudo encontrar el media después de subir los chunks');
    
  } catch (error) {
    console.error('❌ Error en upload por chunks:', error.message);
    throw error;
  }
}

// Función para subir video a Mediastream con streaming y retry (FALLBACK)
async function uploadToMediastream(filePath, title, token, progressCallback) {
  const MAX_RETRIES = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const stats = await fs.stat(filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);
      const fileSizeInGB = fileSizeInMB / 1024;
      
      console.log(`Tamaño del archivo: ${fileSizeInMB.toFixed(2)} MB (${fileSizeInGB.toFixed(2)} GB)`);
      
      // Advertencia para archivos muy grandes
      if (fileSizeInMB > 1024) { // Mayor a 1GB
        console.warn(`⚠️ ADVERTENCIA: Archivo muy grande (${fileSizeInGB.toFixed(2)} GB). Esto puede fallar.`);
      }
      
      if (attempt > 1) {
        console.log(`Intento ${attempt} de ${MAX_RETRIES}...`);
      }
      
      const fileName = path.basename(filePath);
      
      // Crear un stream del archivo
      const fileStream = fsSync.createReadStream(filePath, {
        highWaterMark: 1024 * 1024 // 1MB chunks
      });
      
      // Crear FormData con stream
      const formData = new FormData();
      formData.append('token', token);
      formData.append('title', title);
      formData.append('file', fileStream, {
        filename: fileName,
        contentType: 'video/mp4',
        knownLength: stats.size
      });
      formData.append('is_published', 'true');
      
      console.log(`Iniciando upload a Mediastream (intento ${attempt})...`);
      
      // Variables para tracking de progreso
      let uploadedBytes = 0;
      const totalBytes = stats.size;
      let lastProgressUpdate = 0;
      
      // Monitorear progreso del stream
      fileStream.on('data', (chunk) => {
        uploadedBytes += chunk.length;
        const percentCompleted = Math.round((uploadedBytes * 100) / totalBytes);
        
        // Actualizar progreso cada 5% para no saturar
        if (percentCompleted >= lastProgressUpdate + 5 || percentCompleted === 100) {
          lastProgressUpdate = percentCompleted;
          if (progressCallback) {
            progressCallback(percentCompleted);
          }
        }
      });
      
      // Subir archivo usando stream con axios
      const uploadResponse = await axios.post(`${MEDIASTREAM_API}/media`, formData, {
        headers: {
          ...formData.getHeaders(),
          'Connection': 'keep-alive',
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 3600000, // 60 minutos
        decompress: true, // Permitir descompresión automática de respuestas gzip
      });
      
      console.log('📥 Respuesta de Mediastream:', JSON.stringify(uploadResponse.data, null, 2));
      
      if (uploadResponse.data.status === 'OK') {
        console.log('✅ Upload completado exitosamente');
        
        // La respuesta puede tener los datos en diferentes formatos
        if (uploadResponse.data.data) {
          // Si data es un array
          if (Array.isArray(uploadResponse.data.data) && uploadResponse.data.data.length > 0) {
            return uploadResponse.data.data[0];
          }
          // Si data es un objeto directamente
          else if (typeof uploadResponse.data.data === 'object') {
            return uploadResponse.data.data;
          }
        }
        
        throw new Error('Respuesta de Mediastream no contiene datos del media');
      } else {
        throw new Error(`Mediastream respondió con status: ${uploadResponse.data.status}`);
      }
      
    } catch (error) {
      lastError = error;
      console.error(`Error en intento ${attempt}:`, error.response?.data || error.message);
      
      // Si es error 413, no reintentar
      if (error.response?.status === 413) {
        const stats = await fs.stat(filePath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        throw new Error(
          `El archivo es demasiado grande (${sizeInMB} MB). ` +
          `El servidor de Mediastream rechaza el archivo. ` +
          `Posibles soluciones:\n` +
          `- Usar un video más corto\n` +
          `- Subir manualmente via FTP (si disponible)\n` +
          `- Contactar soporte de Mediastream para aumentar el límite`
        );
      }
      
      // Si es el último intento, lanzar error
      if (attempt === MAX_RETRIES) {
        throw new Error(`Error subiendo a Mediastream después de ${MAX_RETRIES} intentos: ${error.response?.data?.data || error.message}`);
      }
      
      // Esperar antes de reintentar (backoff exponencial)
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      console.log(`Esperando ${waitTime/1000}s antes de reintentar...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
  
  throw lastError;
}

// Función para obtener detalles del media
async function getMediaDetails(mediaId, token) {
  try {
    console.log(`🔍 Obteniendo detalles del media ${mediaId}...`);
    
    // Según la API docs, el token va como query parameter, NO en headers
    const response = await axios.get(`${MEDIASTREAM_API}/media/${mediaId}`, {
      params: {
        token: token
      }
    });
    
    console.log(`📥 Respuesta de getMediaDetails:`, JSON.stringify(response.data, null, 2));
    
    if (response.data.status === 'OK' && response.data.data) {
      const mediaData = Array.isArray(response.data.data) ? response.data.data[0] : response.data.data;
      console.log(`✅ Media obtenido: ${mediaData._id}`);
      return mediaData;
    }
    
    console.log(`⚠️  Media no encontrado o respuesta inesperada`);
    return null;
  } catch (error) {
    console.error('Error getting media details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return null;
  }
}

async function getMediaThumbnails(mediaId, token) {
  try {
    const response = await axios.get(
      `${MEDIASTREAM_API}/media/${mediaId}/thumbs`,
      { params: { token: token } }
    );
    if (response.data?.status === 'OK' && Array.isArray(response.data.data)) {
      return response.data.data[0]?.thumbnails || [];
    }
    return [];
  } catch (error) {
    console.warn('⚠️  Error obteniendo thumbnails:', error.message);
    return [];
  }
}

async function setDefaultThumbnail(mediaId, thumbId, token) {
  try {
    const form = new URLSearchParams({ token: token });
    await axios.post(
      `${MEDIASTREAM_API}/media/${mediaId}/thumb/${thumbId}`,
      form,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log(`✅ Thumbnail por defecto seteado: ${thumbId}`);
  } catch (error) {
    console.warn('⚠️  Error seteando thumbnail por defecto:', error.message);
  }
}

async function uploadThumbnailAsCover(mediaId, token, thumbnailPath) {
  const formData = new FormData();
  formData.append('token', token);
  const thumbnailStream = fsSync.createReadStream(thumbnailPath);
  formData.append('cover', thumbnailStream, {
    filename: path.basename(thumbnailPath),
    contentType: 'image/jpeg'
  });
  await axios.post(
    `${MEDIASTREAM_API}/media/${mediaId}`,
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        'X-Api-Token': token
      },
      maxBodyLength: Infinity
    }
  );
}

// Función MEJORADA para actualizar metadata del media con toda la info de YouTube
async function updateMediaMetadata(mediaId, metadata, token, thumbnailPaths) {
  try {
    console.log(`📝 Actualizando metadata del media ${mediaId}...`);
    
    const formData = new FormData();
    formData.append('token', token);
    
    // Información básica
    if (metadata.title) formData.append('title', metadata.title);
    if (metadata.description) formData.append('description', metadata.description);
    
    // Tags
    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach(tag => {
        if (tag) formData.append('tags[]', tag);
      });
    }
    
    // Custom fields para metadata adicional de YouTube
    const customFields = {};
    
    if (metadata.author) {
      customFields.youtube_channel = metadata.author;
    }
    
    if (metadata.videoId) {
      customFields.youtube_id = metadata.videoId;
      customFields.youtube_url = `https://www.youtube.com/watch?v=${metadata.videoId}`;
    }
    
    if (metadata.uploadDate) {
      customFields.youtube_upload_date = metadata.uploadDate;
    }
    
    if (metadata.viewCount) {
      customFields.youtube_views = metadata.viewCount.toString();
    }
    
    if (metadata.duration) {
      customFields.youtube_duration = metadata.duration.toString();
    }
    
    // Agregar custom fields si existen
    if (Object.keys(customFields).length > 0) {
      formData.append('custom_fields', JSON.stringify(customFields));
    }
    
    // Subir thumbnail principal si está disponible
    if (thumbnailPaths && thumbnailPaths.length > 0) {
      try {
        const thumbnailPath = thumbnailPaths[0];
        const thumbnailExists = await fs.access(thumbnailPath).then(() => true).catch(() => false);
        if (thumbnailExists) {
          const thumbnailStream = fsSync.createReadStream(thumbnailPath);
          formData.append('cover', thumbnailStream, {
            filename: path.basename(thumbnailPath),
            contentType: 'image/jpeg'
          });
          console.log('📸 Incluyendo thumbnail principal en metadata...');
        }
      } catch (error) {
        console.warn('⚠️  No se pudo incluir thumbnail principal:', error.message);
      }
    }
    
    const response = await axios.post(
      `${MEDIASTREAM_API}/media/${mediaId}`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'X-Api-Token': token
        },
        maxBodyLength: Infinity
      }
    );
    
    console.log('✅ Metadata completa actualizada:', {
      title: metadata.title?.substring(0, 50),
      description: metadata.description ? `${metadata.description.length} chars` : 'N/A',
      tags: metadata.tags?.length || 0,
      thumbnails: thumbnailPaths?.length || 0,
      customFields: Object.keys(customFields).length
    });

    // Subir thumbnails adicionales (si existen)
    if (thumbnailPaths && thumbnailPaths.length > 1) {
      console.log(`📸 Subiendo ${thumbnailPaths.length - 1} thumbnails adicionales...`);
      for (let i = 1; i < thumbnailPaths.length; i++) {
        try {
          await uploadThumbnailAsCover(mediaId, token, thumbnailPaths[i]);
        } catch (error) {
          console.warn(`⚠️  Error subiendo thumbnail ${i + 1}:`, error.message);
        }
      }

      // Obtener thumbnails y setear el primero como predeterminado
      const thumbs = await getMediaThumbnails(mediaId, token);
      if (thumbs.length > 0) {
        await setDefaultThumbnail(mediaId, thumbs[0]._id, token);
      }
    }
    
    return response.data;
  } catch (error) {
    console.error('⚠️  Error actualizando metadata:', error.response?.data || error.message);
    return null;
  }
}

// Función para monitorear el estado de procesamiento del media
async function monitorMediaProcessing(mediaId, token, statusCallback) {
  const maxAttempts = 60; // 10 minutos máximo (60 * 10s)
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    attempts++;
    
    const media = await getMediaDetails(mediaId, token);
    
    if (!media) {
      console.log(`🔎 Intento ${attempts}/${maxAttempts} - Media no encontrado aún`);
      if (statusCallback) {
        statusCallback({
          status: 'waiting',
          message: `Esperando que se cree el media... (${attempts}/${maxAttempts})`
        });
      }
    } else {
      const hasRenditions = media.meta && media.meta.length > 0;
      const duration = media.duration || 0;
      const originalMeta = media.meta?.find((m) => m.is_original) || null;
      const isUploaded = typeof media.is_uploaded === 'boolean'
        ? media.is_uploaded
        : (originalMeta ? (originalMeta.file_size > 0 || originalMeta.status !== 'NEW') : false);
      
      console.log(`📊 Estado del media:`, {
        uploaded: isUploaded,
        initialized: media.is_initialized,
        published: media.is_published,
        duration: duration,
        renditions: media.meta?.length || 0,
        original_status: originalMeta?.status || 'N/A',
        original_size: originalMeta?.file_size || 0
      });
      
      if (statusCallback) {
        statusCallback({
          status: hasRenditions ? 'ready' : 'processing',
          message: hasRenditions 
            ? `Video listo - ${media.meta.length} calidades disponibles (${duration}s)`
            : `Procesando video... (${attempts * 10}s transcurridos)`,
          media: media
        });
      }
      
      // Si tiene rendiciones, está listo
      if (hasRenditions) {
        console.log('🎉 Video completamente procesado');
        return media;
      }
    }
    
    // Esperar 10 segundos antes de verificar de nuevo
    await new Promise(resolve => setTimeout(resolve, 10000));
  }
  
  throw new Error('Timeout esperando que el video se procese');
}

// Función para generar embed HTML
function generateEmbedCode(mediaId) {
  return `<iframe src="https://mdstrm.com/embed/${mediaId}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`;
}

// Función para generar URL del player
function generatePlayerUrl(mediaId) {
  return `https://mdstrm.com/embed/${mediaId}`;
}

// Endpoint principal
app.post('/api/upload', async (req, res) => {
  const { youtubeUrl, mediastreamToken } = req.body;
  
  if (!youtubeUrl) {
    return res.status(400).json({ error: 'URL de YouTube es requerida' });
  }
  
  // Usar el token del request o el del .env
  const token = mediastreamToken || MEDIASTREAM_TOKEN;
  
  if (!token) {
    return res.status(400).json({ error: 'Token de Mediastream es requerido' });
  }
  
  const timestamp = Date.now();
  const outputPath = path.join(DOWNLOADS_DIR, `video_${timestamp}.mp4`);
  
  let tempFile = null;
  
  try {
    // 1. Obtener metadata de YouTube
    res.write(JSON.stringify({ 
      status: 'downloading', 
      message: 'Obteniendo información del video...', 
      progress: 0 
    }) + '\n');
    
    const ytMetadata = await getYouTubeMetadata(youtubeUrl);
    
    if (ytMetadata) {
      res.write(JSON.stringify({ 
        status: 'downloading', 
        message: `Descargando: ${ytMetadata.title.substring(0, 50)}...`, 
        progress: 0 
      }) + '\n');
    }
    
    // 2. Descargar thumbnail de YouTube
    const thumbnailPrefix = ytMetadata ? path.join(DOWNLOADS_DIR, `thumb_${timestamp}`) : null;
    const thumbnailPaths = (ytMetadata && thumbnailPrefix)
      ? await downloadThumbnails(ytMetadata.thumbnails || [], thumbnailPrefix, 5)
      : [];
    
    // 3. Descargar completo y subir por chunks (igual al bash)
    const fileName = ytMetadata 
      ? `${ytMetadata.title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)}_${timestamp}.mp4`
      : `youtube_${timestamp}.mp4`;
    
    let lastDownloadProgress = -1;
    let lastUploadProgress = -1;
    
    res.write(JSON.stringify({ 
      status: 'downloading', 
      message: 'Descargando completo...', 
      progress: 0 
    }) + '\n');
    await downloadYouTubeVideo(youtubeUrl, outputPath, (progress) => {
      res.write(JSON.stringify({ 
        status: 'downloading', 
        message: `Descargando... ${progress}%`, 
        progress: progress 
      }) + '\n');
    });

    res.write(JSON.stringify({ 
      status: 'uploading', 
      message: 'Subiendo por chunks (bash)...', 
      progress: 0 
    }) + '\n');
    let mediaData = await uploadToMediastreamChunkedLikeBash(outputPath, fileName, token, (progress) => {
      res.write(JSON.stringify({ 
        status: 'uploading', 
        message: `Subiendo chunks... ${progress}%`, 
        progress: progress 
      }) + '\n');
    });

    let uploadMediaId = mediaData?._id || null;
    tempFile = outputPath;
    
    res.write(JSON.stringify({ 
      status: 'processing', 
      message: 'Upload completado, obteniendo media...', 
      progress: 100 
    }) + '\n');
    
    // Si ya tenemos un ID, intentar traer detalles
    if (!mediaData && uploadMediaId) {
      console.log(`✅ Media ID obtenido: ${uploadMediaId}`);
      
      res.write(JSON.stringify({ 
        status: 'processing', 
        message: 'Obteniendo detalles del media...', 
        progress: 55 
      }) + '\n');
      
      // El media ya fue creado, esperar un poco y obtener sus detalles
      console.log('⏳ Esperando 3 segundos para obtener detalles...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Intentar obtener hasta 5 veces
      for (let attempt = 1; attempt <= 5; attempt++) {
        console.log(`🔎 Obteniendo detalles del media (intento ${attempt}/5)...`);
        
        mediaData = await getMediaDetails(uploadMediaId, token);
        
        if (mediaData) {
          console.log(`✅ Media obtenido exitosamente: ${mediaData._id}`);
          break;
        }
        
        if (attempt < 5) {
          console.log(`⏳ Esperando 2 segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    if (!mediaData) {
      console.error('❌ No se pudieron obtener los detalles del media');
      
      // Crear objeto básico con el ID que tenemos
      if (uploadMediaId) {
        console.log(`⚠️  Usando media ID sin detalles completos: ${uploadMediaId}`);
        mediaData = {
          _id: uploadMediaId,
          title: fileName,
          protocols: {
            hls: `http://mdstrm.com/video/${uploadMediaId}.m3u8`
          }
        };
      } else {
        throw new Error('No se pudo crear el media en Mediastream');
      }
    }
    
    // 5. Actualizar metadata del video con TODA la info de YouTube
    if (ytMetadata) {
      res.write(JSON.stringify({ 
        status: 'processing', 
        message: 'Actualizando metadata completa (título, descripción, thumbnail, fechas)...', 
        progress: 60 
      }) + '\n');
      
      // Preparar tags incluyendo canal de YouTube
      const tags = ['youtube'];
      if (ytMetadata.author && ytMetadata.author.trim()) {
        tags.push(ytMetadata.author.trim());
      }
      
      // Actualizar con toda la metadata de YouTube
      await updateMediaMetadata(
        mediaData._id, 
        {
          title: ytMetadata.title,
          description: ytMetadata.description,
          author: ytMetadata.author,
          videoId: ytMetadata.videoId,
          uploadDate: ytMetadata.uploadDate,
          viewCount: ytMetadata.viewCount,
          duration: ytMetadata.duration,
          tags: tags
        }, 
        token,
        thumbnailPaths // Incluir thumbnails
      );
      
      console.log('✅ Metadata completa actualizada:', {
        title: ytMetadata.title.substring(0, 40),
        channel: ytMetadata.author,
        views: ytMetadata.viewCount,
        uploadDate: ytMetadata.uploadDate
      });
    }
    
    // 6. Monitorear procesamiento del video
    res.write(JSON.stringify({ 
      status: 'processing', 
      message: 'Esperando que se procese el video...', 
      progress: 70 
    }) + '\n');
    
    const processedMedia = await monitorMediaProcessing(mediaData._id, token, (status) => {
      res.write(JSON.stringify({ 
        status: 'processing', 
        message: status.message, 
        progress: 70 + Math.min(status.status === 'ready' ? 30 : 20, 30)
      }) + '\n');
    });
    
    // 7. Generar resultado final
    const finalMedia = processedMedia || mediaData;
    
    const statusMessage = finalMedia.meta && finalMedia.meta.length > 0
      ? '🎉 Video subido y procesado exitosamente'
      : '✅ Video subido - Procesamiento en curso';
    
    const result = {
      status: 'success',
      message: statusMessage,
      data: {
        mediaId: finalMedia._id,
        title: finalMedia.title,
        playerUrl: generatePlayerUrl(finalMedia._id),
        embedCode: generateEmbedCode(finalMedia._id),
        mediaUrl: `https://mdstrm.com/video/${finalMedia._id}`,
        directLink: `https://streammanager.co/media/${finalMedia._id}`,
        youtubeInfo: ytMetadata ? {
          originalTitle: ytMetadata.title,
          author: ytMetadata.author,
          duration: `${Math.floor(ytMetadata.duration / 60)}:${(ytMetadata.duration % 60).toString().padStart(2, '0')}`
        } : null,
        processingStatus: {
          uploaded: finalMedia.is_uploaded || false,
          initialized: finalMedia.is_initialized || false,
          published: finalMedia.is_published || false,
          duration: finalMedia.duration || 0,
          renditions: finalMedia.meta?.length || 0,
          hasHLS: !!finalMedia.protocols?.hls
        }
      }
    };
    
    res.write(JSON.stringify(result) + '\n');
    res.end();
    
    // Mantener el MP4 temporal para análisis
    if (tempFile) {
      console.log(`📁 MP4 temporal guardado: ${tempFile}`);
    }
    if (thumbnailPaths && thumbnailPaths.length > 0) {
      for (const p of thumbnailPaths) {
        await fs.unlink(p).catch(() => {});
      }
    }
    await fs.unlink(outputPath).catch(() => {});
    
  } catch (error) {
    console.error('Error en el proceso:', error);
    res.write(JSON.stringify({ 
      status: 'error', 
      message: error.message 
    }) + '\n');
    res.end();
    
    // Limpiar archivo temporal en caso de error
    await fs.unlink(outputPath).catch(() => {});
  }
});

// Endpoint para verificar estado del servidor
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok',
    hasToken: !!MEDIASTREAM_TOKEN,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Token configurado: ${MEDIASTREAM_TOKEN ? '✅ Sí' : '❌ No'}`);
  console.log(`\nAsegúrate de tener yt-dlp instalado:`);
  console.log(`   brew install yt-dlp    (macOS)`);
  console.log(`   pip install yt-dlp     (otros sistemas)\n`);
});
