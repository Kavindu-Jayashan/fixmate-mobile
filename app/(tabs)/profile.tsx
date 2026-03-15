import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { CustomerProfile } from "@/types";

export default function ProfileScreen() {
  const { isAuthenticated, role, logout, email } = useAuth();
  const router = useRouter();
  const isProvider = role === "SERVICE_PROVIDER";

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [showChangePw, setShowChangePw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changingPw, setChangingPw] = useState(false);

  // const token = localStorage.getItem("token");

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchProfile();
      } else {
        setProfile(null);
      }
    }, [isAuthenticated])
  );

  async function fetchProfile() {
    try {
      setLoading(true);
      const endpoint = isProvider ? "/api/provider/profile" : "/api/customer/me";
      const res = await api.get(endpoint , {
        // headers: {
        //   Authorization: `Bearer ${token}`
        // }
      });
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword() {
    if (!currentPw || !newPw || !confirmPw) {
      Toast.show({ type: "error", text1: "Please fill all fields" });
      return;
    }
    if (newPw !== confirmPw) {
      Toast.show({ type: "error", text1: "Passwords do not match" });
      return;
    }
    try {
      setChangingPw(true);
      await api.put("/api/user/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      Toast.show({ type: "success", text1: "Password changed!" });
      setShowChangePw(false);
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (error: any) {
      const msg = error.response?.data?.message || error.response?.data || "Failed";
      Toast.show({
        type: "error",
        text1: typeof msg === "string" ? msg : "Password change failed",
      });
    } finally {
      setChangingPw(false);
    }
  }

 function handleLogout() {
    Alert.alert("Logout", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            // Force navigation FIRST or ensure logout is handled gracefully
            await logout();
            // Use push or replace, but ensure the AuthContext isn't blocking the render
            router.replace("/(auth)/login");
          } catch (e) {
            console.error("Logout failed", e);
            // Still navigate away even if the backend call fails
            router.replace("/(auth)/login");
          }
        },
      },
    ]);
  }

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-primary items-center justify-center px-6">
        <Text className="text-light-100 text-xl font-bold mb-2">
          Login Required
        </Text>
        <Text className="text-light-300 text-sm text-center mb-6">
          Sign in to view your profile
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-2xl px-8 py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-white font-semibold">Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  const inputClass =
    "bg-white/5 border border-white/10 rounded-2xl px-4 h-12 text-light-100 mb-3";

  return (
    <ScrollView className="flex-1 bg-primary" contentContainerStyle={{ paddingBottom: 120 }}>
      <View className="px-5 pt-14 pb-4">
        <Text className="text-accent text-3xl font-bold">Profile</Text>
      </View>

      {/* Profile card */}
      <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-4">
        {/* Avatar */}
        <View className="items-center mb-4">
          <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-3">
            <Text className="text-accent text-3xl font-bold">
              {isProvider
                ? profile?.fullName?.charAt(0)
                : profile?.firstName?.charAt(0) || "?"}
            </Text>
          </View>
          <Text className="text-light-100 text-xl font-bold">
            {isProvider
              ? profile?.fullName
              : `${profile?.firstName || ""} ${profile?.lastName || ""}`}
          </Text>
          <Text className="text-light-300 text-sm">{email}</Text>
          {isProvider && profile?.skill && (
            <View className="bg-accent/15 rounded-full px-4 py-1 mt-2">
              <Text className="text-accent text-xs font-semibold">
                {profile.skill}
              </Text>
            </View>
          )}
        </View>

        {/* Info rows */}
        {isProvider && (
          <>
            <InfoRow label="Location" value={profile?.location || "—"} />
            <InfoRow label="Rating" value={profile?.rating?.toFixed(1) || "N/A"} />
            <InfoRow
              label="Availability"
              value={profile?.isAvailable ? "Available" : "Not available"}
            />
          </>
        )}
        {!isProvider && (
          <>
            <InfoRow label="Phone" value={profile?.phone || "—"} />
          </>
        )}
      </View>

      {/* Quick actions */}
      <View className="mx-5 mb-4">
        <QuickAction
          title="✏️ Edit Profile"
          onPress={() => router.push("/edit-profile" as any)}
        />
        {isProvider && (
          <>
            <QuickAction
              title="📊 Dashboard"
              onPress={() => router.push("/provider/dashboard")}
            />
            <QuickAction
              title="🛠 Manage Services"
              onPress={() => router.push("/provider/services")}
            />
          </>
        )}
        <QuickAction
          title="📋 Wanted Jobs"
          onPress={() => router.push("/wanted")}
        />
      </View>

      {/* Change password */}
      <View className="mx-5 mb-4">
        <TouchableOpacity
          className="bg-secondary/40 border border-white/8 rounded-3xl p-4"
          onPress={() => setShowChangePw(!showChangePw)}
        >
          <Text className="text-light-100 font-semibold">
            🔒 Change Password
          </Text>
        </TouchableOpacity>

        {showChangePw && (
          <View className="bg-secondary/30 border border-white/8 rounded-3xl p-4 mt-2">
            <TextInput
              className={inputClass}
              placeholder="Current password"
              placeholderTextColor="#9CA4AB"
              secureTextEntry
              value={currentPw}
              onChangeText={setCurrentPw}
            />
            <TextInput
              className={inputClass}
              placeholder="New password"
              placeholderTextColor="#9CA4AB"
              secureTextEntry
              value={newPw}
              onChangeText={setNewPw}
            />
            <TextInput
              className={inputClass}
              placeholder="Confirm new password"
              placeholderTextColor="#9CA4AB"
              secureTextEntry
              value={confirmPw}
              onChangeText={setConfirmPw}
            />
            <TouchableOpacity
              className="bg-accent rounded-2xl h-10 items-center justify-center"
              onPress={handleChangePassword}
              disabled={changingPw}
              style={{ opacity: changingPw ? 0.6 : 1 }}
            >
              {changingPw ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text className="text-white font-semibold text-sm">
                  Update Password
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Logout */}
      <View className="mx-5">
        <TouchableOpacity
          className="bg-red-500/15 border border-red-500/20 rounded-3xl h-12 items-center justify-center"
          onPress={handleLogout}
        >
          <Text className="text-red-400 font-semibold">Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between py-2 border-b border-white/5">
      <Text className="text-light-300 text-sm">{label}</Text>
      <Text className="text-light-100 text-sm font-medium">{value}</Text>
    </View>
  );
}

function QuickAction({
  title,
  onPress,
}: {
  title: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      className="bg-secondary/40 border border-white/8 rounded-3xl p-4 mb-2 flex-row items-center justify-between"
      onPress={onPress}
    >
      <Text className="text-light-100 font-medium">{title}</Text>
      <Text className="text-light-300">›</Text>
    </TouchableOpacity>
  );
}
