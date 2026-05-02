import { GoogleGenAI } from "@google/genai";
import { Message } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

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
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      config: {
        systemInstruction: SYSTEM_PROMPT,
      }
    });

    return response.text || "I apologize, but I am unable to process that request right now. How else can I assist your journey?";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Nomad Elite network is experiencing minor turbulence. Please try again or visit the Emergency Hub for immediate assistance.";
  }
}
