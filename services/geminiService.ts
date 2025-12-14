import { GoogleGenAI, Modality } from "@google/genai";
import { PodcastConfig, ScriptLine, Speaker } from "../types";

// Initialize Gemini Client
// Note: API Key must be in process.env.API_KEY
const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface GenerateScriptInput {
  text?: string;
  pdfBase64?: string;
  url?: string;
}

// Helper to fetch URL content via proxy to avoid CORS
const fetchUrlContent = async (url: string): Promise<string> => {
  try {
    // Using allorigins to bypass CORS for client-side demo
    const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch URL content');
    return await response.text();
  } catch (error) {
    console.error("Error fetching URL:", error);
    throw new Error("Could not fetch the URL. Please check if the URL is public and accessible.");
  }
};

export const generatePodcastScript = async (
  input: GenerateScriptInput,
  config: PodcastConfig
): Promise<ScriptLine[]> => {
  const ai = getClient();
  const model = "gemini-2.5-flash";

  const systemInstruction = `
    You are an expert podcast producer. Your task is to convert the provided input (text, document, or webpage) into an engaging, natural-sounding podcast dialogue between two hosts: ${config.hostName} (Host) and ${config.expertName} (Expert).
    
    Tone: ${config.tone}.
    
    Rules:
    1. The Host introduces the topic and asks guiding questions.
    2. The Expert explains the concepts from the text in an accessible way.
    3. Keep it conversational. Use fillers like "Exactly", "That's a great point", etc., but don't overdo it.
    4. The output MUST be a valid JSON array of objects with "speaker" ("Host" or "Expert") and "text" fields.
    5. Do not include any markdown formatting like \`\`\`json. Just the raw JSON.
    6. CRITICAL: Do NOT summarize the content. You must cover the ENTIRETY of the provided input material in detail. Convert the full document into dialogue without omitting sections.
    7. If the content is long, create a comprehensive script that covers everything.
    
    SPECIAL RULE FOR HTML/URL INPUT:
    - If the input is HTML or from a URL, you MUST first Extract ONLY the central content (article body, main post, documentation text).
    - COMPLETELY IGNORE navigation bars, menus, footers, "read more" links, advertisements, sidebars, and copyright notices.
    - Only convert the meaningful central content into the podcast.
  `;

  let contents: any[] = [];
  
  if (input.pdfBase64) {
    contents = [
      { text: "Convert this PDF document into a podcast script following the system instructions. Cover the whole document." },
      { 
        inlineData: { 
          mimeType: "application/pdf", 
          data: input.pdfBase64 
        } 
      }
    ];
  } else if (input.url) {
    const html = await fetchUrlContent(input.url);
    contents = [
      { text: "Analyze the following HTML content. Extract the main central content, ignoring navigation and footer, and convert it into a podcast script:" },
      { text: html }
    ];
  } else if (input.text) {
    contents = [{ text: input.text }];
  } else {
    throw new Error("No input provided");
  }

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 8192,
      },
    });

    const jsonStr = response.text || "[]";
    const script = JSON.parse(jsonStr) as { speaker: string; text: string }[];
    
    // Validate and map to ScriptLine
    return script.map(s => ({
      speaker: s.speaker === 'Host' || s.speaker === config.hostName ? Speaker.Host : Speaker.Expert,
      text: s.text
    }));

  } catch (error) {
    console.error("Error generating script:", error);
    throw error;
  }
};

export const generatePodcastAudio = async (
  script: ScriptLine[],
  config: PodcastConfig
): Promise<string> => {
  const ai = getClient();
  const model = "gemini-2.5-flash-preview-tts";

  // Format the script into the text format Gemini expects for multi-speaker
  // "Speaker: Text"
  const textPrompt = script.map(line => {
    const name = line.speaker === Speaker.Host ? config.hostName : config.expertName;
    return `${name}: ${line.text}`;
  }).join('\n\n');

  const fullPrompt = `Generate a podcast audio for the following conversation between ${config.hostName} and ${config.expertName}.\n\n${textPrompt}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          multiSpeakerVoiceConfig: {
            speakerVoiceConfigs: [
              {
                speaker: config.hostName,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Puck' } // Deep, authoritative for Host
                }
              },
              {
                speaker: config.expertName,
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Fenrir' } // Clear, energetic for Expert
                }
              }
            ]
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    
    if (!base64Audio) {
      throw new Error("No audio data returned from Gemini.");
    }

    return base64Audio;

  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
};