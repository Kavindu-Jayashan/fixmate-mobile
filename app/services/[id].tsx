import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import type { PublicServiceCard } from "@/types";

export default function ServiceDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [service, setService] = useState<PublicServiceCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchService();
  }, [id]);

  async function fetchService() {
    try {
      setLoading(true);
      const res = await api.get(`/api/user/service/${id}`);
      setService(res.data);
    } catch (err) {
      console.error("Failed to load service:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 bg-primary items-center justify-center">
        <ActivityIndicator size="large" color="#f66b0e" />
      </View>
    );
  }

  if (!service) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <Text className="text-light-300 text-lg">Service not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <TouchableOpacity className="px-5 pt-2 pb-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Back</Text>
        </TouchableOpacity>

        {/* Service card */}
        <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-5">
          <Text className="text-light-100 text-2xl font-bold">{service.serviceTitle}</Text>
          <Text className="text-light-300 text-sm mt-2">{service.categoryName}</Text>

          <View className="flex-row items-center gap-4 mt-4">
            <View className="bg-accent/15 rounded-xl px-3 py-1.5">
              <Text className="text-accent font-semibold text-sm">
                {service.fixedPriceAvailable
                  ? `Fixed: Rs. ${service.fixedPrice}`
                  : service.hourlyRate
                  ? `Rs. ${service.hourlyRate}/hr`
                  : "—"}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Text className="text-yellow-400">★</Text>
              <Text className="text-light-100 text-sm font-medium">
                {service.rating?.toFixed(1) || "N/A"}
              </Text>
              <Text className="text-light-300 text-xs">
                ({service.reviewCount || 0})
              </Text>
            </View>
          </View>
        </View>

        {/* Provider info */}
        <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-5">
          <Text className="text-light-300 text-xs font-semibold mb-3">PROVIDER</Text>
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() =>
              router.push({
                pathname: "/provider-profile/[id]",
                params: { id: service.providerId },
              })
            }
          >
            <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center mr-3">
              <Text className="text-accent font-bold text-lg">
                {service.providerName?.charAt(0)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-light-100 font-semibold">{service.providerName}</Text>
              <Text className="text-light-300 text-xs">
                📍 {service.district || service.city || service.location || "—"}
              </Text>
            </View>
            <View
              className={`px-2 py-1 rounded-full ${
                service.isAvailable ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              <Text
                className={`text-[10px] font-semibold ${
                  service.isAvailable ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {service.isAvailable ? "Available" : "Busy"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Description */}
        {service.description && (
          <View className="mx-5 bg-secondary/40 border border-white/8 rounded-3xl p-5 mb-5">
            <Text className="text-light-300 text-xs font-semibold mb-2">DESCRIPTION</Text>
            <Text className="text-light-100 text-sm leading-5">{service.description}</Text>
          </View>
        )}

        {/* Book button */}
        <View className="mx-5">
          <TouchableOpacity
            className="bg-accent rounded-2xl h-12 items-center justify-center shadow-lg"
            onPress={() =>
              router.push({
                pathname: "/booking/[providerServiceId]",
                params: { providerServiceId: service.providerServiceId },
              })
            }
          >
            <Text className="text-white font-semibold text-base">Book Now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
