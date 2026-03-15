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
import { useRouter, useLocalSearchParams } from "expo-router";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReset() {
    if (!otp || !newPassword || !confirmPassword) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      Toast.show({ type: "success", text1: "Password reset successful!" });
      router.replace("/(auth)/login");
    } catch (error: any) {
      const msg = error.response?.data || "Reset failed";
      Toast.show({
        type: "error",
        text1: typeof msg === "string" ? msg : "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-4";

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
            Reset Password
          </Text>
          <Text className="text-light-300 text-sm mt-2 text-center">
            Enter the code sent to your email{"\n"}and your new password.
          </Text>
        </View>

        <View className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          <Text className="text-light-300 text-xs font-semibold mb-2">
            RESET CODE
          </Text>
          <TextInput
            className={inputClass}
            placeholder="Enter OTP code"
            placeholderTextColor="#9CA4AB"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            NEW PASSWORD
          </Text>
          <TextInput
            className={inputClass}
            placeholder="••••••••"
            placeholderTextColor="#9CA4AB"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            CONFIRM PASSWORD
          </Text>
          <TextInput
            className={inputClass}
            placeholder="••••••••"
            placeholderTextColor="#9CA4AB"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            onPress={handleReset}
            disabled={loading}
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg mt-2"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
