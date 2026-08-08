import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { auth, AuthApiError } from '@/lib/auth';

type Toast = { type: 'success' | 'error'; message: string };

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isOtpValid = otpRequested && /^\d{6}$/.test(otp);

  const showToast = (type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleGenerateOtp = async () => {
    if (!isEmailValid) {
      showToast('error', 'Enter a valid email address to receive a verification code.');
      return;
    }

    setIsRequestingOtp(true);
    try {
      const response = await auth.requestOtp(email.trim().toLowerCase());
      setOtpRequested(true);
      setOtp('');
      showToast('success', response.message || 'Verification code sent. Please check your email.');
    } catch (error) {
      showToast('error', error instanceof AuthApiError ? error.message : 'We could not send a verification code. Please try again.');
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setOtpRequested(false);
    setOtp('');
  };

  const handleLogin = async () => {
    if (!isEmailValid || !isOtpValid) {
      showToast('error', 'Request a code, then enter the six-digit code from your email.');
      return;
    }

    setIsLoggingIn(true);
    try {
      const response = await auth.verifyOtp(email.trim().toLowerCase(), otp);
      if (response.data.user.role !== 'ASHA_WORKER') {
        showToast('error', 'This account is not enabled for ASHA Worker access.');
        return;
      }
      await auth.saveTokens(response.data.accessToken, response.data.refreshToken);
      showToast('success', 'Welcome back! You are signed in.');
      setTimeout(() => router.replace('/dashboard'), 700);
    } catch (error) {
      showToast('error', error instanceof AuthApiError ? error.message : 'We could not sign you in. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* Logo */}
          <View style={styles.logoSection}>

            <View style={styles.logoCircle}>
              <Text style={styles.logoIcon}>
                +
              </Text>
            </View>

            <Text style={styles.logoText}>
              HealthCare AI
            </Text>

          </View>

          {/* Heading */}
          <View style={styles.headingSection}>

            <Text style={styles.title}>
              Welcome Back
            </Text>

            <Text style={styles.subtitle}>
              Login to continue to your Healthcare AI dashboard
            </Text>

          </View>

          {/* Login Card */}
          <View style={styles.card}>

            {/* Gmail */}
            <Text style={styles.label}>
              Gmail
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter your Gmail address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                value={email}
                onChangeText={handleEmailChange}
              />

            </View>

            <TouchableOpacity
              style={[
                styles.generateOtpButton,
                (!isEmailValid || isRequestingOtp) && styles.generateOtpButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() => void handleGenerateOtp()}
              disabled={!isEmailValid || isRequestingOtp}
            >
              <Text style={styles.generateOtpButtonText}>
                {isRequestingOtp ? 'Sending…' : otpRequested ? 'Resend OTP' : 'Send OTP'}
              </Text>
            </TouchableOpacity>

            {/* One-time password */}
            <Text style={[styles.label, styles.passwordLabel]}>
              OTP
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter 6-digit OTP"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              maxLength={6}
              textContentType="oneTimeCode"
              value={otp}
              onChangeText={setOtp}
            />

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (
                  !isEmailValid ||
                  !isOtpValid ||
                  isLoggingIn
                ) && styles.loginButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={() => void handleLogin()}
              disabled={!isEmailValid || !isOtpValid || isLoggingIn}
            >

              <Text style={styles.loginButtonText}>
                {isLoggingIn ? 'Signing in…' : 'Login'}
              </Text>

              <Text style={styles.arrow}>
                →
              </Text>

            </TouchableOpacity>

          </View>

          {/* Information */}
          <View style={styles.infoBox}>

            <Text style={styles.infoTitle}>
              🩺 ASHA Worker Access
            </Text>

            <Text style={styles.infoText}>
              This application is designed to help ASHA workers
              manage patients and access AI-powered health insights.
            </Text>

          </View>

          {/* Footer */}
          <Text style={styles.footer}>
            Empowering healthcare. Improving lives.
          </Text>

        </ScrollView>
      </KeyboardAvoidingView>
      {toast ? (
        <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}
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
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 25,
  },

  logoSection: {
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

  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#16323A',
  },

  headingSection: {
    marginTop: 55,
    marginBottom: 28,
  },

  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#16323A',
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748B',
    marginTop: 8,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 3,
  },

  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16323A',
    marginBottom: 8,
  },

  inputContainer: {
    height: 54,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#16323A',
  },

  generateOtpButton: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#E9F7F5',
  },

  generateOtpButtonDisabled: {
    opacity: 0.5,
  },

  generateOtpButtonText: {
    color: '#0B6F69',
    fontSize: 13,
    fontWeight: '700',
  },

  passwordLabel: {
    marginTop: 20,
  },

  passwordInput: {
    height: 54,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#16323A',
  },

  loginButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#0B8F87',
    marginTop: 24,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#0B8F87',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,

    elevation: 3,
  },

  loginButtonDisabled: {
    opacity: 0.5,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },

  arrow: {
    color: '#FFFFFF',
    fontSize: 23,
    marginLeft: 12,
  },

  infoBox: {
    backgroundColor: '#E9F7F5',
    borderRadius: 15,
    padding: 16,
    marginTop: 22,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0B6F69',
    marginBottom: 6,
  },

  infoText: {
    fontSize: 12,
    lineHeight: 19,
    color: '#557477',
  },

  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 22,
  },

  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 28,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 5,
  },

  toastSuccess: { backgroundColor: '#166534' },
  toastError: { backgroundColor: '#B91C1C' },
  toastText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600', lineHeight: 20 },
});
