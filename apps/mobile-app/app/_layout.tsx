import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { startSyncMonitoring } from '@/lib/offline-storage';

export default function RootLayout() {
  useEffect(() => {
    startSyncMonitoring();
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="asha-profile" />
        <Stack.Screen name="patients" />
        <Stack.Screen name="patient-details" />
        <Stack.Screen name="assessment" />
        <Stack.Screen name="select-patient" />
        <Stack.Screen name="health-assessment" />
        <Stack.Screen name="assessment_details" />
        <Stack.Screen name="prediction" />
      </Stack>
    </SafeAreaProvider>
  );
}
