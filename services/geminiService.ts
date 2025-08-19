
import { GoogleGenAI } from "@google/genai";
import { GEMINI_SYSTEM_INSTRUCTION, APP_SPEC_SCHEMA } from '../constants';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateAppSpecification = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: GEMINI_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: APP_SPEC_SCHEMA,
      },
    });

    const text = response.text.trim();
    if (!text) {
        throw new Error("Received an empty response from the AI. Please try refining your prompt.");
    }
    
    // Basic validation to ensure it's a JSON object
    if (!text.startsWith('{') || !text.endsWith('}')) {
        throw new Error("AI did not return a valid JSON object. Please try again.");
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the AI service. Please check your API key and network connection.");
  }
};
