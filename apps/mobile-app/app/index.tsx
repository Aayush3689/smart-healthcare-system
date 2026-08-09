import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { router } from 'expo-router';

export default function WelcomeScreen() {
  const handleGetStarted = () => {
    router.push('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoIcon}>+</Text>
          </View>

          <Text style={styles.brandName}>
            HealthCare AI
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>

          <View style={styles.illustration}>
            <Text style={styles.illustrationIcon}>
              🩺
            </Text>
          </View>

          <Text style={styles.title}>
            Healthcare{'\n'}
            <Text style={styles.titleHighlight}>
              AI Platform
            </Text>
          </Text>

          <Text style={styles.subtitle}>
            Smart healthcare assistance for ASHA workers,
            helping you provide better care to every patient.
          </Text>

          {/* Feature 1 */}
          <View style={styles.features}>

            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>
                  👩‍⚕️
                </Text>
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  Patient Management
                </Text>

                <Text style={styles.featureDescription}>
                  Manage patient information easily
                </Text>
              </View>
            </View>

            {/* Feature 2 */}
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>
                  🤖
                </Text>
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  AI Health Prediction
                </Text>

                <Text style={styles.featureDescription}>
                  Get intelligent health risk insights
                </Text>
              </View>
            </View>

            {/* Feature 3 */}
            <View style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text style={styles.featureEmoji}>
                  📱
                </Text>
              </View>

              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>
                  Works Offline
                </Text>

                <Text style={styles.featureDescription}>
                  Continue working even without internet
                </Text>
              </View>
            </View>

          </View>
        </View>

        {/* Bottom */}
        <View style={styles.bottomSection}>

          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.8}
            onPress={handleGetStarted}
          >
            <Text style={styles.buttonText}>
              Get Started
            </Text>

            <Text style={styles.arrow}>
              →
            </Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Empowering healthcare. Improving lives.
          </Text>

        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAFC',
  },

  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 18,
    justifyContent: 'space-between',
  },

  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0B8F87',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },

  logoIcon: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '700',
  },

  brandName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16323A',
  },

  content: {
    alignItems: 'center',
    marginTop: 15,
  },

  illustration: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DDF4F1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  illustrationIcon: {
    fontSize: 52,
  },

  title: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '800',
    color: '#16323A',
    textAlign: 'center',
  },

  titleHighlight: {
    color: '#0B8F87',
  },

  subtitle: {
    marginTop: 14,
    fontSize: 15,
    lineHeight: 23,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 330,
  },

  features: {
    width: '100%',
    marginTop: 24,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,

    elevation: 2,
  },

  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#EEF8F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  featureEmoji: {
    fontSize: 20,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16323A',
  },

  featureDescription: {
    fontSize: 12,
    color: '#7B8794',
    marginTop: 3,
  },

  bottomSection: {
    alignItems: 'center',
  },

  button: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#0B8F87',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',

    shadowColor: '#0B8F87',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,

    elevation: 4,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 12,
    marginTop: -2,
  },

  footerText: {
    marginTop: 12,
    fontSize: 11,
    color: '#94A3B8',
  },
});