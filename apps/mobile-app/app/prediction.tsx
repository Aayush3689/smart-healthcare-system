import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
  id: string | number;
  name: string;
  phone?: string;
  age?: number | string;
  gender?: string;
  medicalHistory?: string[] | string;
  medical_history?: string[] | string;
  history?: string[] | string;
  medications?: string[] | string;
  medication?: string[] | string;
  meds?: string[] | string;
}

interface Assessment {
  id: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  date?: string;
  created_at?: string;
  createdAt?: string;
  riskLevel?: 'High' | 'Medium' | 'Low' | string;
  risk_level?: 'High' | 'Medium' | 'Low' | string;
  risk?: 'High' | 'Medium' | 'Low' | string;
  symptoms?: string[] | string;
  additionalDetails?: string;
  additional_details?: string;
  notes?: string;
  medicalHistory?: string[] | string;
  medical_history?: string[] | string;
  history?: string[] | string;
  medications?: string[] | string;
  medication?: string[] | string;
  meds?: string[] | string;
  vitals?: Record<string, any>;
  [key: string]: any;
}

export default function PredictionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);

  // Format array or string lists cleanly
  const formatList = (item?: string[] | string): string => {
    if (!item) return '';
    if (Array.isArray(item)) return item.filter(Boolean).join(', ');
    if (typeof item === 'string') return item.trim();
    return String(item);
  };

  // Helper to resolve Medical History from patient or assessment
  const getMedicalHistory = (patient?: Patient, assessment?: Assessment): string => {
    const fromPatient = patient
      ? formatList(patient?.medicalHistory) ||
        formatList(patient?.medical_history) ||
        formatList(patient?.history)
      : '';

    const fromAssessment = assessment
      ? formatList(assessment?.medicalHistory) ||
        formatList(assessment?.medical_history) ||
        formatList(assessment?.history)
      : '';

    return fromPatient || fromAssessment || '';
  };

  // Helper to resolve Medications from patient or assessment
  const getMedications = (patient?: Patient, assessment?: Assessment): string => {
    const fromPatient = patient
      ? formatList(patient?.medications) ||
        formatList(patient?.medication) ||
        formatList(patient?.meds)
      : '';

    const fromAssessment = assessment
      ? formatList(assessment?.medications) ||
        formatList(assessment?.medication) ||
        formatList(assessment?.meds)
      : '';

    return fromPatient || fromAssessment || '';
  };

  // Helper to resolve Additional Details
  const getAdditionalDetails = (assessment?: Assessment): string => {
    if (!assessment) return '';
    return (
      formatList(assessment?.additionalDetails) ||
      formatList(assessment?.additional_details) ||
      formatList(assessment?.notes) ||
      ''
    );
  };

  // Comprehensive helper to extract oxygen saturation
  const getOxygen = (assessment?: Assessment) => {
    if (!assessment) return undefined;
    const v = assessment?.vitals || {};
    return (
      v.oxygenSaturation ??
      v.oxygen ??
      v.oxygen_level ??
      v.oxygen_saturation ??
      v.spo2 ??
      v.spO2 ??
      v.SpO2 ??
      assessment.oxygenSaturation ??
      assessment.oxygen ??
      assessment.oxygen_level ??
      assessment.oxygen_saturation ??
      assessment.spo2 ??
      assessment.spO2 ??
      assessment.SpO2
    );
  };

  // Comprehensive helper to extract heart rate
  const getHeartRate = (assessment?: Assessment) => {
    if (!assessment) return undefined;
    const v = assessment?.vitals || {};
    return (
      v.heartRate ??
      v.heart_rate ??
      v.pulse ??
      v.heartRateBpm ??
      assessment.heartRate ??
      assessment.heart_rate ??
      assessment.pulse ??
      assessment.heartRateBpm
    );
  };

  // Helper to extract Systolic BP
  const getSysBP = (assessment?: Assessment) => {
    if (!assessment) return undefined;
    const v = assessment?.vitals || {};
    return v.sysBP ?? v.sys_bp ?? v.systolic ?? assessment.sysBP ?? assessment.sys_bp ?? assessment.systolic;
  };

  // Helper to extract Diastolic BP
  const getDiaBP = (assessment?: Assessment) => {
    if (!assessment) return undefined;
    const v = assessment?.vitals || {};
    return v.diaBP ?? v.dia_bp ?? v.diastolic ?? assessment.diaBP ?? assessment.dia_bp ?? assessment.diastolic;
  };

  // Helper to extract date
  const getAssessmentDate = (assessment?: Assessment) => {
    if (!assessment) return '';
    return assessment?.date || assessment?.created_at || assessment?.createdAt || '';
  };

  // Helper to extract or dynamically calculate risk level
  const getRiskLevel = (assessment?: Assessment): 'High' | 'Medium' | 'Low' => {
    if (!assessment) return 'Low';

    const explicitRisk = assessment?.riskLevel || assessment?.risk_level || assessment?.risk;
    if (explicitRisk && ['High', 'Medium', 'Low'].includes(String(explicitRisk))) {
      return explicitRisk as 'High' | 'Medium' | 'Low';
    }

    // Dynamic fallback calculation if risk level property is missing/unrecognized
    const oxygen = Number(getOxygen(assessment));
    const heartRate = Number(getHeartRate(assessment));
    const sysBP = Number(getSysBP(assessment));

    if ((!isNaN(oxygen) && oxygen < 92) || (!isNaN(heartRate) && heartRate > 120) || (!isNaN(sysBP) && sysBP > 160)) {
      return 'High';
    }

    if ((!isNaN(oxygen) && oxygen < 95) || (!isNaN(heartRate) && heartRate > 100) || (!isNaN(sysBP) && sysBP > 140)) {
      return 'Medium';
    }

    return 'Low';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [storedPatients, storedAssessments] = await Promise.all([
        AsyncStorage.getItem('patients'),
        AsyncStorage.getItem('healthAssessments'),
      ]);

      const parsedPatients: Patient[] = storedPatients ? JSON.parse(storedPatients) : [];
      const parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

      setPatients(parsedPatients);
      setAssessments(parsedAssessments);
    } catch (error) {
      console.error('Failed to load predictions data:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Return EVERY assessment separately mapped to its patient
  const getAllAssessmentCases = () => {
    const sortedAssessments = [...assessments].sort((a, b) => {
      const dateA = new Date(getAssessmentDate(a)).getTime() || 0;
      const dateB = new Date(getAssessmentDate(b)).getTime() || 0;
      return dateB - dateA;
    });

    return sortedAssessments.map((assessment) => {
      const pId = assessment?.patientId ?? assessment?.patient_id;
      const patient = patients.find((p) => String(p.id) === String(pId)) || {
        id: pId || 'unknown',
        name: pId ? `Patient #${pId}` : 'Unknown Patient',
      };

      return {
        patient,
        assessment,
      };
    });
  };

  const allCases = getAllAssessmentCases();

  // Helper to construct transparent risk factor explanations
  const getRiskExplanation = (assessment: Assessment) => {
    const factors: string[] = [];

    const oxygen = getOxygen(assessment);
    const heartRate = getHeartRate(assessment);
    const sysBP = getSysBP(assessment);

    if (oxygen !== undefined && oxygen !== null && !isNaN(Number(oxygen))) {
      const o2Num = Number(oxygen);
      if (o2Num < 92) {
        factors.push(`Low oxygen saturation (${o2Num}%)`);
      } else if (o2Num < 95) {
        factors.push(`Borderline oxygen saturation (${o2Num}%)`);
      }
    }

    if (heartRate !== undefined && heartRate !== null && !isNaN(Number(heartRate))) {
      const hrNum = Number(heartRate);
      if (hrNum > 100) {
        factors.push(`Elevated heart rate (${hrNum} bpm)`);
      } else if (hrNum < 60) {
        factors.push(`Low heart rate (${hrNum} bpm)`);
      }
    }

    if (sysBP !== undefined && sysBP !== null && !isNaN(Number(sysBP))) {
      const sNum = Number(sysBP);
      if (sNum > 140) {
        factors.push(`High systolic blood pressure (${sNum} mmHg)`);
      }
    }

    const formattedSymptoms = formatList(assessment?.symptoms);
    if (formattedSymptoms) {
      factors.push(`Reported symptoms: ${formattedSymptoms}`);
    }

    const addDetails = getAdditionalDetails(assessment);
    if (addDetails) {
      factors.push(`Additional notes: ${addDetails}`);
    }

    if (factors.length === 0) {
      factors.push('All recorded vital signs fall within standard baseline ranges.');
    }

    return factors;
  };

  const getRecommendedAction = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return 'Seek medical evaluation promptly. Urgent clinical intervention recommended.';
      case 'Medium':
        return 'Schedule a follow-up assessment within 24–48 hours and monitor vitals closely.';
      case 'Low':
      default:
        return 'Continue routine monitoring and health maintenance.';
    }
  };

  const getBadgeStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' };
      case 'Medium':
        return { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' };
      case 'Low':
      default:
        return { bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading AI Health Predictions...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>AI Health Predictions</Text>
          <Text style={styles.subtitle}>
            Showing all {allCases.length} assessment records across all patients.
          </Text>
        </View>

        {/* Clinical Disclaimer Banner */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle-outline" size={22} color="#0369A1" />
          <View style={styles.disclaimerTextContainer}>
            <Text style={styles.disclaimerTitle}>App-Level Risk Assessment</Text>
            <Text style={styles.disclaimerBody}>
              Calculated automatically using recorded vital thresholds. This summary is intended to assist field triage and is not a formal medical diagnosis.
            </Text>
          </View>
        </View>

        {/* Assessment Cases List */}
        {allCases.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="analytics-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Assessments Found</Text>
            <Text style={styles.emptySubtitle}>
              Perform health assessments on patients to view predictive risk analysis here.
            </Text>
          </View>
        ) : (
          allCases.map(({ patient, assessment }, index) => {
            const oxygen = getOxygen(assessment);
            const heartRate = getHeartRate(assessment);
            const sysBP = getSysBP(assessment);
            const diaBP = getDiaBP(assessment);
            const rawDate = getAssessmentDate(assessment);
            const riskLevel = getRiskLevel(assessment);

            const badge = getBadgeStyle(riskLevel);
            const riskFactors = getRiskExplanation(assessment);
            const recommendedAction = getRecommendedAction(riskLevel);

            const symptomsStr = formatList(assessment?.symptoms);
            const medHistoryStr = getMedicalHistory(patient, assessment);
            const medicationsStr = getMedications(patient, assessment);
            const additionalDetailsStr = getAdditionalDetails(assessment);

            return (
              <View key={`${assessment.id}-${index}`} style={styles.card}>
                {/* Patient Header & Risk Badge */}
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.patientName}>{patient.name}</Text>
                    <Text style={styles.assessmentDate}>
                      Assessment Date: {rawDate ? new Date(rawDate).toLocaleDateString() : 'N/A'}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.riskBadge,
                      { backgroundColor: badge.bg, borderColor: badge.border },
                    ]}>
                    <Text style={[styles.riskBadgeText, { color: badge.text }]}>
                      {riskLevel} Risk
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Vitals Summary */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vital Signs & Metrics</Text>
                  <View style={styles.vitalsRow}>
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>Oxygen (SpO2)</Text>
                      <Text style={styles.vitalValue}>
                        {oxygen !== undefined && oxygen !== null && oxygen !== '' ? `${oxygen}%` : 'N/A'}
                      </Text>
                    </View>
                    <View style={styles.vitalMetric}>
                      <Text style={styles.vitalLabel}>Heart Rate</Text>
                      <Text style={styles.vitalValue}>
                        {heartRate !== undefined && heartRate !== null && heartRate !== '' ? `${heartRate} bpm` : 'N/A'}
                      </Text>
                    </View>
                    {sysBP !== undefined && diaBP !== undefined && (
                      <View style={styles.vitalMetric}>
                        <Text style={styles.vitalLabel}>BP</Text>
                        <Text style={styles.vitalValue}>
                          {sysBP}/{diaBP}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Symptoms & Medical Background */}
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Symptoms:</Text>
                    <Text style={styles.infoValue}>
                      {symptomsStr || 'None reported'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Medical History:</Text>
                    <Text style={styles.infoValue}>
                      {medHistoryStr || 'None recorded'}
                    </Text>
                  </View>

                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Current Medication:</Text>
                    <Text style={styles.infoValue}>
                      {medicationsStr || 'None recorded'}
                    </Text>
                  </View>

                  {additionalDetailsStr ? (
                    <View style={styles.infoItem}>
                      <Text style={styles.infoLabel}>Additional Details:</Text>
                      <Text style={styles.infoValue}>{additionalDetailsStr}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Risk Factors Explanation */}
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationTitle}>Classification Drivers</Text>
                  {riskFactors.map((factor, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                      <Text style={styles.bulletPoint}>•</Text>
                      <Text style={styles.bulletText}>{factor}</Text>
                    </View>
                  ))}
                </View>

                {/* Actionable Recommendations */}
                <View style={styles.actionBox}>
                  <Text style={styles.actionTitle}>Recommended Action</Text>
                  <Text style={styles.actionText}>{recommendedAction}</Text>
                </View>

                {/* Patient Navigation Button */}
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() =>
                    router.push({
                      pathname: '/patient-details',
                      params: { id: String(patient.id) },
                    })
                  }>
                  <Text style={styles.detailsButtonText}>View Patient Profile</Text>
                  <Ionicons name="chevron-forward" size={16} color="#0284C7" />
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  disclaimerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 2,
  },
  disclaimerBody: {
    fontSize: 12,
    color: '#0284C7',
    lineHeight: 17,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  patientName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  assessmentDate: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  vitalsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'space-around',
  },
  vitalMetric: {
    alignItems: 'center',
  },
  vitalLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
  },
  vitalValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  infoGrid: {
    marginBottom: 12,
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  explanationBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#B45309',
    marginRight: 6,
  },
  bulletText: {
    fontSize: 12,
    color: '#78350F',
    flex: 1,
  },
  actionBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    color: '#15803D',
    lineHeight: 16,
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  detailsButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    marginRight: 4,
  },
});