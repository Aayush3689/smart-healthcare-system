// AI Service API Configuration
const RAW_URL = 'https://1c8lh2rq-8000.inc1.devtunnels.ms';

// Automatically strips any trailing slashes to avoid URL formatting bugs (e.g. '//clinical-risk')
const AI_BASE_URL = RAW_URL.replace(/\/+$/, '');

/**
 * Generic POST request helper for JSON payloads
 */
async function postJSON<T>(endpoint: string, payload: object): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${AI_BASE_URL}${cleanEndpoint}`;

  console.log('[AI Service] Sending JSON Request to:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Required header for MS Dev Tunnels to bypass anti-phishing landing pages during background fetch
      'X-DevTunnels-Skip-AntiPhishing-Page': 'true'
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Service Error (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

/**
 * Generic POST request helper for multipart/form-data (File Uploads)
 */
async function postFormData<T>(endpoint: string, file: File, fieldName: string): Promise<T> {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${AI_BASE_URL}${cleanEndpoint}`;

  console.log('[AI Service] Sending Multipart File Request to:', url);

  const formData = new FormData();
  formData.append(fieldName, file);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Required header for MS Dev Tunnels
      'X-DevTunnels-Skip-AntiPhishing-Page': 'true'
    },
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI Service Error (${response.status}): ${errorText || response.statusText}`);
  }
  return response.json();
}

// Service Export
export const aiService = {
  // 1. Disease Predictions
  predictDiabetes: (data: object) => postJSON('/predict/diabetes', data),
  predictHeart: (data: object) => postJSON('/predict/heart', data),
  predictHypertension: (data: object) => postJSON('/predict/hypertension', data),

  // 2. Clinical Risk Assessment / Triage
  getClinicalRisk: (data: {
    symptoms: string;
    temperature: number;
    blood_pressure: string;
    heart_rate: number;
    oxygen_saturation: number;
    medical_history: string;
    current_medications: string;
    additional_notes: string;
  }) => postJSON('/clinical-risk', data),

  // 3. OCR Prescription Upload
  uploadOCR: (file: File) => postFormData('/ocr', file, 'file'),

  // 4. Speech-to-Text Voice Upload
  uploadSpeech: (audioFile: File) => postFormData('/speech', audioFile, 'file'),
};