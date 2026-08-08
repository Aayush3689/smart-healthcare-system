import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="patients" />
        <Stack.Screen name="patient-details" />
        <Stack.Screen name="health-assessment" />
        <Stack.Screen name="assessment_details" />
        <Stack.Screen name="prediction" />
      </Stack>
    </SafeAreaProvider>
  );
}