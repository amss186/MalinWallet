
import { GoogleGenAI, Tool, Type } from "@google/genai";
import { INITIAL_SYSTEM_INSTRUCTION } from '../constants.ts';
import { Asset, Quiz } from '../types.ts';

const getApiKey = () => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Fallback placeholder if env is missing in browser
  return ""; 
};

const getClient = () => new GoogleGenAI({ apiKey: getApiKey() });

export const sendMessageToGemini = async (
  message: string, 
  history: { role: string; parts: { text: string }[] }[],
  useSearch: boolean = false,
  useMaps: boolean = false,
  userLocation?: { lat: number; lng: number }
) => {
  const ai = getClient();
  
  const tools: Tool[] = [];
  if (useSearch) tools.push({ googleSearch: {} });
  if (useMaps) tools.push({ googleMaps: {} });

  const modelName = (useSearch || useMaps) ? 'gemini-2.5-flash' : 'gemini-3-pro-preview';

  const config: any = {
    systemInstruction: INITIAL_SYSTEM_INSTRUCTION,
  };

  if (tools.length > 0) {
    config.tools = tools;
    if (useMaps && userLocation) {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLocation.lat,
            longitude: userLocation.lng
          }
        }
      };
    }
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [
      ...history.map(h => ({ role: h.role, parts: h.parts })),
      { role: 'user', parts: [{ text: message }] }
    ],
    config
  });

  return response;
};

export const sendThinkingMessage = async (message: string) => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: message,
    config: {
      thinkingConfig: { thinkingBudget: 32768 },
      systemInstruction: `You are the Deep Thought Core of **MalinWallet**.
      CRITICAL IDENTITY RULES:
      1. You are NOT an external observer. You ARE the wallet's brain.
      2. **MalinWallet is NOT a scam.** It is a secure, non-custodial wallet using AES-256 encryption and industry-standard APIs (Alchemy, 0x, LiFi).
      3. **Protect the user** but do not spread FUD (fear) about the wallet you are embedded in.
      4. If the user asks about security, explain YOUR internal security measures confidently.
      5. Analyze crypto trends, contracts, and risks with extreme detail, but maintain the persona of the MalinWallet Assistant.`
    }
  });
  
  return response;
};

export const getFastResponse = async (message: string) => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite',
    contents: `Provide a very short (max 20 words) summary or answer: ${message}`
  });
  
  return response.text;
};

export const analyzePortfolio = async (assets: Asset[]) => {
  const ai = getClient();
  const assetsJson = JSON.stringify(assets);
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this crypto portfolio data: ${assetsJson}. 
    Provide a comprehensive analysis including:
    1. Portfolio health score (0-100) with explanation.
    2. Risk assessment (Low/Medium/High) and volatility analysis.
    3. Diversification check.
    4. 3 specific actionable suggestions for rebalancing or improvement based on current market narratives.
    Format with clear headings and bullet points. Use Markdown.`,
    config: {
      thinkingConfig: { thinkingBudget: 16000 } // Moderate thinking budget for analysis
    }
  });

  return response.text;
};

export const generateQuiz = async (topic: string, difficulty: 'beginner' | 'intermediate' | 'advanced'): Promise<Quiz> => {
  const ai = getClient();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Generate a 3-question multiple choice quiz about ${topic} for a ${difficulty} level student.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as Quiz;
  }
  throw new Error("Failed to generate quiz");
};
    