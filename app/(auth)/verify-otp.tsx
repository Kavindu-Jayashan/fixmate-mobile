import React, { useState, useRef } from "react";
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

export default function VerifyOtpScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();

  function handleChange(text: string, index: number) {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 5) {
      inputs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  }

  async function handleVerify() {
    const otp = code.join("");
    if (otp.length !== 6) {
      Toast.show({ type: "error", text1: "Please enter 6-digit code" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/verify", { email, code: otp });
      Toast.show({ type: "success", text1: "Email verified successfully!" });
      router.replace("/(auth)/login");
    } catch (error: any) {
      const msg = error.response?.data || "Verification failed";
      Toast.show({
        type: "error",
        text1: typeof msg === "string" ? msg : "Invalid code",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    try {
      setResending(true);
      await api.post("/api/auth/resend-otp", { email });
      Toast.show({ type: "success", text1: "OTP resent successfully!" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to resend OTP" });
    } finally {
      setResending(false);
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
            Verify Your Email
          </Text>
          <Text className="text-light-300 text-sm mt-2 text-center">
            Enter the 6-digit code sent to{"\n"}
            <Text className="text-accent font-medium">{email}</Text>
          </Text>
        </View>

        <View className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          {/* OTP inputs */}
          <View className="flex-row justify-between mb-8">
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputs.current[i] = ref;
                }}
                className="w-12 h-14 bg-white/5 border border-white/15 rounded-2xl text-center text-light-100 text-xl font-bold"
                maxLength={1}
                keyboardType="number-pad"
                value={digit}
                onChangeText={(text) => handleChange(text, i)}
                onKeyPress={({ nativeEvent }) =>
                  handleKeyPress(nativeEvent.key, i)
                }
              />
            ))}
          </View>

          {/* Verify button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Verify
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            onPress={handleResend}
            disabled={resending}
            className="mt-4 items-center"
          >
            <Text className="text-light-300 text-sm">
              Didn't receive the code?{" "}
              <Text className="text-accent font-semibold">
                {resending ? "Sending..." : "Resend"}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
