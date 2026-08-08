import {
  auth,
  type AshaDashboard,
  type AshaProfile,
  type AshaStatistics,
  AuthApiError,
} from '@/lib/auth';
import { offlineStorage } from '@/lib/offline-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Notice = { type: 'error' | 'success'; message: string } | null;
type StoredPatient = { id?: string | number };
type StoredAssessment = { risk?: string; riskLevel?: string };
type LocalDashboardStats = {
  patients: number;
  assessments: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
};

const statusLabel = (status: string) => status.charAt(0) + status.slice(1).toLowerCase();

const parseStoredArray = <T,>(value: string | null): T[] => {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
};

const getLocalDashboardStats = async (): Promise<LocalDashboardStats> => {
  const [storedPatients, storedAssessments] = await Promise.all([
    offlineStorage.getItem('patients'),
    offlineStorage.getItem('healthAssessments'),
  ]);
  const patients = parseStoredArray<StoredPatient>(storedPatients);
  const assessments = parseStoredArray<StoredAssessment>(storedAssessments);
  const uniquePatientIds = new Set(patients.map((patient) => String(patient.id ?? '')).filter(Boolean));
  const riskCount = (risk: 'high' | 'medium' | 'low') => assessments.filter((assessment) => (
    (assessment.risk ?? assessment.riskLevel ?? '').trim().toLowerCase() === risk
  )).length;

  return {
    patients: uniquePatientIds.size,
    assessments: assessments.length,
    highRisk: riskCount('high'),
    mediumRisk: riskCount('medium'),
    lowRisk: riskCount('low'),
  };
};

export default function AshaProfileScreen() {
  const [profile, setProfile] = useState<AshaProfile | null>(null);
  const [dashboard, setDashboard] = useState<AshaDashboard | null>(null);
  const [statistics, setStatistics] = useState<AshaStatistics | null>(null);
  const [localStats, setLocalStats] = useState<LocalDashboardStats>({
    patients: 0,
    assessments: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  });
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const [profileResponse, dashboardResponse, statisticsResponse, dashboardStats] = await Promise.all([
        auth.getAshaProfile(),
        auth.getAshaDashboard().catch(() => null),
        auth.getAshaStatistics().catch(() => null),
        getLocalDashboardStats(),
      ]);
      setProfile(profileResponse.data);
      setDashboard(dashboardResponse?.data ?? null);
      setStatistics(statisticsResponse?.data ?? null);
      setLocalStats(dashboardStats);
      setFullName(profileResponse.data.fullName);
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'We could not load your profile. Please try again.';
      setNotice({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void loadProfile();
  }, [loadProfile]));

  const saveProfile = async () => {
    const name = fullName.trim();
    if (name.length < 2) {
      setNotice({ type: 'error', message: 'Enter a name with at least two characters.' });
      return;
    }

    setSaving(true);
    setNotice(null);
    try {
      const response = await auth.updateAshaProfile(name);
      setProfile(response.data);
      setFullName(response.data.fullName);
      setNotice({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      const message = error instanceof AuthApiError ? error.message : 'We could not update your profile. Please try again.';
      setNotice({ type: 'error', message });
    } finally {
      setSaving(false);
    }
  };

  const signOut = () => {
    Alert.alert('Sign out?', 'You will need a new verification code to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void auth.clearTokens().finally(() => router.replace('/login'));
        },
      },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#0B8F87" />
          <Text style={styles.loadingText}>Loading your profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorState}>
          <Text style={styles.errorTitle}>Profile unavailable</Text>
          <Text style={styles.errorText}>{notice?.message ?? 'Please try again.'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void loadProfile()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>Back to dashboard</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = profile.fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  const changed = fullName.trim() !== profile.fullName;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityLabel="Back to dashboard">
            <Text style={styles.backArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>My profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.avatar}><Text style={styles.avatarText}>{initials || 'A'}</Text></View>
          <Text style={styles.workerName} selectable>{profile.fullName}</Text>
          <Text style={styles.workerRole}>Accredited Social Health Activist</Text>
          <View style={styles.statusBadge}><Text style={styles.statusText}>{statusLabel(profile.status)}</Text></View>
        </View>

        {notice ? <View style={[styles.notice, notice.type === 'success' ? styles.successNotice : styles.errorNotice]}><Text style={notice.type === 'success' ? styles.successText : styles.noticeText}>{notice.message}</Text></View> : null}

        <Text style={styles.sectionTitle}>Personal details</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            editable={!saving}
            autoCapitalize="words"
            maxLength={150}
            textContentType="name"
            placeholder="Your full name"
            placeholderTextColor="#94A3B8"
          />
          <Text style={styles.helper}>You can update your name. Employment and service-area details are managed by your PHC.</Text>
          <TouchableOpacity
            style={[styles.saveButton, (!changed || saving) && styles.saveButtonDisabled]}
            onPress={() => void saveProfile()}
            disabled={!changed || saving}
          >
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Work assignment</Text>
        <View style={styles.card}>
          <DetailRow icon="ID" label="Employee code" value={profile.employeeCode} />
          <DetailRow icon="V" label="Village" value={profile.village.name} />
          <DetailRow icon="D" label="District" value={profile.village.district} />
          <DetailRow icon="S" label="State" value={profile.village.state} />
          <DetailRow icon="P" label="Primary health centre" value={profile.phc?.name ?? 'Not assigned'} last />
        </View>

        <Text style={styles.sectionTitle}>ASHA workload</Text>
        <View style={styles.metricGrid}>
          <MetricCard icon="P" label="Patients" value={localStats.patients} detail="Saved on this device" />
          <MetricCard icon="A" label="Assessments" value={localStats.assessments} detail={`${dashboard?.assessments.today ?? 0} today`} />
          <MetricCard icon="R" label="Referrals" value={statistics?.totalReferrals ?? 0} detail={`${dashboard?.referrals.pending ?? 0} pending`} />
          <MetricCard icon="F" label="Follow-ups" value={statistics?.pendingFollowUps ?? 0} detail={`${dashboard?.followUps.today ?? 0} due today`} />
        </View>

        <Text style={styles.sectionTitle}>Risk and care coordination</Text>
        <View style={styles.card}>
          <SummaryRow label="High-risk patients" value={localStats.highRisk} tone="danger" />
          <SummaryRow label="Medium-risk patients" value={localStats.mediumRisk} tone="warning" />
          <SummaryRow label="Low-risk patients" value={localStats.lowRisk} tone="success" />
          <SummaryRow label="Accepted referrals" value={dashboard?.referrals.accepted ?? 0} />
          <SummaryRow label="Completed referrals" value={dashboard?.referrals.completed ?? statistics?.completedReferrals ?? 0} />
          <SummaryRow label="Completed follow-ups" value={statistics?.completedFollowUps ?? 0} last />
        </View>

        <Text style={styles.sectionTitle}>Field operations</Text>
        <View style={styles.card}>
          <SummaryRow label="Pending offline changes" value={dashboard?.sync.pending ?? 0} />
          <SummaryRow label="Failed sync changes" value={dashboard?.sync.failed ?? 0} tone={(dashboard?.sync.failed ?? 0) > 0 ? 'danger' : undefined} />
          <Text style={styles.helper}>Patient records and assessments are scoped to your assigned village. Referrals, appointments, follow-ups, notifications, documents, OCR review, and speech-assisted entry are handled through the ASHA care workflow.</Text>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value, last = false }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <View style={styles.detailIcon}><Text style={styles.detailIconText}>{icon}</Text></View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue} selectable>{value}</Text>
      </View>
    </View>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: string; label: string; value: number; detail: string }) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricIcon}><Text style={styles.metricIconText}>{icon}</Text></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </View>
  );
}

function SummaryRow({ label, value, tone, last = false }: { label: string; value: number; tone?: 'danger' | 'warning' | 'success'; last?: boolean }) {
  return (
    <View style={[styles.summaryRow, !last && styles.detailBorder]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, tone === 'danger' && styles.dangerValue, tone === 'warning' && styles.warningValue, tone === 'success' && styles.successValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F7FAFC' },
  content: { padding: 20, paddingBottom: 36 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#64748B', marginTop: 12 },
  errorState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  errorTitle: { fontSize: 20, fontWeight: '800', color: '#16323A' },
  errorText: { textAlign: 'center', color: '#64748B', lineHeight: 20, marginTop: 8 },
  retryButton: { backgroundColor: '#0B8F87', borderRadius: 12, paddingHorizontal: 22, paddingVertical: 12, marginTop: 20 },
  retryText: { color: '#FFF', fontWeight: '800' },
  backLink: { color: '#0B8F87', fontWeight: '700', marginTop: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  backButton: { width: 42, height: 42, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 21 },
  backArrow: { color: '#16323A', fontSize: 34, fontWeight: '300', marginTop: -4 },
  title: { color: '#16323A', fontSize: 21, fontWeight: '800' },
  headerSpacer: { width: 42 },
  heroCard: { backgroundColor: '#0B8F87', borderRadius: 22, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 78, height: 78, borderRadius: 39, backgroundColor: '#D8F5F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#0B6E68', fontSize: 28, fontWeight: '800' },
  workerName: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  workerRole: { color: '#D8F5F2', marginTop: 4, fontSize: 13 },
  statusBadge: { backgroundColor: '#E3F8E9', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 12, marginTop: 14 },
  statusText: { color: '#237A45', fontSize: 12, fontWeight: '800' },
  sectionTitle: { color: '#16323A', fontSize: 17, fontWeight: '800', marginBottom: 10, marginTop: 4 },
  card: { backgroundColor: '#FFF', borderRadius: 18, padding: 16, marginBottom: 22 },
  label: { color: '#334155', fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderRadius: 11, borderWidth: 1, borderColor: '#DDE6EB', color: '#16323A', fontSize: 16, paddingHorizontal: 13, paddingVertical: 12 },
  helper: { color: '#7B8794', fontSize: 12, lineHeight: 17, marginTop: 9 },
  saveButton: { alignItems: 'center', backgroundColor: '#0B8F87', borderRadius: 12, paddingVertical: 13, marginTop: 16 },
  saveButtonDisabled: { backgroundColor: '#A8BFBD' },
  saveText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  notice: { borderRadius: 12, padding: 12, marginBottom: 18 },
  successNotice: { backgroundColor: '#E5F5EC' },
  errorNotice: { backgroundColor: '#FCE8E8' },
  successText: { color: '#237A45', fontSize: 13, fontWeight: '600' },
  noticeText: { color: '#B42318', fontSize: 13, fontWeight: '600' },
  detailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  detailBorder: { borderBottomWidth: 1, borderBottomColor: '#EDF1F3' },
  detailIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#E9F7F5', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  detailIconText: { color: '#0B8F87', fontSize: 12, fontWeight: '800' },
  detailContent: { flex: 1 },
  detailLabel: { color: '#7B8794', fontSize: 11, marginBottom: 3 },
  detailValue: { color: '#16323A', fontSize: 14, fontWeight: '700' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 22 },
  metricCard: { width: '47.8%', backgroundColor: '#FFF', borderRadius: 16, padding: 14 },
  metricIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: '#E9F7F5', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  metricIconText: { color: '#0B8F87', fontSize: 11, fontWeight: '800' },
  metricValue: { color: '#16323A', fontSize: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  metricLabel: { color: '#334155', fontSize: 12, fontWeight: '700', marginTop: 2 },
  metricDetail: { color: '#7B8794', fontSize: 10, marginTop: 4 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  summaryLabel: { color: '#475569', fontSize: 14 },
  summaryValue: { color: '#16323A', fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  dangerValue: { color: '#C73B46' },
  warningValue: { color: '#B77D12' },
  successValue: { color: '#237A45' },
  signOutButton: { borderWidth: 1, borderColor: '#F5C2C7', backgroundColor: '#FFF', borderRadius: 13, alignItems: 'center', paddingVertical: 14 },
  signOutText: { color: '#C73B46', fontSize: 14, fontWeight: '800' },
});
