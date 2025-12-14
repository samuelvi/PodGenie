# PodGenie 🧞‍♂️🎧

PodGenie is an AI-powered web application that transforms PDF documents, webpages (URLs), and long texts into engaging **audio podcasts** featuring two hosts (Host and Expert).

It uses **Google Gemini 2.5** technology to generate natural scripts and **Gemini Audio** to synthesize realistic voices.

## Key Features

-   📄 **PDF Upload:** Upload your documents and convert them automatically.
-   🔗 **URL Support:** Paste a webpage link and extract the central content (ignoring navigation/footers).
-   ✍️ **Text Input:** Paste notes, articles, or scripts directly.
-   🤖 **Script Generation:** Create dynamic dialogues between two characters (Kore and Fenrir).
-   🗣️ **Realistic Voices:** High-quality audio generated instantly.
-   ⬇️ **Download:** Save your podcast in `.wav` format.

## Requirements

-   Docker and Docker Compose installed on your machine.
-   A **Google Gemini API Key** (you can get one at [Google AI Studio](https://aistudio.google.com/)).

## Installation and Usage Instructions (Docker)

The easiest way to run PodGenie is using Docker Compose.

### 1. Clone or download the project
Ensure all project files are in a folder.

### 2. Configure the API Key
You need to provide your API key to Docker. You have two options:

**Option A: Create a `.env` file (Recommended)**
Create a file named `.env` in the root of the project and add your key:
```env
API_KEY=your_api_key_here
```

**Option B: Pass the variable directly**
You can pass the environment variable when executing the command.

### 3. Run the application
Open a terminal in the project folder and run:

```bash
docker-compose up
```

If you chose Option B (without a .env file), run:
```bash
API_KEY=your_api_key_here docker-compose up
```

### 4. Access
Once the container is running, open your browser and visit:

👉 **http://localhost:3000**

## Project Structure

-   `/components`: Reusable React components (UI).
-   `/services`: Logic for connecting with the Gemini API.
-   `/utils`: Utilities for audio handling (WAV encoding).
-   `Dockerfile`: Container image configuration.
-   `vite.config.ts`: Development environment configuration.

---
*Powered by Google Gemini API*
