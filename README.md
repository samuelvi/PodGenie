# PodGenie 🧞‍♂️🎧

PodGenie es una aplicación web impulsada por Inteligencia Artificial que transforma documentos PDF y textos largos en **podcasts de audio** atractivos con dos locutores (Host y Experto).

Utiliza la tecnología de **Google Gemini 2.5** para generar guiones naturales y **Gemini Audio** para sintetizar voces realistas.

## Características Principales

-   📄 **Carga de PDF:** Sube tus documentos y conviértelos automáticamente.
-   ✍️ **Entrada de Texto:** Pega notas, artículos o guiones directamente.
-   🤖 **Generación de Guiones:** Crea diálogos dinámicos entre dos personajes (Kore y Fenrir).
-   🗣️ **Voces Realistas:** Audio de alta calidad generado al instante.
-   ⬇️ **Descarga:** Guarda tu podcast en formato `.wav`.

## Requisitos

-   Docker y Docker Compose instalados en tu máquina.
-   Una **Google Gemini API Key** (puedes obtenerla en [Google AI Studio](https://aistudio.google.com/)).

## Instrucciones de Instalación y Uso (Docker)

La forma más sencilla de ejecutar PodGenie es utilizando Docker Compose.

### 1. Clonar o descargar el proyecto
Asegúrate de tener todos los archivos del proyecto en una carpeta.

### 2. Configurar la API Key
Necesitas decirle a Docker tu clave de API. Tienes dos opciones:

**Opción A: Crear un archivo `.env` (Recomendado)**
Crea un archivo llamado `.env` en la raíz del proyecto y añade tu clave:
```env
API_KEY=tu_clave_de_api_aqui
```

**Opción B: Pasar la variable directamente**
Puedes pasar la variable de entorno al ejecutar el comando.

### 3. Ejecutar la aplicación
Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
docker-compose up
```

Si usaste la Opción B (sin archivo .env), ejecuta:
```bash
API_KEY=tu_clave_de_api_aqui docker-compose up
```

### 4. Acceder
Una vez que el contenedor esté en marcha, abre tu navegador y visita:

👉 **http://localhost:3000**

## Estructura del Proyecto

-   `/components`: Componentes reutilizables de React (UI).
-   `/services`: Lógica de conexión con la API de Gemini.
-   `/utils`: Utilidades para el manejo de audio (WAV encoding).
-   `Dockerfile`: Configuración de la imagen del contenedor.
-   `vite.config.ts`: Configuración del entorno de desarrollo.

---
*Powered by Google Gemini API*
