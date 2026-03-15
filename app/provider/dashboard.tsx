import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import Toast from "react-native-toast-message";

interface DashboardSummary {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  totalEarnings: number;
  activeServices: number;
}

interface Earnings {
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;
}

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [summaryRes, earningsRes, profileRes] = await Promise.all([
        api.get("/api/provider/dashboard/summary"),
        api.get("/api/provider/earnings"),
        api.get("/api/provider/profile"),
      ]);
      setSummary(summaryRes.data);
      setEarnings(earningsRes.data);
      setIsAvailable(profileRes.data.isAvailable);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }

  async function toggleAvailability() {
    try {
      setToggling(true);
      const res = await api.patch("/api/provider/availability");
      setIsAvailable(res.data.isAvailable);
      Toast.show({
        type: "success",
        text1: res.data.isAvailable ? "You're now available!" : "Marked as unavailable",
      });
    } catch {
      Toast.show({ type: "error", text1: "Failed to toggle availability" });
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f66b0e" />}
      >
        {/* Header */}
        <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-accent font-semibold">← Back</Text>
          </TouchableOpacity>
          <Text className="text-light-100 text-lg font-bold">Dashboard</Text>
          <View className="w-12" />
        </View>

        {/* Availability toggle */}
        <View className="mx-5 mb-5">
          <TouchableOpacity
            onPress={toggleAvailability}
            disabled={toggling}
            className={`rounded-3xl p-4 flex-row items-center justify-between border ${
              isAvailable
                ? "bg-emerald-500/10 border-emerald-500/20"
                : "bg-red-500/10 border-red-500/20"
            }`}
          >
            <View className="flex-row items-center gap-3">
              <View className={`w-3 h-3 rounded-full ${isAvailable ? "bg-emerald-400" : "bg-red-400"}`} />
              <Text className="text-light-100 font-semibold">
                {isAvailable ? "Available for work" : "Not available"}
              </Text>
            </View>
            {toggling ? (
              <ActivityIndicator size="small" color="#f66b0e" />
            ) : (
              <Text className="text-accent text-sm font-medium">Toggle</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats grid */}
        <View className="mx-5 flex-row flex-wrap gap-3 mb-5">
          <StatCard title="Total Bookings" value={summary?.totalBookings ?? 0} color="bg-blue-500/15" />
          <StatCard title="Pending" value={summary?.pendingBookings ?? 0} color="bg-yellow-500/15" />
          <StatCard title="Completed" value={summary?.completedBookings ?? 0} color="bg-emerald-500/15" />
          <StatCard title="Active Services" value={summary?.activeServices ?? 0} color="bg-indigo-500/15" />
        </View>

        {/* Earnings */}
        <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-5">
          <Text className="text-light-300 text-xs font-semibold mb-3">EARNINGS</Text>
          <View className="flex-row justify-between">
            <EarningItem label="This Week" value={earnings?.weeklyEarnings ?? 0} />
            <EarningItem label="This Month" value={earnings?.monthlyEarnings ?? 0} />
            <EarningItem label="Total" value={earnings?.totalEarnings ?? 0} />
          </View>
        </View>

        {/* Quick actions */}
        <View className="mx-5">
          <Text className="text-light-300 text-xs font-semibold mb-3">QUICK ACTIONS</Text>
          <QuickAction title="🛠 Manage Services" onPress={() => router.push("/provider/services")} />
          <QuickAction title="📋 View Bookings" onPress={() => router.push("/(tabs)/bookings")} />
          <QuickAction title="📢 Wanted Jobs" onPress={() => router.push("/wanted")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <View className={`${color} rounded-2xl p-4 w-[48%] border border-white/5`}>
      <Text className="text-light-300 text-xs">{title}</Text>
      <Text className="text-light-100 text-2xl font-bold mt-1">{value}</Text>
    </View>
  );
}

function EarningItem({ label, value }: { label: string; value: number }) {
  return (
    <View className="items-center">
      <Text className="text-light-300 text-xs">{label}</Text>
      <Text className="text-accent text-lg font-bold mt-1">
        Rs. {value.toLocaleString()}
      </Text>
    </View>
  );
}

function QuickAction({ title, onPress }: { title: string; onPress: () => void }) {
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
