import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
} from 'react-native';
import { offlineStorage } from '@/lib/offline-storage';
import { ashaApi } from '@/lib/asha-api';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Patient {
  id?: string | number;
  name?: string;
  phone?: string | number;
  mobile?: string | number;
  mobileNumber?: string | number;
  age?: number | string;
  gender?: string;
  medicalHistory?: string[] | string;
  medications?: string[] | string;
  [key: string]: any;
}

export default function PatientsScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Extract patient Name safely
  const getPatientName = (patient: Patient): string => {
    return patient?.name ? String(patient.name) : 'Unnamed Patient';
  };

  // Fetch patients from local SQLite storage.
  const loadPatients = useCallback(async () => {
    try {
      setLoading(true);
      const storedPatients = await offlineStorage.getItem('patients');
      const parsed: Patient[] = storedPatients ? JSON.parse(storedPatients) : [];
      const normalizedQuery = searchQuery.trim().toLowerCase();

      // Use the ASHA-scoped server list when available, while retaining local
      // records so the directory remains usable before queued changes sync.
      let serverPatients: Patient[] = [];
      try {
        const response = await ashaApi.patients({
          page: 1,
          limit: 100,
          search: normalizedQuery || undefined,
        });
        const records = response.patients;
        if (Array.isArray(records)) {
          serverPatients = records.map((record) => {
            const item = record as Record<string, unknown>;
            return {
              id: item.id as string | number | undefined,
              name: item.fullName as string | undefined,
              age: item.age as number | string | undefined,
              gender: item.gender as string | undefined,
              phone: item.phone as string | number | undefined,
              village: item.village,
              latestRisk: item.latestRisk,
              lastAssessmentAt: item.lastAssessmentAt,
            };
          });
        }
      } catch (apiError) {
        console.log('Unable to load patients from the ASHA API; using local records:', apiError);
      }

      const mergedPatients = new Map<string, Patient>();
      parsed.forEach((patient) => mergedPatients.set(String(patient.id ?? ''), patient));
      serverPatients.forEach((patient) => mergedPatients.set(String(patient.id ?? ''), patient));
      const allPatients = Array.from(mergedPatients.values());

      setPatients(allPatients);
      setFilteredPatients(
        normalizedQuery
          ? allPatients.filter((patient) => getPatientName(patient).toLowerCase().includes(normalizedQuery))
          : allPatients
      );
    } catch (error) {
      console.error('Failed to load patients:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useFocusEffect(
    useCallback(() => {
      void loadPatients();
    }, [loadPatients])
  );

  // Simplified Search Filter - Strictly by Name
  const filterPatients = (query: string, listToFilter: Patient[] = patients) => {
    const trimmed = query.trim().toLowerCase();
    setSearchQuery(query);

    if (!trimmed) {
      setFilteredPatients(listToFilter);
      return;
    }

    const filtered = listToFilter.filter((patient) => {
      const name = getPatientName(patient).toLowerCase();
      return name.includes(trimmed);
    });

    setFilteredPatients(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredPatients(patients);
  };

  const handleCallPatient = async (phoneNumber: string) => {
    const dialableNumber = phoneNumber.replace(/[^\d+]/g, '');
    const dialUrl = `tel:${dialableNumber}`;

    try {
      const canCall = await Linking.canOpenURL(dialUrl);
      if (!canCall) {
        Alert.alert('Calling unavailable', 'This device cannot place phone calls.');
        return;
      }

      await Linking.openURL(dialUrl);
    } catch {
      Alert.alert('Unable to call', 'Please try calling the patient again.');
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const patientId = String(item?.id ?? item?.patientId ?? item?._id ?? '');
    const patientName = getPatientName(item);
    const patientPhone = item?.phone ?? item?.mobile ?? item?.mobileNumber;
    const patientPhoneText = patientPhone ? String(patientPhone) : '';
    const patientMeta = [
      item.age ? `${item.age} yrs` : '',
      item.gender ?? '',
    ].filter(Boolean).join(' • ');

    return (
      <TouchableOpacity
        style={styles.patientCard}
        activeOpacity={0.7}
        onPress={() =>
          router.push({
            pathname: '/patient-details',
            params: { id: patientId },
          })
        }>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>
            {patientName ? patientName.charAt(0).toUpperCase() : 'P'}
          </Text>
        </View>

        <View style={styles.patientInfo}>
          <Text style={styles.patientName} numberOfLines={1}>{patientName}</Text>
          {patientId ? <Text style={styles.patientId}>Patient ID: #{patientId}</Text> : null}

          <View style={styles.patientSubInfo}>
            {patientMeta ? <Text style={styles.metaText}>{patientMeta}</Text> : null}
          </View>
        </View>

        {patientPhoneText ? (
          <TouchableOpacity
            style={styles.callButton}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Call ${patientName}`}
            onPress={(event) => {
              event.stopPropagation();
              void handleCallPatient(patientPhoneText);
            }}>
            <Ionicons name="call" size={19} color="#FFFFFF" />
          </TouchableOpacity>
        ) : null}

        <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading Patients...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Patients Directory</Text>
            <Text style={styles.subtitle}>
              {patients.length} registered patient{patients.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/add-patient')}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Patient</Text>
          </TouchableOpacity>
        </View>

        {/* Name-Only Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by patient name..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => filterPatients(text)}
            autoCapitalize="words"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Patient List */}
      <FlatList
        data={filteredPatients}
        keyExtractor={(item, index) => String(item?.id ?? index)}
        renderItem={renderPatientCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name={searchQuery ? 'search-outline' : 'people-outline'}
              size={56}
              color="#CBD5E1"
            />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No Matching Patients' : 'No Patients Yet'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? `No patient found with the name "${searchQuery}".`
                : 'Click "Add Patient" above to register your first patient.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minHeight: 96,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0284C7',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientId: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 3,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B8F87',
    marginLeft: 8,
    marginRight: 8,
  },
  patientSubInfo: {
    marginTop: 4,
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
