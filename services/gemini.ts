
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Wrapper para evitar que chamadas de rede infinitas travem a lógica do app
const withTimeout = <T>(promise: Promise<T>, ms: number = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error('TIMEOUT_IA')), ms)
    )
  ]);
};

export const medicalProtocolSchema = {
  type: Type.OBJECT,
  properties: {
    emergencyType: { type: Type.STRING },
    criticality: { type: Type.STRING, enum: ["CRITICAL", "HIGH", "MODERATE", "LOW"] },
    immediateInstruction: { type: Type.STRING, description: "Ação principal, clara e completa baseada no protocolo APH Brasil." },
    isCardiacArrest: { type: Type.BOOLEAN, description: "Verdadeiro se o protocolo exigir massagem cardíaca (RCP)." },
    nextSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          instruction: { type: Type.STRING, description: "Instrução detalhada conforme normas do Ministério da Saúde." },
          type: { type: Type.STRING, enum: ["action", "check", "alert", "critical"] }
        },
        required: ["id", "instruction", "type"]
      }
    }
  },
  required: ["emergencyType", "criticality", "immediateInstruction", "nextSteps", "isCardiacArrest"]
};

// Fix: Instantiating GoogleGenAI locally and explicitly typing withTimeout to resolve GenerateContentResponse
export const getEmergencyGuidance = async (description: string, patientContext: string, imageBase64?: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = 'gemini-3-flash-preview';
    
    const parts: any[] = [
      { text: `SITUAÇÃO DE EMERGÊNCIA NO BRASIL: ${description}. VÍTIMA: ${patientContext}.` }
    ];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: model,
      contents: { parts },
      config: {
        systemInstruction: `Você é um especialista em Atendimento Pré-Hospitalar (APH) seguindo rigorosamente as diretrizes do Ministério da Saúde do Brasil (SAMU) e da SBC.
        Sua missão é dar instruções de SALVAMENTO IMEDIATO para leigos.
        Se uma imagem for fornecida, analise sinais de trauma, sangramento, cor da pele, postura e objetos ao redor para refinar o protocolo.
        
        DIRETRIZES:
        1. Linguagem simples, direta e imperativa.
        2. Foque em manter a vida: RCP, controle de hemorragias, desobstrução de vias aéreas.
        3. Se for Parada Cardíaca (PCR), defina isCardiacArrest como true.
        4. Todas as respostas em Português do Brasil.`,
        responseMimeType: "application/json",
        responseSchema: medicalProtocolSchema
      }
    }));

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Erro na consulta de emergência:", error);
    throw error;
  }
};

// Fix: Using gemini-2.5-flash for maps grounding (required series) and typing withTimeout to fix property access errors
export const findNearbyHospitals = async (lat: number, lng: number) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await withTimeout<GenerateContentResponse>(ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Quais são os hospitais, pronto-socorros e unidades de saúde (UPA) mais próximos e abertos agora? Liste nome e distância aproximada.",
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: lat,
              longitude: lng
            }
          }
        }
      },
    }), 12000); // Maior timeout para mapas

    return {
      text: response.text,
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    };
  } catch (error) {
    console.error("Erro ao buscar hospitais:", error);
    throw error;
  }
};
