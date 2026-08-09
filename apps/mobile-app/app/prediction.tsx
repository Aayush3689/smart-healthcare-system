import React, { useCallback, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AssessmentModelInputs, getAssessmentPredictions, ModelName, ModelResult } from '@/lib/ai-predictions';
import { offlineStorage } from '@/lib/offline-storage';

type Patient = { id: string | number; name?: string; age?: string | number; gender?: string };
type Assessment = {
  id: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  date?: string;
  createdAt?: string;
  created_at?: string;
  symptoms?: string[] | string;
  medicalHistory?: string[] | string;
  medical_history?: string[] | string;
  medications?: string[] | string;
  medication?: string[] | string;
  vitals?: Record<string, unknown>;
  modelInputs?: AssessmentModelInputs;
};

const modelLabels: Record<ModelName, string> = {
  diabetes: 'Diabetes model',
  heart: 'Heart disease model',
  hypertension: 'Hypertension model',
};

const toList = (value?: string[] | string) =>
  Array.isArray(value) ? value.filter(Boolean) : value ? value.split(',').map((item) => item.trim()).filter(Boolean) : [];
const getVital = (assessment: Assessment, ...keys: string[]) => {
  const vitals = assessment.vitals || {};
  return keys.map((key) => vitals[key]).find((value) => value !== undefined) ?? keys.map((key) => (assessment as Record<string, unknown>)[key]).find((value) => value !== undefined);
};
const getDate = (assessment: Assessment) => assessment.date || assessment.createdAt || assessment.created_at || '';
const riskStyle = (risk: string) => {
  const normalized = risk.toLowerCase();
  if (normalized.includes('high') || normalized.includes('critical')) return styles.highRisk;
  if (normalized.includes('medium')) return styles.mediumRisk;
  return styles.lowRisk;
};

export default function PredictionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cases, setCases] = useState<{ patient: Patient; assessment: Assessment; results: ModelResult[] }[]>([]);

  const loadPredictions = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [storedPatients, storedAssessments] = await Promise.all([
        offlineStorage.getItem('patients'),
        offlineStorage.getItem('healthAssessments'),
      ]);
      const patients: Patient[] = storedPatients ? JSON.parse(storedPatients) : [];
      const assessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];
      const sorted = [...assessments].sort((a, b) => (new Date(getDate(b)).getTime() || 0) - (new Date(getDate(a)).getTime() || 0));

      const resolved = await Promise.all(sorted.map(async (assessment) => {
        const patientId = assessment.patientId ?? assessment.patient_id;
        const patient = patients.find((item) => String(item.id) === String(patientId)) || { id: String(patientId || 'unknown'), name: 'Unknown patient' };
        const results = await getAssessmentPredictions({
          age: patient.age,
          gender: patient.gender,
          assessment: assessment.modelInputs || {},
          oxygen: getVital(assessment, 'oxygenSaturation', 'oxygen', 'spo2'),
          heartRate: getVital(assessment, 'heartRate', 'heart_rate', 'pulse'),
          systolicBP: getVital(assessment, 'sysBP', 'sys_bp', 'systolic'),
          diastolicBP: getVital(assessment, 'diaBP', 'dia_bp', 'diastolic'),
          symptoms: toList(assessment.symptoms),
          medicalHistory: toList(assessment.medicalHistory || assessment.medical_history),
          medications: toList(assessment.medications || assessment.medication),
        });
        return { patient, assessment, results };
      }));
      setCases(resolved);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to load prediction data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void loadPredictions(); }, [loadPredictions]));

  if (loading) return <View style={styles.loading}><ActivityIndicator size="large" color="#0284C7" /><Text style={styles.loadingText}>Running AI models…</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}><Text style={styles.title}>AI Health Predictions</Text><Text style={styles.subtitle}>Results are returned directly by the integrated disease models.</Text></View>
        <View style={styles.notice}><Ionicons name="information-circle-outline" size={21} color="#0369A1" /><Text style={styles.noticeText}>Predictions require the measured model inputs in each assessment. Missing inputs are shown clearly; no sample data or threshold-based predictions are used.</Text></View>
        {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><TouchableOpacity onPress={() => void loadPredictions()}><Text style={styles.retry}>Retry</Text></TouchableOpacity></View> : null}
        {!error && cases.length === 0 ? <View style={styles.empty}><Ionicons name="analytics-outline" size={48} color="#94A3B8" /><Text style={styles.emptyTitle}>No assessments found</Text><Text style={styles.emptyText}>Create an assessment with the required model inputs to get AI predictions.</Text></View> : null}
        {cases.map(({ patient, assessment, results }) => (
          <View key={String(assessment.id)} style={styles.caseCard}>
            <View style={styles.caseHeader}><View><Text style={styles.patientName}>{patient.name || 'Unnamed patient'}</Text><Text style={styles.date}>{getDate(assessment) ? new Date(getDate(assessment)).toLocaleDateString() : 'Assessment date unavailable'}</Text></View><TouchableOpacity onPress={() => router.push({ pathname: '/patient-details', params: { id: String(patient.id) } })}><Text style={styles.profile}>Patient profile</Text></TouchableOpacity></View>
            {results.map((result) => <PredictionCard key={result.model} result={result} />)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function PredictionCard({ result }: { result: ModelResult }) {
  if ('error' in result) return <View style={styles.unavailable}><Text style={styles.modelName}>{modelLabels[result.model]}</Text><Text style={styles.unavailableText}>{result.error}</Text></View>;
  const { prediction } = result;
  return <View style={styles.resultCard}><View style={styles.resultHeader}><Text style={styles.modelName}>{modelLabels[result.model]}</Text><View style={[styles.risk, riskStyle(prediction.risk_level)]}><Text style={styles.riskText}>{prediction.risk_level}</Text></View></View>
    <Text style={styles.outcome}>{prediction.prediction === 1 ? 'Positive prediction' : 'Negative prediction'}</Text>
    {prediction.probability !== null ? <Text style={styles.probability}>Model probability: {(prediction.probability * 100).toFixed(1)}%</Text> : null}
    {prediction.reasons?.length ? <View style={styles.reasonBox}><Text style={styles.reasonTitle}>Model factors</Text>{prediction.reasons.map((reason) => <Text key={reason} style={styles.reason}>• {reason}</Text>)}</View> : null}
    <Text style={styles.triageTitle}>Inference</Text><Text style={styles.triage}>{prediction.triage}</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, content: { padding: 16, paddingBottom: 32 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }, loadingText: { marginTop: 12, color: '#64748B' }, header: { marginBottom: 16 }, title: { fontSize: 24, fontWeight: '700', color: '#0F172A' }, subtitle: { marginTop: 4, color: '#64748B', lineHeight: 20 }, notice: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#E0F2FE', marginBottom: 16 }, noticeText: { flex: 1, color: '#0369A1', fontSize: 12, lineHeight: 17 }, error: { padding: 14, borderRadius: 12, backgroundColor: '#FEE2E2', marginBottom: 16 }, errorText: { color: '#991B1B' }, retry: { color: '#B91C1C', fontWeight: '700', marginTop: 8 }, empty: { padding: 32, alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16 }, emptyTitle: { color: '#334155', fontWeight: '700', fontSize: 18, marginTop: 12 }, emptyText: { color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 20 }, caseCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 16 }, caseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }, patientName: { fontSize: 18, fontWeight: '700', color: '#0F172A' }, date: { color: '#64748B', fontSize: 12, marginTop: 2 }, profile: { color: '#0284C7', fontWeight: '600', fontSize: 12 }, resultCard: { padding: 12, borderRadius: 12, backgroundColor: '#F8FAFC', marginTop: 10 }, unavailable: { padding: 12, borderRadius: 12, backgroundColor: '#FFF7ED', marginTop: 10 }, unavailableText: { color: '#9A3412', fontSize: 12, lineHeight: 17, marginTop: 4 }, resultHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, modelName: { color: '#334155', fontWeight: '700' }, risk: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 }, highRisk: { backgroundColor: '#FEE2E2' }, mediumRisk: { backgroundColor: '#FEF3C7' }, lowRisk: { backgroundColor: '#DCFCE7' }, riskText: { color: '#334155', fontSize: 11, fontWeight: '700' }, outcome: { color: '#0F172A', fontWeight: '600', marginTop: 9 }, probability: { color: '#475569', fontSize: 12, marginTop: 3 }, reasonBox: { marginTop: 10 }, reasonTitle: { color: '#475569', fontSize: 12, fontWeight: '700' }, reason: { color: '#64748B', fontSize: 12, marginTop: 3 }, triageTitle: { color: '#475569', fontSize: 12, fontWeight: '700', marginTop: 10 }, triage: { color: '#334155', fontSize: 12, lineHeight: 17, marginTop: 3 },
});
