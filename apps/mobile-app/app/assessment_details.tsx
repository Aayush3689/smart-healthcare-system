import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
  id?: string | number;
  _id?: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  name?: string;
  phone?: string | number;
  age?: number | string;
  gender?: string;
  medicalHistory?: string[] | string;
  medications?: string[] | string;
  [key: string]: any;
}

interface Assessment {
  id?: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  date?: string;
  created_at?: string;
  createdAt?: string;
  riskLevel?: string;
  symptoms?: string[] | string;
  additionalDetails?: string;
  additional_details?: string;
  notes?: string;
  medicalHistory?: string[] | string;
  medical_history?: string[] | string;
  medications?: string[] | string;
  medication?: string[] | string;
  vitals?: Record<string, any>;
  [key: string]: any;
}

export default function AssessmentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);

  const formatList = (item?: string[] | string): string => {
    if (!item) return '';
    if (Array.isArray(item)) return item.filter(Boolean).join(', ');
    if (typeof item === 'string') return item.trim();
    return String(item);
  };

  const getOxygen = (item?: Assessment) => {
    if (!item) return undefined;
    const v = item?.vitals || {};
    return (
      v.oxygenSaturation ??
      v.oxygen ??
      v.spo2 ??
      item.oxygenSaturation ??
      item.oxygen ??
      item.spo2
    );
  };

  const getHeartRate = (item?: Assessment) => {
    if (!item) return undefined;
    const v = item?.vitals || {};
    return (
      v.heartRate ??
      v.heart_rate ??
      v.pulse ??
      item.heartRate ??
      item.heart_rate ??
      item.pulse
    );
  };

  const getBloodPressure = (item?: Assessment) => {
    if (!item) return { sys: undefined, dia: undefined, combined: undefined };
    const v = item?.vitals || {};
    const sys = v.sysBP ?? v.sys_bp ?? item.sysBP ?? item.sys_bp;
    const dia = v.diaBP ?? v.dia_bp ?? item.diaBP ?? item.dia_bp;
    const combined = v.bloodPressure ?? v.bp ?? item.bloodPressure ?? item.bp;
    return { sys, dia, combined };
  };

  const loadDetails = async () => {
    try {
      setLoading(true);
      const [storedPatients, storedAssessments] = await Promise.all([
        AsyncStorage.getItem('patients'),
        AsyncStorage.getItem('healthAssessments'),
      ]);

      const parsedPatients: Patient[] = storedPatients ? JSON.parse(storedPatients) : [];
      const parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

      const targetAssessmentId = String(id).trim();

      const foundAssessment = parsedAssessments.find((a) => {
        const aId = String(a.id ?? '').trim();
        return aId === targetAssessmentId;
      }) || null;

      if (foundAssessment) {
        const pIdStr = String(foundAssessment.patientId ?? foundAssessment.patient_id ?? '').trim();
        const foundPatient = parsedPatients.find((p) => {
          const pId = String(p.id ?? p.patientId ?? p._id ?? '').trim();
          return pId === pIdStr;
        }) || null;

        setPatient(foundPatient);
      }

      setAssessment(foundAssessment);
    } catch (error) {
      console.error('Failed to load assessment details:', error);
      Alert.alert('Error', 'Failed to load assessment details.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadDetails();
    }, [id])
  );

  const handleEditAssessment = () => {
    const patientId = String(
      assessment?.patientId ?? assessment?.patient_id ?? patient?.id ?? ''
    );
    router.push({
      pathname: '/health-assessment',
      params: {
        assessmentId: String(id),
        patientId,
      },
    });
  };

  const handleDeleteAssessment = () => {
    Alert.alert(
      'Delete Assessment',
      'Are you sure you want to delete this assessment record? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const storedAssessments = await AsyncStorage.getItem('healthAssessments');
              const parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

              const targetIdStr = String(id).trim();
              const updatedAssessments = parsedAssessments.filter(
                (a) => String(a.id).trim() !== targetIdStr
              );

              await AsyncStorage.setItem('healthAssessments', JSON.stringify(updatedAssessments));

              Alert.alert('Deleted', 'The assessment record has been removed.', [
                {
                  text: 'OK',
                  onPress: () => router.back(),
                },
              ]);
            } catch (error) {
              console.error('Failed to delete assessment:', error);
              Alert.alert('Error', 'Failed to delete assessment. Please try again.');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading Assessment Details...</Text>
      </View>
    );
  }

  if (!assessment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.notFoundContainer}>
          <Ionicons name="alert-circle-outline" size={56} color="#CBD5E1" />
          <Text style={styles.notFoundTitle}>Assessment Record Not Found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dateStr = assessment?.date || assessment?.created_at || assessment?.createdAt || '';

  const oxygen = getOxygen(assessment);
  const heartRate = getHeartRate(assessment);
  const { sys, dia, combined } = getBloodPressure(assessment);

  const bpDisplay =
    sys !== undefined && dia !== undefined
      ? `${sys}/${dia}`
      : combined
      ? String(combined)
      : 'N/A';

  const symptomsText = formatList(assessment?.symptoms) || 'None reported';

  const assessmentMedHistory = formatList(assessment?.medicalHistory || assessment?.medical_history);
  const patientMedHistory = formatList(patient?.medicalHistory || patient?.medical_history);
  const finalMedicalHistory = assessmentMedHistory || patientMedHistory || 'None';

  const assessmentMeds = formatList(assessment?.medications || assessment?.medication);
  const patientMeds = formatList(patient?.medications || patient?.medication);
  const finalMedications = assessmentMeds || patientMeds || 'None';

  const additionalNotes =
    formatList(assessment?.additionalDetails || assessment?.additional_details || assessment?.notes) || 'None';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Vitals Cards Row */}
        <View style={styles.vitalsRow}>
          <View style={styles.vitalCard}>
            <Text style={styles.vitalValue}>{bpDisplay}</Text>
            <Text style={styles.vitalLabel}>Blood Pressure</Text>
          </View>

          <View style={styles.vitalCard}>
            <Text style={styles.vitalValue}>
              {oxygen !== undefined && oxygen !== null && oxygen !== '' ? `${oxygen}%` : 'N/A'}
            </Text>
            <Text style={styles.vitalLabel}>Oxygen</Text>
          </View>

          {heartRate !== undefined && heartRate !== null && heartRate !== '' && (
            <View style={styles.vitalCard}>
              <Text style={styles.vitalValue}>{heartRate} bpm</Text>
              <Text style={styles.vitalLabel}>Heart Rate</Text>
            </View>
          )}
        </View>

        {/* Symptoms Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Reported Symptoms</Text>
          <View style={styles.sectionBody}>
            <Text style={styles.sectionText}>{symptomsText}</Text>
          </View>
        </View>

        {/* Medical History Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Medical History</Text>
          <View style={styles.sectionBody}>
            <Text style={styles.sectionText}>{finalMedicalHistory}</Text>
          </View>
        </View>

        {/* Current Medications Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Current Medications</Text>
          <View style={styles.sectionBody}>
            <Text style={styles.sectionText}>{finalMedications}</Text>
          </View>
        </View>

        {/* Additional Notes Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Additional Notes</Text>
          <View style={styles.sectionBody}>
            <Text style={styles.sectionText}>{additionalNotes}</Text>
          </View>
        </View>

        {/* Assessment Date Pill */}
        <View style={styles.dateCard}>
          <View style={styles.clockIconBox}>
            <Ionicons name="time-outline" size={20} color="#64748B" />
          </View>
          <View>
            <Text style={styles.dateLabel}>Assessment Date</Text>
            <Text style={styles.dateValue}>
              {dateStr ? new Date(dateStr).toLocaleString() : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Edit Assessment Button */}
        <TouchableOpacity style={styles.editButton} onPress={handleEditAssessment}>
          <Text style={styles.editButtonEmoji}>✏️</Text>
          <Text style={styles.editButtonText}>Edit Assessment</Text>
        </TouchableOpacity>

        {/* Delete Assessment Button */}
        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAssessment}>
          <Ionicons name="trash-outline" size={18} color="#DC2626" />
          <Text style={styles.deleteButtonText}>Delete Assessment</Text>
        </TouchableOpacity>

        {/* Back to Patient Button */}
        <TouchableOpacity style={styles.backToPatientButton} onPress={() => router.back()}>
          <Text style={styles.backToPatientText}>Back to Patient</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          This assessment is for informational purposes only and does not replace professional medical advice.
        </Text>
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
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
    marginBottom: 16,
  },
  backButton: {
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  vitalsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  vitalLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  sectionBody: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
  },
  dateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  clockIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  editButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1.5,
    borderColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  editButtonEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  editButtonText: {
    color: '#0D9488',
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  deleteButtonText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  backToPatientButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  backToPatientText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});