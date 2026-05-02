
export interface TripPlan {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  tier: 'basic' | 'elite';
  itinerary: ItineraryItem[];
  documents: TravelDocument[];
}

export interface ItineraryItem {
  id: string;
  time: string;
  activity: string;
  location: string;
  type: 'flight' | 'transport' | 'activity' | 'landmark' | 'dining';
  status: 'confirmed' | 'pending' | 'alert';
  details?: string;
  exclusiveAccess?: boolean;
}

export interface TravelDocument {
  id: string;
  name: string;
  type: 'passport' | 'visa' | 'insurance' | 'vaccine';
  expiryDate: string;
  fileUrl?: string;
}

export interface EmergencyProtocol {
  type: string;
  contact: string;
  steps: string[];
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
