import { Asset } from 'expo-asset';
import { InferenceSession, Tensor } from 'onnxruntime-react-native';

export type ModelName = 'diabetes' | 'heart' | 'hypertension';
export type AssessmentModelInputs = Record<string, string | number | undefined>;
export type ModelPrediction = { prediction: number; probability: number | null; risk_level: string; triage: string; reasons: string[] };
export type ModelResult = { model: ModelName; prediction: ModelPrediction } | { model: ModelName; error: string };

export const modelInputFields = [
  ['Pregnancies', 'Pregnancies'], ['Glucose', 'Glucose (mg/dL)'], ['SkinThickness', 'Skin thickness (mm)'], ['Insulin', 'Insulin (mu U/ml)'], ['BMI', 'BMI'], ['DiabetesPedigreeFunction', 'Diabetes pedigree function'],
  ['cp', 'Chest pain type (0–3)'], ['chol', 'Cholesterol (mg/dL)'], ['fbs', 'Fasting blood sugar >120 (0/1)'], ['restecg', 'Resting ECG result (0–2)'], ['thalach', 'Maximum heart rate'], ['exang', 'Exercise angina (0/1)'], ['oldpeak', 'ST depression (oldpeak)'], ['slope', 'ST slope (0–2)'], ['ca', 'Major vessels (0–3)'], ['thal', 'Thal result (0–3)'],
  ['BP_History', 'Blood-pressure history (0/1)'], ['Medication', 'Taking medication (0/1)'], ['Family_History', 'Family history (0/1)'], ['Exercise_Level', 'Low exercise level (0/1)'], ['Smoking_Status', 'Smoking status (0/1)'],
] as const;

const models: Record<ModelName, number> = {
  diabetes: require('@/assets/models/diabetes_model.onnx'), heart: require('@/assets/models/heart_model.onnx'), hypertension: require('@/assets/models/hypertension_model.onnx'),
};
const sessions = new Map<ModelName, Promise<InferenceSession>>();
const numberValue = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; };
const getSession = (model: ModelName) => {
  if (!sessions.has(model)) sessions.set(model, (async () => { const asset = Asset.fromModule(models[model]); await asset.downloadAsync(); if (!asset.localUri) throw new Error(`Unable to load the ${model} model.`); return InferenceSession.create(asset.localUri); })());
  return sessions.get(model)!;
};
const runModel = async (model: ModelName, features: number[]): Promise<ModelPrediction> => {
  const session = await getSession(model); const input = new Tensor('float32', Float32Array.from(features), [1, features.length]); const outputs = await session.run({ [session.inputNames[0]]: input });
  const label = outputs[session.outputNames.find((name) => name.includes('label')) || session.outputNames[0]] as { data: ArrayLike<number> };
  const probabilityOutput = outputs[session.outputNames.find((name) => name.includes('probability')) || ''] as { data?: ArrayLike<number> } | undefined;
  const probability = probabilityOutput?.data ? Number(probabilityOutput.data[1]) : null; const prediction = Number(label.data[0]);
  return { prediction, probability: Number.isFinite(probability) ? probability : null, risk_level: prediction === 1 ? 'Positive' : 'Negative', triage: 'Generated locally from the bundled ONNX model.', reasons: [] };
};
export const getAssessmentPredictions = async ({ age, gender, assessment, heartRate, systolicBP, diastolicBP }: { age: unknown; gender: unknown; assessment: AssessmentModelInputs; oxygen: unknown; heartRate: unknown; systolicBP: unknown; diastolicBP: unknown; symptoms: string[]; medicalHistory: string[]; medications: string[]; }): Promise<ModelResult[]> => {
  const sex = String(gender).toLowerCase() === 'male' ? 1 : String(gender).toLowerCase() === 'female' ? 0 : undefined;
  const definitions: Array<{ model: ModelName; features: unknown[]; message: string }> = [
    { model: 'diabetes', features: [assessment.Pregnancies, assessment.Glucose, diastolicBP, assessment.SkinThickness, assessment.Insulin, assessment.BMI, assessment.DiabetesPedigreeFunction, age], message: 'Complete the diabetes model inputs to run this prediction.' },
    { model: 'heart', features: [age, sex, assessment.cp, systolicBP, assessment.chol, assessment.fbs, assessment.restecg, assessment.thalach, assessment.exang, assessment.oldpeak, assessment.slope, assessment.ca, assessment.thal], message: 'Complete the heart model inputs and patient gender to run this prediction.' },
    { model: 'hypertension', features: [age, assessment.BMI, systolicBP, diastolicBP, heartRate, assessment.BP_History, assessment.Medication, assessment.Family_History, assessment.Exercise_Level, assessment.Smoking_Status], message: 'Complete the hypertension model inputs to run this prediction.' },
  ];
  return Promise.all(definitions.map(async ({ model, features, message }) => {
    if (features.some((value) => numberValue(value) === undefined)) return { model, error: message };
    try { return { model, prediction: await runModel(model, features.map((value) => numberValue(value)!)) }; } catch (error) { return { model, error: error instanceof Error ? error.message : `Unable to run the ${model} model locally.` }; }
  }));
};
