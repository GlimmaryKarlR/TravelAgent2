import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

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
    You are an elite historical guide for Nomad Elite. 
    Generate a detailed, sophisticated audio tour for: ${activity} in ${location}.
    
    The content should feel like a premium documentary (History Channel style).
    Include 3-4 specific "stops" or segments that can be navigated via GPS.
    
    Format the response as a JSON object:
    {
      "locationName": "name",
      "introduction": "A captivating 30-second intro",
      "segments": [
        {
          "title": "Segment name",
          "description": "Rich narrative content for this stop",
          "historicalFact": "A deep-cut historical fact",
          "navigationTip": "Where to walk next",
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
      introduction: `Welcome to ${activity}. I am your Nomad Elite guide.`,
      segments: [
        {
          title: "Introduction to the Site",
          description: `You are standing at ${activity}. This location holds immense cultural significance.`,
          historicalFact: "The architecture reflects centuries of evolution.",
          navigationTip: "Walk towards the main entrance to start.",
          estimatedDuration: "5 mins"
        }
      ],
      closing: "Thank you for exploring with Nomad Elite."
    };
  }
}
