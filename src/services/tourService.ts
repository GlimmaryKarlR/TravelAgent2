import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY_DEV || "" });

export interface TourSegment {
  title: string;
  description: string;
  historicalFact: string;
  navigationTip: string;
  estimatedDuration: string;
  coordinates?: { lat: number, lng: number };
}

export interface TourContent {
  locationName: string;
  introduction: string;
  segments: TourSegment[];
  closing: string;
}

export async function generateTourContent(location: string, activity: string): Promise<TourContent> {
  const prompt = `
    You are OdyAi, the elite expedition architect and historical guide for Odyssey. 
    Generate a detailed, sophisticated audio tour for: ${activity} in ${location}.
    
    The content should feel like a premium documentary narrated by a hyper-competent AI.
    Include 3-4 specific "stops" or segments that can be navigated via GPS.
    
    Format the response as a JSON object:
    {
      "locationName": "name",
      "introduction": "A captivating 30-second intro as OdyAi",
      "segments": [
        {
          "title": "Segment Name",
          "description": "Rich narrative intelligence for this stop",
          "historicalFact": "A deep-cut historical archive fact",
          "navigationTip": "Strategic navigation instructions",
          "estimatedDuration": "mins"
        }
      ],
      "closing": "Final takeaway"
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt
    });
    
    const text = response.text || "";
    const jsonStr = text.replace(/```json|```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Failed to generate tour content:", error);
    // Fallback content
    return {
      locationName: activity,
      introduction: `Welcome to ${activity}. I am OdyAi, your expedition architect.`,
      segments: [
        {
          title: "Expedition Initialization",
          description: `We have arrived at ${activity}. Calibrating local intelligence...`,
          historicalFact: "The architecture reflects centuries of evolution.",
          navigationTip: "Advance towards the main entrance to start protocol.",
          estimatedDuration: "5 mins"
        }
      ],
      closing: "Odyssey protocol terminated."
    };
  }
}
