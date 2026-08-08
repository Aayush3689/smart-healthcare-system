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
import { offlineStorage } from '@/lib/offline-storage';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Assessment {
  id?: string | number;
  patientId?: string | number;
  patient_id?: string | number;
  date?: string;
  created_at?: string;
  createdAt?: string;
  riskLevel?: string;
  risk_level?: string;
  risk?: string;
  symptoms?: string[] | string;
  vitals?: Record<string, any>;
  [key: string]: any;
}

type FilterTab = 'All' | 'High' | 'Medium' | 'Low';

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [loading, setLoading] = useState(true);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterTab>('All');

  // Extract or compute Risk Level
  const getRiskLevel = (assessment: Assessment): 'High' | 'Medium' | 'Low' => {
    const rawRisk = assessment?.riskLevel || assessment?.risk_level || assessment?.risk;
    if (rawRisk) {
      const lower = String(rawRisk).trim().toLowerCase();
      if (lower === 'high') return 'High';
      if (lower === 'medium') return 'Medium';
      if (lower === 'low') return 'Low';
    }

    const vitals = assessment?.vitals || {};
    const oxygen = Number(vitals.oxygenSaturation ?? vitals.spo2 ?? assessment.oxygenSaturation ?? assessment.spo2);
    const heartRate = Number(vitals.heartRate ?? vitals.heart_rate ?? assessment.heartRate ?? assessment.heart_rate);
    const sysBP = Number(vitals.sysBP ?? vitals.sys_bp ?? assessment.sysBP ?? assessment.sys_bp);

    if ((!isNaN(oxygen) && oxygen < 92) || (!isNaN(heartRate) && heartRate > 120) || (!isNaN(sysBP) && sysBP > 160)) {
      return 'High';
    }
    if ((!isNaN(oxygen) && oxygen < 95) || (!isNaN(heartRate) && heartRate > 100) || (!isNaN(sysBP) && sysBP > 140)) {
      return 'Medium';
    }
    return 'Low';
  };

  const getAssessmentDate = (assessment: Assessment) => {
    return assessment?.date || assessment?.created_at || assessment?.createdAt || '';
  };

  const formatSymptoms = (symptoms?: string[] | string): string => {
    if (!symptoms) return 'No symptoms recorded';
    if (Array.isArray(symptoms)) return symptoms.filter(Boolean).join(', ') || 'No symptoms recorded';
    if (typeof symptoms === 'string') return symptoms.trim() || 'No symptoms recorded';
    return String(symptoms);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const storedAssessments = await offlineStorage.getItem('healthAssessments');
      const parsedAssessments: Assessment[] = storedAssessments ? JSON.parse(storedAssessments) : [];

      const targetIdStr = String(id).trim();

      // Find and sort all assessments for this patient
      const patientAssessments = parsedAssessments.filter((a) => {
        const aPid = String(a.patientId ?? a.patient_id ?? '').trim();
        return aPid === targetIdStr || targetIdStr === '' || targetIdStr === 'undefined';
      });

      patientAssessments.sort((a, b) => {
        const dateA = new Date(getAssessmentDate(a)).getTime() || 0;
        const dateB = new Date(getAssessmentDate(b)).getTime() || 0;
        return dateB - dateA;
      });

      setAssessments(patientAssessments);
    } catch (error) {
      console.error('Failed to load assessment history:', error);
      Alert.alert('Error', 'Failed to load assessment history.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadData();
    }, [loadData])
  );

  // Filter assessment history by selected risk tab
  const filteredAssessments = assessments.filter((item) => {
    if (selectedFilter === 'All') return true;
    return getRiskLevel(item) === selectedFilter;
  });

  const getBadgeStyle = (riskLevel: string) => {
    switch (riskLevel) {
      case 'High':
        return { bg: '#FEE2E2', text: '#991B1B' };
      case 'Medium':
        return { bg: '#FEF3C7', text: '#92400E' };
      case 'Low':
      default:
        return { bg: '#E6F4EA', text: '#1E8E3E' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0D9488" />
        <Text style={styles.loadingText}>Loading Assessments...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner Button */}
        <TouchableOpacity
          style={styles.headerBanner}
          activeOpacity={0.8}
          onPress={() =>
            router.push({
              pathname: '/health-assessment',
              params: { patientId: String(id) },
            })
          }>
          <View style={styles.headerIconBox}>
            <Ionicons name="medkit-outline" size={28} color="#0D9488" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>New Health Assessment</Text>
            <Text style={styles.headerSubtitle}>Assess patient&apos;s current health</Text>
          </View>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Section Title */}
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>Assessment History</Text>
          <Text style={styles.subtitleCount}>
            {filteredAssessments.length} of {assessments.length} recorded
          </Text>
        </View>

        {/* Step 4 Filter Tabs */}
        <View style={styles.filterTabsContainer}>
          {(['All', 'High', 'Medium', 'Low'] as FilterTab[]).map((tab) => {
            const isActive = selectedFilter === tab;
            return (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.filterTab,
                  isActive && styles.activeFilterTab,
                  tab === 'High' && isActive && { backgroundColor: '#FEE2E2' },
                  tab === 'Medium' && isActive && { backgroundColor: '#FEF3C7' },
                  tab === 'Low' && isActive && { backgroundColor: '#E6F4EA' },
                ]}
                onPress={() => setSelectedFilter(tab)}>
                <Text
                  style={[
                    styles.filterTabText,
                    isActive && styles.activeFilterTabText,
                    tab === 'High' && isActive && { color: '#991B1B' },
                    tab === 'Medium' && isActive && { color: '#92400E' },
                    tab === 'Low' && isActive && { color: '#1E8E3E' },
                  ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filtered Assessment Cards */}
        {filteredAssessments.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="clipboard-outline" size={40} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No Assessments Found</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'All'
                ? 'No assessments recorded for this patient yet.'
                : `No assessments match the ${selectedFilter} risk tier.`}
            </Text>
          </View>
        ) : (
          filteredAssessments.map((assessment, index) => {
            const riskLevel = getRiskLevel(assessment);
            const badge = getBadgeStyle(riskLevel);
            const rawDate = getAssessmentDate(assessment);
            const formattedSymptoms = formatSymptoms(assessment.symptoms);
            const caseNumber = assessments.length - index;

            return (
              <TouchableOpacity
                key={String(assessment.id ?? index)}
                style={styles.card}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/assessment_details',
                    params: { assessmentId: String(assessment.id) },
                  })
                }>
                <View style={styles.cardIconBox}>
                  <Ionicons name="clipboard-outline" size={24} color="#B45309" />
                </View>

                <View style={styles.cardContent}>
                  <View style={styles.cardTopRow}>
                    <Text style={styles.assessmentName}>Assessment {caseNumber}</Text>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.text }]}>
                        {riskLevel}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.dateText}>
                    {rawDate ? new Date(rawDate).toLocaleString() : 'N/A'}
                  </Text>
                  <Text style={styles.symptomsText} numberOfLines={1}>
                    {formattedSymptoms}
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            );
          })
        )}

        {/* Assessment Count Summary Box */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryIconBox}>
            <Ionicons name="stats-chart" size={24} color="#0D9488" />
          </View>
          <View style={styles.summaryTextContainer}>
            <Text style={styles.summaryTitle}>Assessment Records</Text>
            <Text style={styles.summarySubtitle}>
              {assessments.length} total assessments for this patient
            </Text>
          </View>
          <Text style={styles.summaryNumber}>{assessments.length}</Text>
        </View>

        <Text style={styles.disclaimerText}>
          This information is for informational purposes only and does not replace professional medical advice.
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
  headerBanner: {
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  titleRow: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  subtitleCount: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeFilterTab: {
    backgroundColor: '#FFFFFF',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeFilterTabText: {
    color: '#0D9488',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  assessmentName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  symptomsText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  summarySubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0D9488',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 16,
  },
});
