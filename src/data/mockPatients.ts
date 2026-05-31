import { QueuePatient } from "../types";

export const INITIAL_MOCK_PATIENTS: QueuePatient[] = [
  {
    id: "pat-1",
    name: "James Carter",
    esi: 1,
    symptomsSummary: "Anaphylaxis to bee sting, critical airway",
    accumulatedWaitMinutes: 2,
  },
  {
    id: "pat-2",
    name: "Marcus Vance",
    esi: 2,
    symptomsSummary: "Crushing chest distress, left arm numbness",
    accumulatedWaitMinutes: 18,
  },
  {
    id: "pat-3",
    name: "Sophia Lin",
    esi: 3,
    symptomsSummary: "Severe abdominal cramps with high fever",
    accumulatedWaitMinutes: 38,
  },
  {
    id: "pat-4",
    name: "Samania Patel",
    esi: 4,
    symptomsSummary: "Barking croup cough, mild wheezing",
    accumulatedWaitMinutes: 30,
  },
  {
    id: "pat-5",
    name: "Liam O'Connor",
    esi: 4,
    symptomsSummary: "Deformed ankle joint post impact injury",
    accumulatedWaitMinutes: 55,
  },
  {
    id: "pat-6",
    name: "Chloe Baker",
    esi: 5,
    symptomsSummary: "Minor contact dermatitis on arm, needs rx refill",
    accumulatedWaitMinutes: 110,
  },
];

/**
 * Calculates priority score (higher score = seen sooner).
 * Base score from ESI (lower ESI = higher priority).
 * Anti-starvation logic: accumulated wait time gradually boosts priority.
 */
export function getPriorityScore(patient: { esi: number; accumulatedWaitMinutes: number }): number {
  let baseScore = 0;
  switch (patient.esi) {
    case 1: baseScore = 1000; break; // Immediate / Resuscitation is absolute priority
    case 2: baseScore = 400; break;  // High priority emergent
    case 3: baseScore = 200; break;  // Urgent
    case 4: baseScore = 100; break;  // Semi-urgent
    case 5: baseScore = 40; break;   // Non-urgent
  }
  
  // Anti-starvation multiplier: 2 points per minute of waiting
  const waitBoost = patient.accumulatedWaitMinutes * 2;
  return baseScore + waitBoost;
}
