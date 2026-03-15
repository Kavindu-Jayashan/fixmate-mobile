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

export default function SignupScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "SERVICE_PROVIDER" | "">("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSignup() {
    if (!firstName || !lastName || !email || !phone || !password || !role) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);
      await api.post("/api/auth/signup", {
        firstName,
        lastName,
        email,
        phone,
        password,
        role,
      });

      Toast.show({
        type: "success",
        text1: "Signup successful!",
        text2: "Enter the verification code sent to your email.",
      });
      router.push({
        pathname: "/(auth)/verify-otp",
        params: { email },
      });
    } catch (error: any) {
      const data = error.response?.data;
      let msg = "Signup failed. Please try again.";

      if (data) {
        if (typeof data === "object" && !Array.isArray(data) && !data.message) {
          msg = Object.values(data)[0] as string;
        } else if (data.message) {
          msg = data.message;
        } else if (typeof data === "string") {
          msg = data;
        }
      }

      Toast.show({ type: "error", text1: msg });
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
        {/* Header */}
        <View className="items-center mb-8 mt-12">
          <Text className="text-3xl font-bold text-accent">
            Welcome to FixMate
          </Text>
          <Text className="text-light-300 text-sm mt-2">
            Sign up to get the best experience
          </Text>
        </View>

        {/* Form */}
        <View className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          <Text className="text-light-300 text-xs font-semibold mb-2">
            FIRST NAME
          </Text>
          <TextInput
            className={inputClass}
            placeholder="John"
            placeholderTextColor="#9CA4AB"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            LAST NAME
          </Text>
          <TextInput
            className={inputClass}
            placeholder="Doe"
            placeholderTextColor="#9CA4AB"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            EMAIL
          </Text>
          <TextInput
            className={inputClass}
            placeholder="you@example.com"
            placeholderTextColor="#9CA4AB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            PHONE NUMBER
          </Text>
          <TextInput
            className={inputClass}
            placeholder="07X XXX XXXX"
            placeholderTextColor="#9CA4AB"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />

          <Text className="text-light-300 text-xs font-semibold mb-2">
            PASSWORD
          </Text>
          <TextInput
            className={inputClass}
            placeholder="••••••••"
            placeholderTextColor="#9CA4AB"
            value={password}
            onChangeText={setPassword}
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

          {/* Role picker */}
          <Text className="text-light-300 text-xs font-semibold mb-3">
            I WANT TO
          </Text>
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={() => setRole("CUSTOMER")}
              className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                role === "CUSTOMER"
                  ? "bg-accent border-accent"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  role === "CUSTOMER" ? "text-white" : "text-light-300"
                }`}
              >
                Hire Services
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setRole("SERVICE_PROVIDER")}
              className={`flex-1 h-12 rounded-2xl items-center justify-center border ${
                role === "SERVICE_PROVIDER"
                  ? "bg-accent border-accent"
                  : "bg-white/5 border-white/10"
              }`}
            >
              <Text
                className={`font-semibold text-sm ${
                  role === "SERVICE_PROVIDER" ? "text-white" : "text-light-300"
                }`}
              >
                Provide Services
              </Text>
            </TouchableOpacity>
          </View>

          {/* Signup button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Sign Up
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login link */}
        <View className="flex-row items-center justify-center mt-6 mb-10">
          <Text className="text-light-300 text-sm">
            Already have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text className="text-accent font-semibold text-sm">Log in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
