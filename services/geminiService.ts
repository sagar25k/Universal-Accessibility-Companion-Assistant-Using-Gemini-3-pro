import { GoogleGenAI } from "@google/genai";
import { AppMode, AnalysisRequest, AnalysisResponse } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeContent = async (request: AnalysisRequest): Promise<AnalysisResponse> => {
  try {
    const client = getClient();
    
    // We use gemini-3-pro-preview for high capability reasoning and vision tasks
    // as requested by the prompt for an Accessibility Companion.
    const modelId = 'gemini-3-pro-preview';
    
    const parts: any[] = [];

    // Add image if present
    if (request.imageBase64 && request.imageMimeType) {
      // Remove data URL prefix if present (e.g. "data:image/png;base64,")
      const base64Data = request.imageBase64.split(',')[1] || request.imageBase64;
      
      parts.push({
        inlineData: {
          mimeType: request.imageMimeType,
          data: base64Data
        }
      });
    }

    // Add user prompt text based on mode
    let prompt = "";
    if (request.text) {
      prompt += `User Input: "${request.text}"\n\n`;
    } else {
      prompt += "Analyze the provided image.\n\n";
    }

    switch (request.mode) {
      case AppMode.DESCRIBE:
        prompt += "Task: Perform a 'Describe' analysis. Focus on layout, sections, and accessibility relevant details.";
        break;
      case AppMode.SIMPLIFY:
        prompt += "Task: Perform a 'Simplify' analysis. Extract text and rewrite it in plain, simple language with bullet points.";
        break;
      case AppMode.GUIDE:
        prompt += "Task: Perform a 'Guide' analysis. Provide step-by-step instructions on how to interact with this content.";
        break;
    }

    parts.push({ text: prompt });

    const response = await client.models.generateContent({
      model: modelId,
      contents: {
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for consistent, clear, factual responses
      }
    });

    if (!response.text) {
      throw new Error("No response generated from the model.");
    }

    return {
      markdown: response.text
    };

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      markdown: "",
      error: error.message || "An unexpected error occurred while processing your request."
    };
  }
};