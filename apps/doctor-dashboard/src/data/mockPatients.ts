import { Patient } from '../types';

export const mockPatients: Patient[] = [
  {
    id: 'P-10245',
    name: 'Rahul Kumar',
    age: 60,
    gender: 'Male',
    village: 'Village A',
    phone: '+91 98765 43210',
    ashaWorkerName: 'Sunita Devi',
    ashaWorkerId: 'asha-1',
    smokingStatus: 'Yes',
    familyHistoryDiabetes: true,
    familyHistoryHypertension: true,
    vitals: {
      bloodPressureSys: 180,
      bloodPressureDia: 110,
      bloodSugar: 205,
      temperature: 98.6,
      spo2: 96,
      weight: 89,
      height: 174,
      bmi: 29.4
    },
    overallRisk: 'HIGH',
    diseaseRisks: [
      { disease: 'Diabetes', riskScore: 92, riskLevel: 'HIGH' },
      { disease: 'Hypertension', riskScore: 94, riskLevel: 'HIGH' },
      { disease: 'Heart Disease', riskScore: 76, riskLevel: 'MODERATE' },
      { disease: 'Anemia', riskScore: 18, riskLevel: 'LOW' },
      { disease: 'CKD', riskScore: 42, riskLevel: 'MODERATE' }
    ],
    explainableFactors: [
      { factor: 'High Blood Pressure', importance: 95, description: '180/110 mmHg is significantly above normal range' },
      { factor: 'High Blood Sugar', importance: 90, description: 'Fasting glucose of 205 mg/dL indicates poor glycemic control' },
      { factor: 'High BMI', importance: 78, description: 'BMI 29.4 falls into the overweight category' },
      { factor: 'Family History', importance: 65, description: 'Strong genetic predisposition for Diabetes & Hypertension' },
      { factor: 'Smoking', importance: 50, description: 'Active tobacco use exacerbates vascular damage risks' }
    ],
    aiRecommendation: 'Patient presents severe hypertension & hyperglycemia. Immediate clinical review at primary health center within 24 hours recommended.',
    lastAssessmentDate: '2026-08-07'
  },
  {
    id: 'P-10246',
    name: 'Asha Devi',
    age: 52,
    gender: 'Female',
    village: 'Village B',
    phone: '+91 98765 43211',
    ashaWorkerName: 'Rina Das',
    ashaWorkerId: 'asha-2',
    smokingStatus: 'No',
    familyHistoryDiabetes: true,
    familyHistoryHypertension: false,
    vitals: {
      bloodPressureSys: 165,
      bloodPressureDia: 100,
      bloodSugar: 220,
      temperature: 98.4,
      spo2: 97,
      weight: 78,
      height: 158,
      bmi: 31.2
    },
    overallRisk: 'HIGH',
    diseaseRisks: [
      { disease: 'Diabetes', riskScore: 95, riskLevel: 'HIGH' },
      { disease: 'Hypertension', riskScore: 88, riskLevel: 'HIGH' },
      { disease: 'Heart Disease', riskScore: 62, riskLevel: 'MODERATE' },
      { disease: 'Anemia', riskScore: 25, riskLevel: 'LOW' },
      { disease: 'CKD', riskScore: 38, riskLevel: 'LOW' }
    ],
    explainableFactors: [
      { factor: 'High Blood Sugar', importance: 96, description: 'Elevated glucose 220 mg/dL' },
      { factor: 'High Blood Pressure', importance: 88, description: 'Stage 2 Hypertension readings' },
      { factor: 'High BMI', importance: 82, description: 'Obesity Class I' }
    ],
    aiRecommendation: 'High cardiovascular and metabolic risk. Recommend clinical review within 48 hours for glucose regimen evaluation.',
    lastAssessmentDate: '2026-08-06'
  },
  {
    id: 'P-10247',
    name: 'Mohan Das',
    age: 45,
    gender: 'Male',
    village: 'Village A',
    phone: '+91 98765 43212',
    ashaWorkerName: 'Sunita Devi',
    ashaWorkerId: 'asha-1',
    smokingStatus: 'Yes',
    familyHistoryDiabetes: false,
    familyHistoryHypertension: true,
    vitals: {
      bloodPressureSys: 142,
      bloodPressureDia: 92,
      bloodSugar: 145,
      temperature: 98.6,
      spo2: 98,
      weight: 72,
      height: 168,
      bmi: 25.5
    },
    overallRisk: 'MODERATE',
    diseaseRisks: [
      { disease: 'Diabetes', riskScore: 55, riskLevel: 'MODERATE' },
      { disease: 'Hypertension', riskScore: 68, riskLevel: 'MODERATE' },
      { disease: 'Heart Disease', riskScore: 52, riskLevel: 'MODERATE' },
      { disease: 'Anemia', riskScore: 12, riskLevel: 'LOW' },
      { disease: 'CKD', riskScore: 20, riskLevel: 'LOW' }
    ],
    explainableFactors: [
      { factor: 'Elevated BP', importance: 70, description: '142/92 mmHg Stage 1 HTN' },
      { factor: 'Smoking', importance: 65, description: 'Lifestyle risk factor' }
    ],
    aiRecommendation: 'Lifestyle counseling and routine 30-day follow-up screening.',
    lastAssessmentDate: '2026-08-05'
  },
  {
    id: 'P-10248',
    name: 'Savitri Bai',
    age: 68,
    gender: 'Female',
    village: 'Village C',
    phone: '+91 98765 43213',
    ashaWorkerName: 'Pooja Singh',
    ashaWorkerId: 'asha-3',
    smokingStatus: 'No',
    familyHistoryDiabetes: false,
    familyHistoryHypertension: true,
    vitals: {
      bloodPressureSys: 175,
      bloodPressureDia: 105,
      bloodSugar: 130,
      temperature: 98.1,
      spo2: 94,
      weight: 60,
      height: 152,
      bmi: 26.0
    },
    overallRisk: 'HIGH',
    diseaseRisks: [
      { disease: 'Diabetes', riskScore: 35, riskLevel: 'LOW' },
      { disease: 'Hypertension', riskScore: 91, riskLevel: 'HIGH' },
      { disease: 'Heart Disease', riskScore: 82, riskLevel: 'HIGH' },
      { disease: 'Anemia', riskScore: 40, riskLevel: 'MODERATE' },
      { disease: 'CKD', riskScore: 58, riskLevel: 'MODERATE' }
    ],
    explainableFactors: [
      { factor: 'Severe Hypertension', importance: 94, description: '175/105 mmHg in elderly patient' },
      { factor: 'Age factor', importance: 60, description: 'Vascular stiffness with age' }
    ],
    aiRecommendation: 'Urgent medical consultation needed to prevent end-organ hypertensive complications.',
    lastAssessmentDate: '2026-08-04'
  }
];