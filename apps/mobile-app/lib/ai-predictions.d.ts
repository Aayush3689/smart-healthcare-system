export type ModelName = 'diabetes' | 'heart' | 'hypertension';
export type AssessmentModelInputs = Record<string, string | number | undefined>;
export type ModelPrediction = { prediction: number; probability: number | null; risk_level: string; triage: string; reasons: string[]; clinical_score?: number; clinical_risk?: string; clinical_reasons?: string[] };
export type ModelResult = { model: ModelName; prediction: ModelPrediction } | { model: ModelName; error: string };
export const modelInputFields: readonly (readonly [string, string])[];
export function getAssessmentPredictions(input: {
  age: unknown; gender: unknown; assessment: AssessmentModelInputs; oxygen: unknown; heartRate: unknown; systolicBP: unknown; diastolicBP: unknown; symptoms: string[]; medicalHistory: string[]; medications: string[];
}): Promise<ModelResult[]>;
