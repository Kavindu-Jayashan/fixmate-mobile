import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit() {
    if (!email.trim()) {
      Toast.show({ type: "error", text1: "Please enter your email" });
      return;
    }

    try {
      setLoading(true);
      await api.post(`/api/auth/forgot-password?email=${encodeURIComponent(email)}`);
      Toast.show({
        type: "success",
        text1: "OTP sent!",
        text2: "Check your email for the reset code.",
      });
      router.push({
        pathname: "/(auth)/reset-password",
        params: { email },
      });
    } catch (error: any) {
      const msg = error.response?.data || "Failed to send reset code";
      Toast.show({
        type: "error",
        text1: typeof msg === "string" ? msg : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-primary"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        className="px-6"
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center mb-10">
          <Text className="text-3xl font-bold text-accent">
            Forgot Password
          </Text>
          <Text className="text-light-300 text-sm mt-2 text-center">
            Enter your email address and we'll send{"\n"}you a reset code.
          </Text>
        </View>

        <View className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          <Text className="text-light-300 text-xs font-semibold mb-2">
            EMAIL
          </Text>
          <TextInput
            className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-6"
            placeholder="you@example.com"
            placeholderTextColor="#9CA4AB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading}
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Send Reset Code
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 items-center"
        >
          <Text className="text-light-300 text-sm">
            ← Back to{" "}
            <Text className="text-accent font-semibold">Login</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
