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

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Temporary validation.
    // Real authentication will be connected later.
    if (phone.length !== 10 || password.trim().length === 0) {
      return;
    }

    // Go directly to Dashboard.
    // No tabs are involved.
    router.replace('/dashboard');
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

            {/* Mobile Number */}
            <Text style={styles.label}>
              Mobile Number
            </Text>

            <View style={styles.inputContainer}>

              <Text style={styles.prefix}>
                +91
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Enter mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
              />

            </View>

            {/* Password */}
            <Text style={[styles.label, styles.passwordLabel]}>
              Password
            </Text>

            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>
                Forgot Password?
              </Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                (
                  phone.length !== 10 ||
                  password.trim().length === 0
                ) && styles.loginButtonDisabled,
              ]}
              activeOpacity={0.8}
              onPress={handleLogin}
            >

              <Text style={styles.loginButtonText}>
                Login
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

  prefix: {
    fontSize: 15,
    fontWeight: '600',
    color: '#16323A',
    marginRight: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#16323A',
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

  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 12,
  },

  forgotText: {
    color: '#0B8F87',
    fontSize: 13,
    fontWeight: '600',
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
});