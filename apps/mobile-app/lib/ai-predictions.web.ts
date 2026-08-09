export type ModelName = 'diabetes' | 'heart' | 'hypertension';
export type AssessmentModelInputs = Record<string, string | number | undefined>;
export type ModelPrediction = { prediction: number; probability: number | null; risk_level: string; triage: string; reasons: string[] };
export type ModelResult = { model: ModelName; prediction: ModelPrediction } | { model: ModelName; error: string };
export const modelInputFields = [
  ['Pregnancies', 'Pregnancies'], ['Glucose', 'Glucose (mg/dL)'], ['SkinThickness', 'Skin thickness (mm)'], ['Insulin', 'Insulin (mu U/ml)'], ['BMI', 'BMI'], ['DiabetesPedigreeFunction', 'Diabetes pedigree function'], ['cp', 'Chest pain type (0–3)'], ['chol', 'Cholesterol (mg/dL)'], ['fbs', 'Fasting blood sugar >120 (0/1)'], ['restecg', 'Resting ECG result (0–2)'], ['thalach', 'Maximum heart rate'], ['exang', 'Exercise angina (0/1)'], ['oldpeak', 'ST depression (oldpeak)'], ['slope', 'ST slope (0–2)'], ['ca', 'Major vessels (0–3)'], ['thal', 'Thal result (0–3)'], ['BP_History', 'Blood-pressure history (0/1)'], ['Medication', 'Taking medication (0/1)'], ['Family_History', 'Family history (0/1)'], ['Exercise_Level', 'Low exercise level (0/1)'], ['Smoking_Status', 'Smoking status (0/1)'],
] as const;
export const getAssessmentPredictions = async (): Promise<ModelResult[]> => ['diabetes', 'heart', 'hypertension'].map((model) => ({ model: model as ModelName, error: 'Local ONNX inference is available in the iOS and Android app, not the web preview.' }));
