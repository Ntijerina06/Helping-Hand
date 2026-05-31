export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface PatientInfo {
  name: string;
  age: number;
  symptoms: string;
  photoUrl: string | null;
  contact: EmergencyContact;
}

export interface TriageAssessment {
  esi: number; // 1 (most critical) to 5 (least critical)
  esiName: string;
  explanation: string;
  nextSteps: string;
}

export interface QueuePatient {
  id: string;
  name: string;
  esi: number;
  symptomsSummary: string;
  accumulatedWaitMinutes: number;
  isCurrentUser?: boolean;
}

export interface Message {
  id: string;
  sender: 'ai' | 'contact';
  text: string;
  timestamp: string;
  isProactive?: boolean;
}
