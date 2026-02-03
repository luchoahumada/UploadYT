# YouTube to Mediastream Uploader

Aplicación web avanzada que descarga videos de YouTube en máxima calidad y los sube automáticamente a Mediastream Platform usando upload por chunks.

## ✨ Características

### 🚀 Sistema de Upload Optimizado

- **Descarga completa + upload por chunks**: Primero descarga el MP4 y luego sube en partes
- **Chunks de 10MB**: Sube el video en partes pequeñas para mayor estabilidad
- **Progreso en tiempo real**: Muestra progreso de descarga y luego de upload
- **Sin límites de tamaño**: Soporta videos de cualquier tamaño (GB, horas, 4K, 8K)

### 📝 Metadata Completa de YouTube → Mediastream
- ✅ **Título**: Copia el título original del video
- ✅ **Descripción**: Copia la descripción completa
- ✅ **Thumbnail/Cover**: Descarga y sube la miniatura del video
- ✅ **Fecha de publicación**: Guarda cuándo se publicó en YouTube
- ✅ **Video ID**: Guarda el ID de YouTube y URL original
- ✅ **Tags**: Agrega tags automáticos (youtube, canal)

### 🎬 Calidad de Video
- **Máxima calidad disponible**: 1080p, 4K, 8K, etc.
- **Formato MP4**: Siempre descarga en MP4 con video + audio fusionados

### ⏱️ Proceso Inteligente
- **Búsqueda rápida**: Encuentra el media creado en 2-40 segundos (antes 5 minutos)
- **Monitoreo de procesamiento**: Espera hasta que el video esté listo
- **Tiempo total visible**: Muestra cuánto tiempo tomó todo el proceso

## 📋 Requisitos Previos

1. **Node.js** (versión 20 o superior)
2. **yt-dlp** - Herramienta para descargar videos de YouTube

### Instalar yt-dlp

**macOS:**
```bash
brew install yt-dlp
```

**Linux:**
```bash
sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

**Windows:**
```bash
pip install yt-dlp
```

O descarga el ejecutable desde: https://github.com/yt-dlp/yt-dlp/releases

## 🚀 Instalación

1. Clona o descarga este repositorio

2. Instala las dependencias:
```bash
npm install
```

3. (Opcional) Si quieres configurar un token por defecto, puedes crear un archivo `.env`:
```bash
cp .env.example .env
```

Y editar el archivo `.env`:
```env
MEDIASTREAM_TOKEN=tu_token_aqui
PORT=3000
```

**Nota:** Puedes ingresar el token directamente en la interfaz web, no es necesario configurar el archivo `.env`.

## 💻 Uso

1. Inicia el servidor:
```bash
npm start
```

O en modo desarrollo con auto-reload:
```bash
npm run dev
```

2. Abre tu navegador en: http://localhost:3000

3. Ingresa tu **Token de Mediastream** (obtenerlo desde https://platform.mediastre.am/settings/api)
   - El token se guardará automáticamente en tu navegador
   - Asegúrate de usar un token con **permisos de escritura**
   - Se muestra oculto por seguridad (usa el ojo para verlo)

4. Pega la URL de un video de YouTube

5. Haz clic en "Descargar y Subir"

6. Espera y observa el proceso en tiempo real:
   - ✅ Obtención de metadata de YouTube
   - 📥 Descarga con progreso en %
   - 📤 Upload por chunks
   - 🔍 Búsqueda del media creado
   - 📝 Actualización de metadata
   - ⏱️ Monitoreo de procesamiento (hasta que esté listo)
   - 🎯 URLs y embed code del video

## 📁 Estructura del Proyecto

```
UploadYT/
├── server.js           # Servidor Express
├── public/
│   └── index.html      # Interfaz web
├── downloads/          # Videos temporales (auto-creado)
├── package.json        # Dependencias
├── .env               # Configuración (no incluir en git)
├── .env.example       # Ejemplo de configuración
└── README.md          # Este archivo
```

## 🔧 API Endpoints

Base URL de la plataforma: https://platform.mediastre.am/

### POST /api/upload
Descarga un video de YouTube y lo sube a Mediastream.

**Request:**
```json
{
  "youtubeUrl": "https://www.youtube.com/watch?v=...",
  "mediastreamToken": "tu_token_de_mediastream"
}
```

**Nota:** Si tienes el token configurado en `.env`, el campo `mediastreamToken` es opcional.

**Response (streaming):**
```json
{"status": "downloading", "message": "Descargando video de YouTube..."}
{"status": "uploading", "message": "Subiendo video a Mediastream..."}
{"status": "processing", "message": "Procesando video en Mediastream..."}
{
  "status": "success",
  "message": "Video subido exitosamente",
  "data": {
    "mediaId": "...",
    "title": "...",
    "playerUrl": "https://mdstrm.com/embed/...",
    "embedCode": "<iframe src='...' ...></iframe>",
    "platformUrl": "https://platform.mediastre.am/media/..."
  }
}
```

### GET /api/health
Verifica el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "hasToken": true,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## ⚠️ Notas Importantes

### 🔥 Cómo Funciona el Sistema de Upload (no simultáneo)

1. **Fase 1 - Obtención de metadata (2-5s)**:
   - Se conecta a YouTube y obtiene toda la información del video
   - Descarga el thumbnail/miniatura del video
   - Obtiene upload token de Mediastream

2. **Fase 2 - Download completo + Upload por chunks** (depende del tamaño):
   - **yt-dlp** descarga el video completo a un archivo temporal MP4
   - Luego se divide en chunks de 10MB
   - Se suben los chunks secuencialmente a Mediastream
   - **Nota:** este proyecto **no sube simultáneamente mientras descarga**

3. **Fase 3 - Búsqueda del media (2-40s)**:
   - Busca el media creado en Mediastream cada 2 segundos
   - Usa 2 estrategias: búsqueda por título y por fecha reciente
   - Mucho más rápido que antes (antes tomaba hasta 5 minutos)

4. **Fase 4 - Actualización de metadata (5-10s)**:
   - Actualiza el media con TODA la información de YouTube:
     - Título, descripción, thumbnail, canal, fecha, vistas, duración
   - Sube el thumbnail como cover del video
   - Agrega custom fields con metadata adicional

5. **Fase 5 - Monitoreo de procesamiento (variable)**:
   - Espera a que Mediastream procese el video
   - Verifica cada 10 segundos hasta que tenga rendiciones disponibles
   - Puede tardar minutos u horas dependiendo del tamaño del video

### 💡 Ventajas del Sistema

✅ **Robusto**: Descarga completa antes de subir para evitar errores de tamaño  
✅ **Sin límites**: Soporta videos de cualquier tamaño  
✅ **Metadata completa**: Toda la info de YouTube se preserva  
✅ **Visible**: Muestra tiempo consumido de cada etapa  

### 🔧 Requisitos

- Token de Mediastream con **permisos de escritura**
- `yt-dlp` instalado en el sistema (actualizado)
- Espacio en disco temporal (se limpia automáticamente)
- Conexión a internet estable
- **Importante**: Tener sesión activa de YouTube en Chrome (para evitar bloqueos)

## 🐛 Solución de Problemas

### Error: "yt-dlp no encontrado"
Asegúrate de tener yt-dlp instalado y en tu PATH:
```bash
yt-dlp --version
```

### Error: "Token de Mediastream no configurado"
Verifica que el archivo `.env` existe y contiene tu token válido.

### Error al descargar video

**Error: "Sign in to confirm you're not a bot"**

YouTube bloquea descargas automatizadas. La aplicación usa cookies de Chrome automáticamente para evitar esto.

**Solución rápida:**
1. Abre Chrome
2. Inicia sesión en YouTube (https://youtube.com)
3. Vuelve a intentar la descarga

**Si usas otro navegador:**
Configura la variable de entorno `YT_COOKIES_BROWSER`:
```bash
export YT_COOKIES_BROWSER=firefox
```
Valores comunes: `chrome`, `firefox`, `safari`, `edge`.

**Actualizar yt-dlp:**
```bash
# macOS
brew upgrade yt-dlp

# Linux/Windows con pip
pip install --upgrade yt-dlp
```

**Otros problemas de descarga:**
- Verifica que la URL de YouTube sea válida
- Algunos videos pueden estar restringidos por región o derechos de autor
- Videos privados o no listados no funcionarán

### Error al subir a Mediastream

**Error al subir chunks**
- Verifica tu conexión a internet
- El sistema reintenta automáticamente hasta 3 veces por chunk
- Si falla, intenta de nuevo (los chunks ya subidos se saltarán)

**Otros errores**
- Verifica que tu token tenga permisos de escritura
- Verifica tu conexión a internet
- Revisa los logs del servidor para más detalles

## ⚖️ Disclaimer de Licencias

- Este proyecto usa `yt-dlp` para descargas desde YouTube.
- `yt-dlp` se distribuye bajo su propia licencia. Consulta: https://github.com/yt-dlp/yt-dlp/blob/master/LICENSE
- El uso de `yt-dlp` debe cumplir sus términos y la legislación aplicable.

## 📝 Licencia

MIT
