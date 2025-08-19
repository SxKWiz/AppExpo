import { GoogleGenAI } from '@google/genai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface GenerationOptions {
  systemInstruction: string;
  responseSchema: any;
  model?: string;
}

export const generateAppSpecification = async (
  prompt: string, 
  options: GenerationOptions
): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: options.model || "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        systemInstruction: options.systemInstruction,
        responseMimeType: "application/json",
        responseSchema: options.responseSchema,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
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

    // Validate JSON parsing
    try {
      JSON.parse(text);
    } catch (parseError) {
      throw new Error("AI returned invalid JSON. Please try again.");
    }

    return text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to communicate with the AI service. Please check your network connection.");
  }
};

export const generateIterativeUpdate = async (
  originalSpec: any,
  modificationPrompt: string,
  options: GenerationOptions
): Promise<string> => {
  const contextPrompt = `
Original App Specification:
${JSON.stringify(originalSpec, null, 2)}

Modification Request:
${modificationPrompt}

Please modify the app specification according to the request above. Maintain the existing structure and only change what's necessary.
`;

  return generateAppSpecification(contextPrompt, options);
};