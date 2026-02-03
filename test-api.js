require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const token = process.env.MEDIASTREAM_TOKEN;
const MEDIASTREAM_API = 'https://platform.mediastre.am/api';

async function testMediastreamUpload() {
  console.log('🧪 PROBANDO API DE MEDIASTREAM\n');
  
  if (!token) {
    console.error('❌ No hay token configurado en .env');
    return;
  }
  
  console.log('✅ Token configurado');
  console.log('Token:', token.substring(0, 10) + '...\n');
  
  // Crear un archivo de prueba pequeño simulando un video
  const testFile = path.join(__dirname, 'test.mp4');
  fs.writeFileSync(testFile, 'fake video content for mediastream upload test');
  const fileSize = fs.statSync(testFile).size;
  const fileName = 'test.mp4';
  
  console.log('📁 Archivo de prueba creado:', fileName);
  console.log('   Tamaño:', fileSize, 'bytes\n');
  
  try {
    // PASO 1: Obtener upload token
    console.log('📝 PASO 1: Solicitar upload token...');
    const uploadTokenResponse = await axios.get(`${MEDIASTREAM_API}/media/upload`, {
      params: {
        file_name: fileName,
        size: fileSize,
        token: token
      }
    });
    
    console.log('✅ Respuesta upload token:');
    console.log(JSON.stringify(uploadTokenResponse.data, null, 2));
    
    if (uploadTokenResponse.data.status !== 'OK') {
      console.error('❌ Error obteniendo upload token');
      return;
    }
    
    const uploadData = uploadTokenResponse.data.data;
    const uploadPath = uploadData.server;
    const mediaId = uploadData._id || uploadData.id || null;
    
    console.log('\n📍 Upload path:', uploadPath);
    console.log('📍 Media ID:', mediaId || 'No disponible');
    
    // PASO 2: Subir el archivo en chunks
    console.log('\n📤 PASO 2: Subir archivo en chunks...');
    
    const fileBuffer = fs.readFileSync(testFile);
    const chunkSize = Math.ceil(fileSize / 2); // Dividir en 2 chunks
    
    for (let chunkNum = 1; chunkNum <= 2; chunkNum++) {
      const start = (chunkNum - 1) * chunkSize;
      const end = Math.min(start + chunkSize, fileSize);
      const chunk = fileBuffer.slice(start, end);
      
      console.log(`\n   Subiendo chunk ${chunkNum}...`);
      console.log(`   Bytes: ${start}-${end} (${chunk.length} bytes)`);
      
      const formData = new FormData();
      formData.append('file', chunk, {
        filename: fileName,
        contentType: 'application/octet-stream'
      });
      formData.append('name', fileName);
      
      const uploadUrl = `${uploadPath}?resumableChunkNumber=${chunkNum}`;
      console.log(`   URL: ${uploadUrl}`);
      
      try {
        const chunkResponse = await axios.post(
          uploadUrl,
          formData,
          {
            headers: { ...formData.getHeaders() },
            maxBodyLength: Infinity
          }
        );
        
        console.log(`   ✅ Chunk ${chunkNum} subido`);
        console.log('   Respuesta:', JSON.stringify(chunkResponse.data, null, 2));
      } catch (error) {
        console.error(`   ❌ Error subiendo chunk ${chunkNum}:`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    }
    
    // PASO 3: Intentar llamada final (si es necesaria)
    console.log('\n📝 PASO 3: Intentando llamada final...');
    try {
      const finalFormData = new FormData();
      finalFormData.append('name', fileName);
      
      const finalResponse = await axios.post(
        uploadPath,
        finalFormData,
        {
          headers: { ...finalFormData.getHeaders() },
          maxBodyLength: Infinity
        }
      );
      
      console.log('✅ Llamada final exitosa');
      console.log('Respuesta:', JSON.stringify(finalResponse.data, null, 2));
    } catch (error) {
      console.log('⚠️  Llamada final falló (puede ser normal):');
      console.log({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // PASO 4: Crear el media con POST /api/media
    console.log('\n📝 PASO 4: Crear media con POST /api/media...');
    try {
      const createMediaResponse = await axios.post(
        `${MEDIASTREAM_API}/media`,
        new URLSearchParams({
          token: token,
          title: fileName,
          is_published: 'true'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      
      console.log('✅ Media creado exitosamente!');
      console.log('Respuesta:', JSON.stringify(createMediaResponse.data, null, 2));
      
      const createdMedia = createMediaResponse.data.data?.[0];
      if (createdMedia) {
        console.log('\n🎉 MEDIA CREADO:');
        console.log('   ID:', createdMedia._id);
        console.log('   Title:', createdMedia.title);
        console.log('   Published:', createdMedia.is_published);
      }
    } catch (error) {
      console.error('❌ Error creando media:');
      console.error({
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }
    
    // PASO 5: Si tenemos mediaId del token, intentar obtenerlo
    if (mediaId) {
      console.log(`\n🔍 PASO 5: Obtener detalles del media ${mediaId}...`);
      
      // Esperar un poco
      await new Promise(r => setTimeout(r, 5000));
      
      try {
        const mediaDetailsResponse = await axios.get(
          `${MEDIASTREAM_API}/media/${mediaId}`,
          {
            params: { token: token }
          }
        );
        
        console.log('✅ Media obtenido:');
        console.log(JSON.stringify(mediaDetailsResponse.data, null, 2));
      } catch (error) {
        console.error('❌ Error obteniendo media:');
        console.error({
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
      }
    }
    
    // Limpiar
    fs.unlinkSync(testFile);
    console.log('\n🧹 Archivo de prueba eliminado');
    
  } catch (error) {
    console.error('\n❌ ERROR EN LA PRUEBA:');
    console.error({
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testMediastreamUpload();
