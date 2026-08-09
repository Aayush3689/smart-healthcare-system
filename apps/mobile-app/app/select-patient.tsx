import { offlineStorage } from '@/lib/offline-storage';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Patient = {
  id?: string | number;
  patientId?: string | number;
  _id?: string | number;
  name?: string;
  fullName?: string;
  patientName?: string;
  age?: string | number;
  gender?: string;
  sex?: string;
};

const getPatientId = (patient: Patient) => patient.id ?? patient.patientId ?? patient._id;
const getPatientName = (patient: Patient) =>
  patient.name ?? patient.fullName ?? patient.patientName ?? 'Unnamed Patient';

const readPatients = (value: string | null): Patient[] => {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as Patient[]) : [];
  } catch {
    return [];
  }
};

export default function SelectPatientScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setPatients(readPatients(await offlineStorage.getItem('patients')));
    } catch {
      setPatients([]);
      setError('Unable to load patients. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadPatients();
  }, [loadPatients]));

  const filteredPatients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return patients;
    return patients.filter((patient) => getPatientName(patient).toLowerCase().includes(query));
  }, [patients, searchQuery]);

  const handleContinue = () => {
    if (!selectedPatientId) return;
    router.push({
      pathname: '/health-assessment',
      params: { patientId: selectedPatientId },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0B8F87" />
        <Text style={styles.loadingText}>Loading patients...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#16323A" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Select Patient</Text>
          <Text style={styles.subtitle}>Choose a patient for this health assessment</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#7B8794" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search patient..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <FlatList
          data={filteredPatients}
          keyExtractor={(item, index) => String(getPatientId(item) ?? index)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const patientId = getPatientId(item);
            const isSelected = String(patientId) === selectedPatientId;
            return (
              <TouchableOpacity
                style={[styles.patientCard, isSelected && styles.selectedPatientCard]}
                activeOpacity={0.8}
                onPress={() => patientId !== undefined && setSelectedPatientId(String(patientId))}>
                <Ionicons
                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={isSelected ? '#0B8F87' : '#94A3B8'}
                />
                <View style={styles.patientInfo}>
                  <Text style={styles.patientName}>{getPatientName(item)}</Text>
                  <Text style={styles.patientMeta}>
                    {[item.age ? `${item.age} years` : '', item.gender ?? item.sex ?? '']
                      .filter(Boolean)
                      .join(' • ') || 'Details unavailable'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name={searchQuery ? 'search-outline' : 'people-outline'} size={52} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>{searchQuery ? 'No patients found' : 'No patients yet'}</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try another patient name.' : 'Register a patient before starting an assessment.'}
              </Text>
            </View>
          }
        />

        <TouchableOpacity
          style={[styles.continueButton, !selectedPatientId && styles.disabledButton]}
          activeOpacity={0.8}
          onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7FAFC' },
  loadingText: { marginTop: 12, color: '#7B8794' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, backgroundColor: '#FFFFFF' },
  backButton: { padding: 4 },
  title: { color: '#16323A', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#7B8794', fontSize: 13, marginTop: 3 },
  content: { flex: 1, padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#DCE5E8', backgroundColor: '#FFFFFF' },
  searchInput: { flex: 1, height: '100%', color: '#16323A', fontSize: 15 },
  errorText: { color: '#D94A4A', marginTop: 10 },
  listContent: { paddingVertical: 14, gap: 10, flexGrow: 1 },
  patientCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5EAED' },
  selectedPatientCard: { borderColor: '#0B8F87', backgroundColor: '#E9F7F5' },
  patientInfo: { flex: 1 },
  patientName: { color: '#16323A', fontSize: 16, fontWeight: '700' },
  patientMeta: { color: '#7B8794', fontSize: 13, marginTop: 3 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 52 },
  emptyTitle: { color: '#16323A', fontSize: 18, fontWeight: '700', marginTop: 12 },
  emptyText: { color: '#7B8794', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  continueButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: '#0B8F87' },
  disabledButton: { opacity: 0.45 },
  continueButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
