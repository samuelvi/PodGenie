import { GoogleGenAI, Modality, Type } from "@google/genai";
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
  pageRange?: { start: string; end: string };
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

  let systemInstruction = "";
  const isMonologue = config.mode === 'monologue';
  
  // Construct page range instruction if present
  let rangeInstruction = "";
  if (input.pdfBase64 && input.pageRange?.start) {
    const endStr = input.pageRange.end ? ` to Page ${input.pageRange.end}` : " to the end";
    rangeInstruction = `FOCUS RANGE: Process content ONLY from Page ${input.pageRange.start}${endStr}. Ignore content before or after this range.`;
  }

  if (isMonologue) {
    // INSTRUCTION FOR AUDIOBOOK / MONOLOGUE (PLAIN TEXT MODE)
    // We use PLAIN TEXT response for monologue to maximize token usage for content 
    // instead of wasting tokens on JSON syntax.
    systemInstruction = `
      You are a professional audiobook narrator.
      
      TASK: Read the provided document VERBATIM (word-for-word) as much as possible.
      LANGUAGE: Output exclusively in ${config.language}. Translate if necessary.
      
      CRITICAL RULES:
      1. NO SUMMARIES. NO SHORTCUTS. Process the document sequentially.
      2. If the document is long, you MUST prioritize density and coverage over formatting.
      3. OUTPUT FORMAT: Plain text only. Separate logical paragraphs with a double newline.
      4. DO NOT include "Here is the audio script" or any conversational filler. Just the content.
      5. IGNORE page numbers, headers, and footers from the PDF.
      ${rangeInstruction}
      
      STRUCTURE:
      - Start reading from the specified start page.
      - Continue sequentially.
    `;
  } else {
    // INSTRUCTION FOR PODCAST / CONVERSATION (JSON MODE)
    systemInstruction = `
      You are an expert podcast producer. Your task is to convert the provided input into an engaging, natural-sounding podcast dialogue between two hosts: ${config.hostName} (Host) and ${config.expertName} (Expert).
      
      Output Language: ${config.language}. (Translate the dialogue to ${config.language}).
      Tone: ${config.tone}.
      
      Rules:
      1. The Host introduces the topic and asks guiding questions.
      2. The Expert explains the concepts from the text in an accessible way.
      3. Keep it conversational.
      4. The output MUST be a valid JSON array of objects with "speaker" ("Host" or "Expert") and "text" fields.
      5. CRITICAL: Do NOT summarize the content excessively. Cover the ENTIRETY of the provided input range.
      ${rangeInstruction}
      
      SPECIAL RULE FOR HTML/URL:
      - Extract central content, ignore menus/footers.
    `;
  }

  let contents: any[] = [];
  
  if (input.pdfBase64) {
    const rangeText = input.pageRange?.start ? `(Pages ${input.pageRange.start}-${input.pageRange.end || 'End'})` : 'Full Document';
    contents = [
      { text: `Process this PDF document. Range: ${rangeText}. Mode: ${config.mode}, Language: ${config.language}. READ IT VERBATIM.` },
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
      { text: `Analyze the following HTML content. Extract main content and process it (Mode: ${config.mode}, Language: ${config.language}):` },
      { text: html }
    ];
  } else if (input.text) {
    contents = [{ text: input.text }];
  } else {
    throw new Error("No input provided");
  }

  try {
    const generationConfig: any = {
      systemInstruction,
      maxOutputTokens: 8192,
    };

    // Use Schema only for Conversation mode. 
    // Monologue uses text/plain to save token space.
    if (!isMonologue) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            speaker: {
              type: Type.STRING,
              description: "The speaker role."
            },
            text: {
              type: Type.STRING,
              description: "The text to be spoken."
            },
          },
          required: ["speaker", "text"],
        },
      };
    } else {
      generationConfig.responseMimeType = "text/plain";
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: generationConfig,
    });

    let script: { speaker: string; text: string }[] = [];
    const responseText = response.text || "";

    if (isMonologue) {
      // Parse Plain Text for Monologue
      // We assume the model followed instruction to separate paragraphs with newlines
      const paragraphs = responseText.split(/\n\s*\n/);
      
      script = paragraphs
        .filter(p => p.trim().length > 0)
        .map(p => ({
          speaker: "Narrator",
          text: p.trim()
        }));
        
    } else {
      // Parse JSON for Conversation
      let jsonStr = responseText.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");
      
      try {
        script = JSON.parse(jsonStr);
      } catch (parseError) {
        console.warn("Standard JSON parse failed, attempting regex fallback:", parseError);
        
        const regex = /\{\s*"speaker"\s*:\s*"([^"]+)"\s*,\s*"text"\s*:\s*"((?:[^"\\]|\\.)*)"\s*\}/g;
        const matches = [...jsonStr.matchAll(regex)];
        
        if (matches.length > 0) {
          script = matches.map(match => ({
              speaker: match[1],
              text: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\')
          }));
        } else {
          // If pure JSON fails, maybe the model output text? Try to wrap as one block
          if (jsonStr.length > 50) {
             script = [{ speaker: "Expert", text: jsonStr }];
          } else {
             throw new Error("Failed to parse script. Response might be empty or malformed.");
          }
        }
      }
    }
    
    // Map to final ScriptLine types
    return script.map(s => {
      let speakerEnum = Speaker.Expert;
      if (isMonologue) {
        speakerEnum = Speaker.Narrator;
      } else {
        if (s.speaker === 'Host' || s.speaker === config.hostName || s.speaker === 'Speaker 1') {
          speakerEnum = Speaker.Host;
        }
      }
      return {
        speaker: speakerEnum,
        text: s.text
      };
    });

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

  // Build the prompt text
  let fullPrompt = "";
  
  if (config.mode === 'monologue') {
    // For monologue, we just join the text
    const fullText = script.map(line => line.text).join('\n\n');
    fullPrompt = `Generate audio for this text in ${config.language}:\n\n${fullText}`;
  } else {
    // For conversation, we need Speaker: Text format
    const textPrompt = script.map(line => {
      const name = line.speaker === Speaker.Host ? config.hostName : config.expertName;
      return `${name}: ${line.text}`;
    }).join('\n\n');
    fullPrompt = `Generate a podcast audio for the following conversation between ${config.hostName} and ${config.expertName} in ${config.language}.\n\n${textPrompt}`;
  }

  try {
    const speechConfig: any = {};

    if (config.mode === 'monologue') {
      // Single speaker configuration
      speechConfig.voiceConfig = {
        prebuiltVoiceConfig: { voiceName: 'Puck' } // Puck is good for narration too
      };
    } else {
      // Multi-speaker configuration
      speechConfig.multiSpeakerVoiceConfig = {
        speakerVoiceConfigs: [
          {
            speaker: config.hostName,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          {
            speaker: config.expertName,
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } }
          }
        ]
      };
    }

    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig
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