import { Stack } from "expo-router";

export default function ProviderLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="services" />
      <Stack.Screen name="booking/[id]" />
    </Stack>
  );
}
