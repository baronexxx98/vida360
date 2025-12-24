
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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

export const getEmergencyGuidance = async (description: string, patientContext: string, imageBase64?: string) => {
  // Alterado para Flash para máxima velocidade em emergências
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

  const response = await ai.models.generateContent({
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
  });

  return response.text ? JSON.parse(response.text) : null;
};

export const findNearbyHospitals = async (lat: number, lng: number) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};
