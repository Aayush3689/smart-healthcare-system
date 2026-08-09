import { offlineStorage } from '@/lib/offline-storage';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Patient = {
  id: number | string;
  name?: string;
  fullName?: string;
  patientName?: string;
  age?: number | string;
  gender?: string;
  sex?: string;
  phone?: string;
  mobile?: string;
  mobileNumber?: string;

  risk?: string;
  riskLevel?: string;
};

type Assessment = {
  id: number | string;
  patientId: number | string;
  patientName?: string;

  temperature?: string;
  bloodPressure?: string;
  heartRate?: string;
  oxygen?: string;

  symptoms?: string;
  medicalHistory?: string;
  medications?: string;
  notes?: string;

  createdAt?: string;

  risk?: string;
  riskLevel?: string;
  status?: string;
};

type RecentPatient = Patient & {
  latestAssessment?: Assessment;
};

// --------------------------------------------------
// PATIENT NAME
// --------------------------------------------------

const getPatientName = (patient: Patient) => {
  return (
    patient.name ||
    patient.fullName ||
    patient.patientName ||
    'Unnamed Patient'
  );
};

// --------------------------------------------------
// GET RISK
// --------------------------------------------------

const getAssessmentRisk = (
  assessment?: Assessment
): 'High' | 'Medium' | 'Low' | 'Pending' => {
  if (!assessment) {
    return 'Pending';
  }

  const risk =
    assessment.risk ||
    assessment.riskLevel ||
    '';

  const normalized = risk.toLowerCase().trim();

  if (normalized === 'high') {
    return 'High';
  }

  if (normalized === 'medium') {
    return 'Medium';
  }

  if (normalized === 'low') {
    return 'Low';
  }

  return 'Pending';
};

// --------------------------------------------------
// FORMAT DATE
// --------------------------------------------------

const formatAssessmentDate = (
  date?: string
) => {
  if (!date) {
    return 'Not assessed';
  }

  try {
    const assessmentDate = new Date(date);

    if (isNaN(assessmentDate.getTime())) {
      return 'Recently';
    }

    const now = new Date();

    const isToday =
      assessmentDate.getDate() === now.getDate() &&
      assessmentDate.getMonth() === now.getMonth() &&
      assessmentDate.getFullYear() === now.getFullYear();

    if (isToday) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
      assessmentDate.getDate() === yesterday.getDate() &&
      assessmentDate.getMonth() === yesterday.getMonth() &&
      assessmentDate.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return 'Yesterday';
    }

    return assessmentDate.toLocaleDateString();
  } catch {
    return 'Recently';
  }
};

// --------------------------------------------------
// GET LATEST ASSESSMENT FOR PATIENT
// --------------------------------------------------

const getLatestAssessment = (
  patientId: number | string,
  assessments: Assessment[]
): Assessment | undefined => {
  const patientAssessments = assessments.filter(
    (assessment) =>
      String(assessment.patientId) ===
      String(patientId)
  );

  if (patientAssessments.length === 0) {
    return undefined;
  }

  const sorted = [...patientAssessments].sort(
    (a, b) => {
      const dateA = a.createdAt
        ? new Date(a.createdAt).getTime()
        : 0;

      const dateB = b.createdAt
        ? new Date(b.createdAt).getTime()
        : 0;

      return dateB - dateA;
    }
  );

  return sorted[0];
};

// --------------------------------------------------
// RISK COLORS
// --------------------------------------------------

const getRiskStyles = (
  risk: 'High' | 'Medium' | 'Low' | 'Pending'
) => {
  if (risk === 'High') {
    return {
      background: '#FCE8E8',
      text: '#D94A4A',
    };
  }

  if (risk === 'Medium') {
    return {
      background: '#FFF4D9',
      text: '#B77D12',
    };
  }

  if (risk === 'Low') {
    return {
      background: '#E5F5EC',
      text: '#2E9B67',
    };
  }

  return {
    background: '#EEF2F3',
    text: '#64748B',
  };
};

// --------------------------------------------------
// DASHBOARD
// --------------------------------------------------

export default function DashboardScreen() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [recentPatients, setRecentPatients] =
    useState<RecentPatient[]>([]);

  const [loading, setLoading] = useState(true);

  // ------------------------------------------------
  // LOAD DASHBOARD DATA
  // ------------------------------------------------

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        storedPatients,
        storedAssessments,
      ] = await Promise.all([
        offlineStorage.getItem('patients'),
        offlineStorage.getItem(
          'healthAssessments'
        ),
      ]);

      // --------------------------------------------
      // LOAD PATIENTS
      // --------------------------------------------

      let parsedPatients: Patient[] = [];

      if (storedPatients) {
        try {
          const parsed = JSON.parse(
            storedPatients
          );

          if (Array.isArray(parsed)) {
            parsedPatients = parsed;
          }
        } catch (error) {
          console.log(
            'Error parsing patients:',
            error
          );
        }
      }

      // --------------------------------------------
      // LOAD ASSESSMENTS
      // --------------------------------------------

      let parsedAssessments: Assessment[] = [];

      if (storedAssessments) {
        try {
          const parsed = JSON.parse(
            storedAssessments
          );

          if (Array.isArray(parsed)) {
            parsedAssessments = parsed;
          }
        } catch (error) {
          console.log(
            'Error parsing assessments:',
            error
          );
        }
      }

      // --------------------------------------------
      // REMOVE DUPLICATE PATIENT IDS
      // --------------------------------------------

      const uniquePatientsMap =
        new Map<string, Patient>();

      parsedPatients.forEach((patient) => {
        const patientKey = String(patient.id);

        if (!uniquePatientsMap.has(patientKey)) {
          uniquePatientsMap.set(
            patientKey,
            patient
          );
        }
      });

      const uniquePatients = Array.from(
        uniquePatientsMap.values()
      );

      // --------------------------------------------
      // CREATE PATIENT + LATEST ASSESSMENT
      // --------------------------------------------

      const patientsWithAssessments: RecentPatient[] =
        uniquePatients.map((patient) => {
          const latestAssessment =
            getLatestAssessment(
              patient.id,
              parsedAssessments
            );

          return {
            ...patient,
            latestAssessment,
          };
        });

      // --------------------------------------------
      // SORT RECENT PATIENTS
      //
      // Patients with assessments come first.
      // Latest assessment appears first.
      // --------------------------------------------

      patientsWithAssessments.sort(
        (a, b) => {
          const dateA =
            a.latestAssessment?.createdAt
              ? new Date(
                  a.latestAssessment.createdAt
                ).getTime()
              : 0;

          const dateB =
            b.latestAssessment?.createdAt
              ? new Date(
                  b.latestAssessment.createdAt
                ).getTime()
              : 0;

          return dateB - dateA;
        }
      );

      setPatients(uniquePatients);
      setAssessments(parsedAssessments);
      setRecentPatients(
        patientsWithAssessments
      );
    } catch (error) {
      console.log(
        'Dashboard loading error:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------------------------
  // REFRESH EVERY TIME DASHBOARD GETS FOCUS
  // ------------------------------------------------

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  // ------------------------------------------------
  // STATISTICS
  // ------------------------------------------------

  const totalPatients =
    patients.length;

  const totalAssessments =
    assessments.length;

  const highRiskCount =
    assessments.filter(
      (assessment) =>
        getAssessmentRisk(assessment) ===
        'High'
    ).length;

  const mediumRiskCount =
    assessments.filter(
      (assessment) =>
        getAssessmentRisk(assessment) ===
        'Medium'
    ).length;

  const lowRiskCount =
    assessments.filter(
      (assessment) =>
        getAssessmentRisk(assessment) ===
        'Low'
    ).length;

  // ------------------------------------------------
  // SHOW LOADING
  // ------------------------------------------------

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.loadingContainer}
        >
          <ActivityIndicator
            size="large"
            color="#0B8F87"
          />

          <Text
            style={styles.loadingText}
          >
            Loading dashboard...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* -------------------------------------- */}
        {/* HEADER */}
        {/* -------------------------------------- */}

        <View style={styles.header}>
          <View>
            <Text style={styles.smallText}>
              Good Morning 👋
            </Text>

            <Text
              style={styles.headerTitle}
            >
              ASHA Worker
            </Text>
          </View>

          <TouchableOpacity
            style={styles.notificationButton}
            activeOpacity={0.7}
            onPress={() => router.push('/asha-profile')}
            accessibilityLabel="Open my ASHA worker profile"
          >
            <Text style={styles.notificationIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* -------------------------------------- */}
        {/* WELCOME CARD */}
        {/* -------------------------------------- */}

        <View
          style={styles.welcomeCard}
        >
          <View
            style={styles.welcomeText}
          >
            <Text
              style={styles.welcomeTitle}
            >
              Healthcare AI
            </Text>

            <Text
              style={
                styles.welcomeSubtitle
              }
            >
              Your smart healthcare
              assistant
            </Text>

            <Text
              style={
                styles.welcomeDescription
              }
            >
              Manage patients, conduct
              assessments and get
              AI-powered health insights.
            </Text>
          </View>

          <Text
            style={styles.doctorIcon}
          >
            🩺
          </Text>
        </View>

        {/* -------------------------------------- */}
        {/* QUICK ACTIONS */}
        {/* -------------------------------------- */}

        <Text
          style={styles.sectionTitle}
        >
          Quick Actions
        </Text>

        <View
          style={styles.actionGrid}
        >
          {/* PATIENTS */}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/patients')
            }
          >
            <View
              style={styles.actionIcon}
            >
              <Text
                style={styles.emoji}
              >
                👥
              </Text>
            </View>

            <Text
              style={styles.actionTitle}
            >
              Patients
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Manage patients
            </Text>
          </TouchableOpacity>

          {/* NEW ASSESSMENT */}

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push('/assessment')
            }
          >
            <View
              style={styles.actionIcon}
            >
              <Text
                style={styles.emoji}
              >
                🩺
              </Text>
            </View>

            <Text
              style={styles.actionTitle}
            >
              Assessment
            </Text>

            <Text
              style={
                styles.actionSubtitle
              }
            >
              Select patient
            </Text>
          </TouchableOpacity>
        </View>

        {/* -------------------------------------- */}
        {/* HEALTH OVERVIEW */}
        {/* -------------------------------------- */}

        <Text
          style={styles.sectionTitle}
        >
          Health Overview
        </Text>

        <View
          style={styles.statsCard}
        >
          {/* TOTAL PATIENTS */}

          <View
            style={styles.statItem}
          >
            <Text
              style={styles.statEmoji}
            >
              👥
            </Text>

            <Text
              style={styles.statNumber}
            >
              {totalPatients}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Total Patients
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          {/* ASSESSMENTS */}

          <View
            style={styles.statItem}
          >
            <Text
              style={styles.statEmoji}
            >
              📋
            </Text>

            <Text
              style={styles.statNumber}
            >
              {totalAssessments}
            </Text>

            <Text
              style={styles.statLabel}
            >
              Assessments
            </Text>
          </View>

          <View
            style={styles.divider}
          />

          {/* HIGH RISK */}

          <View
            style={styles.statItem}
          >
            <Text
              style={styles.statEmoji}
            >
              ⚠️
            </Text>

            <Text
              style={[
                styles.statNumber,
                {
                  color:
                    highRiskCount > 0
                      ? '#D94A4A'
                      : '#0B8F87',
                },
              ]}
            >
              {highRiskCount}
            </Text>

            <Text
              style={styles.statLabel}
            >
              High Risk
            </Text>
          </View>
        </View>

        {/* -------------------------------------- */}
        {/* AI HEALTH INSIGHTS */}
        {/* -------------------------------------- */}

        <Text
          style={styles.sectionTitle}
        >
          AI Health Insights
        </Text>

        <View style={styles.aiCard}>
          <View
            style={styles.aiHeader}
          >
            <View
              style={styles.aiIcon}
            >
              <Text
                style={styles.emoji}
              >
                🤖
              </Text>
            </View>

            <View
              style={styles.aiHeaderText}
            >
              <Text
                style={styles.aiTitle}
              >
                AI Health Prediction
              </Text>

              <Text
                style={styles.aiSubtitle}
              >
                Current assessment risk
                overview
              </Text>
            </View>
          </View>

          <View
            style={styles.riskRow}
          >
            {/* HIGH */}

            <View
              style={styles.riskItem}
            >
              <Text
                style={
                  styles.riskNumberHigh
                }
              >
                {highRiskCount}
              </Text>

              <Text
                style={styles.riskLabel}
              >
                High Risk
              </Text>
            </View>

            {/* MEDIUM */}

            <View
              style={styles.riskItem}
            >
              <Text
                style={
                  styles.riskNumberMedium
                }
              >
                {mediumRiskCount}
              </Text>

              <Text
                style={styles.riskLabel}
              >
                Medium Risk
              </Text>
            </View>

            {/* LOW */}

            <View
              style={styles.riskItem}
            >
              <Text
                style={
                  styles.riskNumberLow
                }
              >
                {lowRiskCount}
              </Text>

              <Text
                style={styles.riskLabel}
              >
                Low Risk
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={
              styles.viewPredictionButton
            }
            activeOpacity={0.7}
            onPress={() =>
              router.push('/prediction')
            }
          >
            <Text
              style={
                styles.viewPredictionText
              }
            >
              View Predictions
            </Text>

            <Text
              style={
                styles.predictionArrow
              }
            >
              →
            </Text>
          </TouchableOpacity>
        </View>

        {/* -------------------------------------- */}
        {/* RECENT PATIENTS HEADER */}
        {/* -------------------------------------- */}

        <View
          style={styles.sectionHeader}
        >
          <Text
            style={styles.sectionTitle}
          >
            Recent Patients
          </Text>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              router.push('/patients')
            }
          >
            <Text
              style={styles.viewAll}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>

        {/* -------------------------------------- */}
        {/* RECENT PATIENTS */}
        {/* -------------------------------------- */}

        {recentPatients.length === 0 ? (
          <View
            style={styles.emptyCard}
          >
            <Text
              style={styles.emptyIcon}
            >
              👥
            </Text>

            <Text
              style={styles.emptyTitle}
            >
              No patients yet
            </Text>

            <Text
              style={styles.emptyText}
            >
              Add a patient to see them
              here.
            </Text>

            <TouchableOpacity
              style={
                styles.addPatientButton
              }
              onPress={() =>
                router.push('/add-patient')
              }
            >
              <Text
                style={
                  styles.addPatientButtonText
                }
              >
                Add Patient
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          recentPatients
            .slice(0, 5)
            .map((patient) => {
              const latestAssessment =
                patient.latestAssessment;

              const risk =
                getAssessmentRisk(
                  latestAssessment
                );

              const riskColors =
                getRiskStyles(risk);

              const patientName =
                getPatientName(patient);

              const firstLetter =
                patientName
                  .charAt(0)
                  .toUpperCase();

              return (
                <TouchableOpacity
                  key={String(
                    patient.id
                  )}
                  style={
                    styles.patientCard
                  }
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname:
                        '/patient-details',
                      params: {
                        id: String(
                          patient.id
                        ),
                      },
                    })
                  }
                >
                  {/* AVATAR */}

                  <View
                    style={
                      styles.patientAvatar
                    }
                  >
                    <Text
                      style={
                        styles.patientAvatarText
                      }
                    >
                      {firstLetter}
                    </Text>
                  </View>

                  {/* INFORMATION */}

                  <View
                    style={
                      styles.patientInfo
                    }
                  >
                    <Text
                      style={
                        styles.patientName
                      }
                      numberOfLines={1}
                    >
                      {patientName}
                    </Text>

                    <Text
                      style={
                        styles.patientDetails
                      }
                    >
                      {latestAssessment
                        ? `Last assessment: ${formatAssessmentDate(
                            latestAssessment.createdAt
                          )}`
                        : 'Not assessed yet'}
                    </Text>
                  </View>

                  {/* RISK BADGE */}

                  <View
                    style={[
                      styles.riskBadge,
                      {
                        backgroundColor:
                          riskColors.background,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.riskBadgeText,
                        {
                          color:
                            riskColors.text,
                        },
                      ]}
                    >
                      {risk}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
        )}

        <View
          style={styles.bottomSpace}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },

  // -----------------------------------------------
  // LOADING
  // -----------------------------------------------

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: '#7B8794',
  },

  // -----------------------------------------------
  // HEADER
  // -----------------------------------------------

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },

  smallText: {
    fontSize: 13,
    color: '#7B8794',
  },

  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#16323A',
    marginTop: 3,
  },

  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 5,

    elevation: 2,
  },

  notificationIcon: {
    fontSize: 20,
  },

  // -----------------------------------------------
  // WELCOME
  // -----------------------------------------------

  welcomeCard: {
    backgroundColor: '#0B8F87',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  welcomeText: {
    flex: 1,
  },

  welcomeTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },

  welcomeSubtitle: {
    color: '#D8F5F2',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },

  welcomeDescription: {
    color: '#E7F8F6',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  doctorIcon: {
    fontSize: 55,
    marginLeft: 8,
  },

  // -----------------------------------------------
  // SECTION
  // -----------------------------------------------

  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#16323A',
    marginBottom: 12,
  },

  // -----------------------------------------------
  // QUICK ACTIONS
  // -----------------------------------------------

  actionGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },

  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#E9F7F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  emoji: {
    fontSize: 20,
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16323A',
  },

  actionSubtitle: {
    fontSize: 11,
    color: '#7B8794',
    marginTop: 4,
  },

  // -----------------------------------------------
  // STATS
  // -----------------------------------------------

  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statEmoji: {
    fontSize: 18,
    marginBottom: 5,
  },

  statNumber: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0B8F87',
  },

  statLabel: {
    fontSize: 10,
    color: '#7B8794',
    marginTop: 3,
    textAlign: 'center',
  },

  divider: {
    width: 1,
    height: 55,
    backgroundColor: '#E2E8F0',
  },

  // -----------------------------------------------
  // AI CARD
  // -----------------------------------------------

  aiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 25,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  aiIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#E9F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  aiHeaderText: {
    marginLeft: 12,
    flex: 1,
  },

  aiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16323A',
  },

  aiSubtitle: {
    fontSize: 11,
    color: '#7B8794',
    marginTop: 3,
  },

  riskRow: {
    flexDirection: 'row',
    marginTop: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EDF2F4',
  },

  riskItem: {
    flex: 1,
    alignItems: 'center',
  },

  riskNumberHigh: {
    fontSize: 23,
    fontWeight: '800',
    color: '#D94A4A',
  },

  riskNumberMedium: {
    fontSize: 23,
    fontWeight: '800',
    color: '#D59B2A',
  },

  riskNumberLow: {
    fontSize: 23,
    fontWeight: '800',
    color: '#2E9B67',
  },

  riskLabel: {
    fontSize: 10,
    color: '#7B8794',
    marginTop: 3,
  },

  viewPredictionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },

  viewPredictionText: {
    color: '#0B8F87',
    fontSize: 13,
    fontWeight: '700',
  },

  predictionArrow: {
    color: '#0B8F87',
    fontSize: 18,
    marginLeft: 7,
  },

  // -----------------------------------------------
  // RECENT PATIENTS
  // -----------------------------------------------

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  viewAll: {
    color: '#0B8F87',
    fontSize: 12,
    fontWeight: '700',
  },

  patientCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,

    elevation: 1,
  },

  patientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E9F7F5',
    justifyContent: 'center',
    alignItems: 'center',
  },

  patientAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0B8F87',
  },

  patientInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  patientName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16323A',
  },

  patientDetails: {
    fontSize: 11,
    color: '#7B8794',
    marginTop: 4,
  },

  riskBadge: {
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 7,
    minWidth: 58,
    alignItems: 'center',
  },

  riskBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // -----------------------------------------------
  // EMPTY STATE
  // -----------------------------------------------

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 25,
    alignItems: 'center',
    marginBottom: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 5,

    elevation: 1,
  },

  emptyIcon: {
    fontSize: 38,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16323A',
    marginTop: 10,
  },

  emptyText: {
    fontSize: 12,
    color: '#7B8794',
    marginTop: 5,
  },

  addPatientButton: {
    backgroundColor: '#0B8F87',
    borderRadius: 11,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: 15,
  },

  addPatientButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  bottomSpace: {
    height: 30,
  },
});
