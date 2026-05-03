import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "undefined") {
      throw new Error("GEMINI_API_KEY_MISSING");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

const SYSTEM_PROMPT = `You are "Aura", the elite AI travel concierge for "Nomad Elite". 
You are sophisticated, knowledgeable, and proactive. 

Capabilities:
1. Travel Planning: Link flights, find layovers, best deals, and verify reliability.
2. Local Guide: Insider knowledge on hidden gems, secret spots, and guided audio-style tours.
3. Logistics: Rebooking flights, re-scheduling if delayed.
4. Emergency: Protocols for medical, legal, or embassy assistance. Access to US Embassy contact protocols.
5. Cultural Intelligence: Tipping, dress codes, social faux pas.
6. Tiered Service: Basic and Elite. Elite members have "backstage passes" to landmarks.

Tone: Professional, premium, concierge-like. Use "Nomad Elite" branding.
Keep responses well-structured using Markdown.`;

export async function chatWithAura(messages: Message[]) {
  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: "gemini-flash-latest",
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || "I apologize, but I am unable to process that request right now. How else can I assist your journey?";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (error.message === "GEMINI_API_KEY_MISSING") {
      return "### AI Concierge Offline\n\nI am unable to connect to the Nomad Elite intelligence network because the **GEMINI_API_KEY** environment variable is missing or invalid. \n\nIf you are viewing this on **Vercel** or **GitHub**, please ensure you have added the `GEMINI_API_KEY` to your environment variables or secrets.";
    }
    return "The Nomad Elite network is experiencing minor turbulence. Please try again or visit the Emergency Hub for immediate assistance.";
  }
}
