import { createUuid, offlineStorage } from '@/lib/offline-storage';
import { ashaApi } from '@/lib/asha-api';
import { auth } from '@/lib/auth';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AddPatientScreen() {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [village, setVillage] = useState('');
  const [symptoms, setSymptoms] = useState('');

  const handleSavePatient = async () => {

    // Validate name
    if (!name.trim()) {
      Alert.alert(
        'Required',
        'Please enter the patient name.'
      );
      return;
    }

    // Validate age
    if (!age.trim()) {
      Alert.alert(
        'Required',
        'Please enter the patient age.'
      );
      return;
    }

    // Validate gender
    if (!gender) {
      Alert.alert(
        'Required',
        'Please select the patient gender.'
      );
      return;
    }

    // Validate phone
    if (phone.length !== 10) {
      Alert.alert(
        'Invalid Number',
        'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    try {

      // Get existing patients
      const existingData =
        await offlineStorage.getItem('patients');

      const existingPatients = existingData
        ? JSON.parse(existingData)
        : [];

      // Create new patient
      const newPatient = {
        id: createUuid(),

        name: name.trim(),

        age: Number(age),

        gender,

        phone,

        village: village.trim(),

        symptoms: symptoms.trim(),

      };

      // Add new patient
      const updatedPatients = [
        ...existingPatients,
        newPatient,
      ];

      // Save patients
      await offlineStorage.setItem(
        'patients',
        JSON.stringify(updatedPatients)
      );

      // Keep the local record immediately available, then create the same
      // client-generated UUID on the ASHA API when a signed-in connection is available.
      void (async () => {
        try {
          const profile = await auth.getAshaProfile();
          const dateOfBirth = new Date();
          dateOfBirth.setFullYear(dateOfBirth.getFullYear() - Number(age));
          await ashaApi.createPatient({
            id: newPatient.id,
            fullName: newPatient.name,
            dateOfBirth: dateOfBirth.toISOString(),
            gender: gender.toUpperCase(),
            phone: newPatient.phone,
            address: newPatient.village || undefined,
            villageId: profile.data.village.id,
            deviceId: 'mobile-app',
            clientCreatedAt: new Date().toISOString(),
          });
        } catch (syncError) {
          console.log('Patient saved locally; API sync will be retried later:', syncError);
        }
      })();

      Alert.alert(
        'Patient Added Successfully',
        `${name} has been added to the patient list.`,
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/patients');
            },
          },
        ]
      );

    } catch (error) {

      console.log(
        'Error saving patient:',
        error
      );

      Alert.alert(
        'Error',
        'Unable to save the patient. Please try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>

      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backArrow}>
              ‹
            </Text>
          </TouchableOpacity>

          <View>
            <Text style={styles.title}>
              Add Patient
            </Text>

            <Text style={styles.subtitle}>
              Enter patient information
            </Text>
          </View>

        </View>

        {/* BASIC INFORMATION */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Basic Information
          </Text>

          {/* NAME */}

          <Text style={styles.label}>
            Patient Name *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter full name"
            placeholderTextColor="#94A3B8"
            value={name}
            onChangeText={setName}
          />

          {/* AGE */}

          <Text style={styles.label}>
            Age *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter age"
            placeholderTextColor="#94A3B8"
            keyboardType="number-pad"
            maxLength={3}
            value={age}
            onChangeText={setAge}
          />

          {/* GENDER */}

          <Text style={styles.label}>
            Gender *
          </Text>

          <View style={styles.genderRow}>

            {['Female', 'Male', 'Other'].map(
              (item) => (

                <TouchableOpacity
                  key={item}
                  style={[
                    styles.genderButton,

                    gender === item &&
                      styles.genderSelected,
                  ]}
                  onPress={() =>
                    setGender(item)
                  }
                >

                  <Text style={styles.genderEmoji}>
                    {item === 'Female'
                      ? '👩'
                      : item === 'Male'
                      ? '👨'
                      : '👤'}
                  </Text>

                  <Text
                    style={[
                      styles.genderText,

                      gender === item &&
                        styles.genderTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                </TouchableOpacity>

              )
            )}

          </View>

          {/* PHONE */}

          <Text style={styles.label}>
            Mobile Number *
          </Text>

          <View style={styles.phoneContainer}>

            <Text style={styles.countryCode}>
              +91
            </Text>

            <TextInput
              style={styles.phoneInput}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
            />

          </View>

        </View>

        {/* LOCATION */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Location
          </Text>

          <Text style={styles.label}>
            Village / Area
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter village or area"
            placeholderTextColor="#94A3B8"
            value={village}
            onChangeText={setVillage}
          />

        </View>

        {/* SYMPTOMS */}

        <View style={styles.card}>

          <Text style={styles.sectionTitle}>
            Initial Health Information
          </Text>

          <Text style={styles.label}>
            Current Symptoms
          </Text>

          <TextInput
            style={styles.textArea}
            placeholder="Describe current symptoms..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
            value={symptoms}
            onChangeText={setSymptoms}
          />

        </View>

        {/* SAVE */}

        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.8}
          onPress={handleSavePatient}
        >

          <Text style={styles.saveIcon}>
            ✓
          </Text>

          <Text style={styles.saveText}>
            Save Patient
          </Text>

        </TouchableOpacity>

        <Text style={styles.required}>
          * Required fields
        </Text>

      </ScrollView>

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

  content: {
    padding: 20,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    elevation: 2,
  },

  backArrow: {
    fontSize: 32,
    color: '#16323A',
    marginTop: -3,
  },

  title: {
    fontSize: 25,
    fontWeight: '800',
    color: '#16323A',
  },

  subtitle: {
    fontSize: 12,
    color: '#7B8794',
    marginTop: 2,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 17,
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16323A',
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334E55',
    marginBottom: 7,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#16323A',
    marginBottom: 17,
    backgroundColor: '#FCFDFD',
  },

  genderRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },

  genderButton: {
    flex: 1,
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FCFDFD',
  },

  genderSelected: {
    borderColor: '#0B8F87',
    backgroundColor: '#E9F7F5',
  },

  genderEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },

  genderText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  genderTextSelected: {
    color: '#0B8F87',
  },

  phoneContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  countryCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334E55',
    marginRight: 8,
  },

  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#16323A',
  },

  textArea: {
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#DCE5E8',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#16323A',
    backgroundColor: '#FCFDFD',
  },

  saveButton: {
    height: 56,
    borderRadius: 15,
    backgroundColor: '#0B8F87',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  saveIcon: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    marginRight: 9,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  required: {
    textAlign: 'center',
    color: '#94A3B8',
    fontSize: 10,
    marginTop: 10,
  },

});
