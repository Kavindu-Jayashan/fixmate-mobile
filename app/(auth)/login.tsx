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
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }

    try {
      setLoading(true);
      const res = await api.post("/api/auth/login", { email, password });
      const { token } = res.data;
      await login(token);

      Toast.show({ type: "success", text1: "Login successful!" });
      router.replace("/(tabs)");
    } catch (error: any) {
      const msg =
        error.response?.data?.message || error.response?.data || "Invalid credentials";
      Toast.show({ type: "error", text1: typeof msg === "string" ? msg : "Login failed" });
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
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-accent">Welcome back</Text>
          <Text className="text-light-300 text-sm mt-2">
            Sign in to your FixMate account
          </Text>
        </View>

        {/* Form */}
        <View className="bg-secondary/30 border border-white/10 rounded-3xl p-6">
          {/* Email */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            EMAIL
          </Text>
          <TextInput
            className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-4"
            placeholder="you@example.com"
            placeholderTextColor="#9CA4AB"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          {/* Password */}
          <Text className="text-light-300 text-xs font-semibold mb-2">
            PASSWORD
          </Text>
          <TextInput
            className="bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-2"
            placeholder="••••••••"
            placeholderTextColor="#9CA4AB"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {/* Forgot */}
          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            className="self-end mb-6"
          >
            <Text className="text-accent text-sm font-medium">
              Forgot password?
            </Text>
          </TouchableOpacity>

          {/* Login button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Login
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign up link */}
        <View className="flex-row items-center justify-center mt-8">
          <Text className="text-light-300 text-sm">
            Don't have an account?{" "}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/signup")}>
            <Text className="text-accent font-semibold text-sm">Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
