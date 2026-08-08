import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Assessment {
  id?: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  date?: string;
  riskLevel?: string;
  symptoms?: string[] | string;
  additionalDetails?: string;
  medicalHistory?: string[] | string;
  medications?: string[] | string;
  vitals?: Record<string, any>;
  [key: string]: any;
}

export default function HealthAssessmentScreen() {
  const router = useRouter();
  const { patientId, assessmentId } = useLocalSearchParams<{
    patientId: string;
    assessmentId: string;
  }>();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [oxygenSaturation, setOxygenSaturation] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [sysBP, setSysBP] = useState('');
  const [diaBP, setDiaBP] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [medications, setMedications] = useState('');
  const [additionalDetails, setAdditionalDetails] = useState('');

  const isEditing = !!assessmentId;

  useEffect(() => {
    loadAssessmentData();
  }, [assessmentId, patientId]);

  const formatListString = (item?: string[] | string): string => {
    if (!item) return '';
    if (Array.isArray(item)) return item.filter(Boolean).join(', ');
    if (typeof item === 'string') return item.trim();
    return String(item);
  };

  const loadAssessmentData = async () => {
    try {
      setLoading(true);

      // If opening an existing assessment, pre-fill all fields
      if (assessmentId) {
        const storedAssessments = await AsyncStorage.getItem('healthAssessments');
        const parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

        const target = parsedAssessments.find(
          (a) => String(a.id).trim() === String(assessmentId).trim()
        );

        if (target) {
          const v = target.vitals || {};
          const oxygen =
            v.oxygenSaturation ?? v.oxygen ?? v.spo2 ?? target.oxygenSaturation ?? target.spo2 ?? '';
          const hr =
            v.heartRate ?? v.heart_rate ?? v.pulse ?? target.heartRate ?? target.pulse ?? '';
          const sys =
            v.sysBP ?? v.sys_bp ?? v.systolic ?? target.sysBP ?? target.systolic ?? '';
          const dia =
            v.diaBP ?? v.dia_bp ?? v.diastolic ?? target.diaBP ?? target.diastolic ?? '';

          setOxygenSaturation(oxygen !== '' ? String(oxygen) : '');
          setHeartRate(hr !== '' ? String(hr) : '');
          setSysBP(sys !== '' ? String(sys) : '');
          setDiaBP(dia !== '' ? String(dia) : '');
          setSymptoms(formatListString(target.symptoms));
          setMedicalHistory(formatListString(target.medicalHistory || target.medical_history));
          setMedications(formatListString(target.medications || target.medication));
          setAdditionalDetails(target.additionalDetails || target.additional_details || target.notes || '');
        }
      } else {
        // Explicitly clear all fields for NEW Health Assessment
        setOxygenSaturation('');
        setHeartRate('');
        setSysBP('');
        setDiaBP('');
        setSymptoms('');
        setMedicalHistory('');
        setMedications('');
        setAdditionalDetails('');
      }
    } catch (error) {
      console.error('Failed to load assessment data:', error);
      Alert.alert('Error', 'Failed to load existing assessment details.');
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskLevel = (o2: number, hr: number, sBP: number): 'High' | 'Medium' | 'Low' => {
    if ((!isNaN(o2) && o2 > 0 && o2 < 92) || (!isNaN(hr) && hr > 120) || (!isNaN(sBP) && sBP > 160)) {
      return 'High';
    }
    if ((!isNaN(o2) && o2 > 0 && o2 < 95) || (!isNaN(hr) && hr > 100) || (!isNaN(sBP) && sBP > 140)) {
      return 'Medium';
    }
    return 'Low';
  };

  const handleSave = async () => {
    const o2Num = parseFloat(oxygenSaturation);
    const hrNum = parseFloat(heartRate);
    const sysNum = parseFloat(sysBP);
    const diaNum = parseFloat(diaBP);

    const calculatedRisk = calculateRiskLevel(o2Num, hrNum, sysNum);

    const symptomArray = symptoms
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const historyArray = medicalHistory
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const medsArray = medications
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      setSaving(true);
      const storedAssessments = await AsyncStorage.getItem('healthAssessments');
      let parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

      if (isEditing) {
        parsedAssessments = parsedAssessments.map((item) => {
          if (String(item.id).trim() === String(assessmentId).trim()) {
            return {
              ...item,
              riskLevel: calculatedRisk,
              risk_level: calculatedRisk,
              symptoms: symptomArray,
              medicalHistory: historyArray,
              medical_history: historyArray,
              medications: medsArray,
              medication: medsArray,
              additionalDetails: additionalDetails.trim(),
              notes: additionalDetails.trim(),
              vitals: {
                ...(item.vitals || {}),
                oxygenSaturation: !isNaN(o2Num) ? o2Num : item.vitals?.oxygenSaturation,
                heartRate: !isNaN(hrNum) ? hrNum : item.vitals?.heartRate,
                sysBP: !isNaN(sysNum) ? sysNum : item.vitals?.sysBP,
                diaBP: !isNaN(diaNum) ? diaNum : item.vitals?.diaBP,
              },
              oxygenSaturation: !isNaN(o2Num) ? o2Num : item.oxygenSaturation,
              heartRate: !isNaN(hrNum) ? hrNum : item.heartRate,
              sysBP: !isNaN(sysNum) ? sysNum : item.sysBP,
              diaBP: !isNaN(diaNum) ? diaNum : item.diaBP,
            };
          }
          return item;
        });
      } else {
        const newAssessment: Assessment = {
          id: String(Date.now()),
          patientId: patientId || 'unknown',
          date: new Date().toISOString(),
          riskLevel: calculatedRisk,
          risk_level: calculatedRisk,
          symptoms: symptomArray,
          medicalHistory: historyArray,
          medications: medsArray,
          additionalDetails: additionalDetails.trim(),
          vitals: {
            oxygenSaturation: !isNaN(o2Num) ? o2Num : undefined,
            heartRate: !isNaN(hrNum) ? hrNum : undefined,
            sysBP: !isNaN(sysNum) ? sysNum : undefined,
            diaBP: !isNaN(diaNum) ? diaNum : undefined,
          },
        };
        parsedAssessments.unshift(newAssessment);
      }

      await AsyncStorage.setItem('healthAssessments', JSON.stringify(parsedAssessments));

      Alert.alert(
        'Success',
        isEditing ? 'Assessment updated successfully!' : 'Assessment saved successfully!',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Failed to save assessment:', error);
      Alert.alert('Error', 'Failed to save assessment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading Form Data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backIconButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Health Assessment' : 'New Health Assessment'}
          </Text>
        </View>

        {/* Form Container */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Vital Signs</Text>

          {/* Oxygen */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Oxygen Saturation (SpO2 %)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 98"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={oxygenSaturation}
              onChangeText={setOxygenSaturation}
            />
          </View>

          {/* Heart Rate */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Heart Rate (bpm)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 72"
              placeholderTextColor="#94A3B8"
              keyboardType="numeric"
              value={heartRate}
              onChangeText={setHeartRate}
            />
          </View>

          {/* Blood Pressure Row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Systolic BP</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 120"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={sysBP}
                onChangeText={setSysBP}
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Diastolic BP</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 80"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={diaBP}
                onChangeText={setDiaBP}
              />
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Medical Context & Symptoms</Text>

          {/* Medical History Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Medical History</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Diabetes, Hypertension"
              placeholderTextColor="#94A3B8"
              value={medicalHistory}
              onChangeText={setMedicalHistory}
            />
          </View>

          {/* Current Medications Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Current Medications</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Paracetamol, Rosuvas"
              placeholderTextColor="#94A3B8"
              value={medications}
              onChangeText={setMedications}
            />
          </View>

          {/* Symptoms Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Symptoms (comma-separated)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Cough, Fever, Headache"
              placeholderTextColor="#94A3B8"
              value={symptoms}
              onChangeText={setSymptoms}
            />
          </View>

          {/* Additional Notes Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes / Observations</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Enter any extra details or clinical observations..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={additionalDetails}
              onChangeText={setAdditionalDetails}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.disabledButton]}
            onPress={handleSave}
            disabled={saving}>
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Update Assessment' : 'Save Assessment'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
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
    paddingBottom: 40,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  multilineInput: {
    minHeight: 80,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  saveButton: {
    backgroundColor: '#0D9488',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});