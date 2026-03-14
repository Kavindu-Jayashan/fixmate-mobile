import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import api from "@/lib/api";
import Toast from "react-native-toast-message";
import type { ProviderServiceItem } from "@/types";

export default function ManageServicesScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ProviderServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    try {
      setLoading(true);
      const res = await api.get("/api/provider/services");
      setServices(Array.isArray(res.data) ? res.data : []);
    } catch {
      console.error("Failed to fetch services");
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchServices();
    setRefreshing(false);
  }

  async function toggleActive(id: number) {
    try {
      await api.patch(`/api/provider/service/${id}/active`);
      setServices((prev) =>
        prev.map((s) =>
          s.providerServiceId === id ? { ...s, isActive: !s.isActive } : s
        )
      );
      Toast.show({ type: "success", text1: "Service updated" });
    } catch {
      Toast.show({ type: "error", text1: "Failed to update service" });
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      {/* Header */}
      <View className="px-5 pt-2 pb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Back</Text>
        </TouchableOpacity>
        <Text className="text-light-100 text-lg font-bold">My Services</Text>
        <View className="w-12" />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f66b0e" />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item.providerServiceId.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f66b0e" />
          }
          renderItem={({ item }) => (
            <View className="bg-secondary/40 border border-white/8 rounded-3xl p-4 mb-3">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-light-100 font-semibold text-base flex-1" numberOfLines={1}>
                  {item.serviceTitle}
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    item.isActive ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      item.isActive ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>

              <Text className="text-light-300 text-sm mb-3">
                {item.fixedPriceAvailable
                  ? `Fixed: Rs. ${item.fixedPrice}`
                  : item.hourlyRate
                  ? `Rs. ${item.hourlyRate}/hr`
                  : "—"}
              </Text>

              <TouchableOpacity
                onPress={() => toggleActive(item.providerServiceId)}
                className={`rounded-2xl h-9 items-center justify-center ${
                  item.isActive
                    ? "bg-red-500/15 border border-red-500/20"
                    : "bg-emerald-500/15 border border-emerald-500/20"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    item.isActive ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {item.isActive ? "Deactivate" : "Activate"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-light-300 text-base">No services added yet</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
