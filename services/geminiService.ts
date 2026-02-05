
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Ensure process.env.API_KEY is available in the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGeminiResponse = async (prompt: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error communicating with the AI. Please try again later.";
  }
};

export const analyzeWasteImage = async (
  prompt: string, 
  base64Image: string, 
  mimeType: string = 'image/jpeg'
): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        mimeType,
        data: base64Image,
      },
    };
    const textPart = { text: prompt };
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, textPart] },
    });
    
    return response.text || "I've analyzed the image, but I'm not sure what it is.";
  } catch (error) {
    console.error("Gemini Multi-modal Error:", error);
    return "Failed to analyze the image. Please try describing the item instead.";
  }
};

export const chatWithGemini = async (history: { role: string; text: string }[], message: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are a helpful waste management assistant for the 'Easy Waste Pickup' app. Provide concise, friendly advice about recycling, disposal, and collection rules. If a user provides an address, keep it in context. Be eco-conscious."
      }
    });
    
    // Manual mapping for simpler chat handling in this prototype
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "I'm not sure how to respond to that.";
  } catch (error) {
    console.error("Chat Error:", error);
    return "Oops! I encountered a glitch. Can we try again?";
  }
};
