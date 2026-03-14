import { Stack } from "expo-router";
import "./globals.css";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/context/AuthContext";
import Toast from "react-native-toast-message";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="services/[id]" />
          <Stack.Screen name="provider-profile/[id]" />
          <Stack.Screen name="booking/[providerServiceId]" />
          <Stack.Screen name="wanted" />
          <Stack.Screen name="provider" />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
