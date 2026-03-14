import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import type { PublicServiceCard } from "@/types";

interface Props {
  provider: PublicServiceCard;
}

export default function ProviderCard({ provider }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="bg-secondary/40 border border-white/8 rounded-3xl p-4 mb-4"
      activeOpacity={0.7}
      onPress={() =>
        router.push({
          pathname: "/provider-profile/[id]",
          params: { id: provider.providerId },
        })
      }
    >
      {/* Top row: avatar + name */}
      <View className="flex-row items-center mb-3">
        <View className="w-12 h-12 rounded-full bg-accent/20 items-center justify-center mr-3">
          {provider.providerProfileImage ? (
            <Image
              source={{ uri: provider.providerProfileImage }}
              className="w-12 h-12 rounded-full"
            />
          ) : (
            <Text className="text-accent font-bold text-lg">
              {provider.providerName?.charAt(0) || "?"}
            </Text>
          )}
        </View>
        <View className="flex-1">
          <Text className="text-light-100 font-semibold text-base" numberOfLines={1}>
            {provider.providerName}
          </Text>
          <Text className="text-light-300 text-xs" numberOfLines={1}>
            {provider.serviceTitle}
          </Text>
        </View>

        {/* Availability badge */}
        <View
          className={`px-2 py-1 rounded-full ${
            provider.isAvailable ? "bg-emerald-500/20" : "bg-red-500/20"
          }`}
        >
          <Text
            className={`text-[10px] font-semibold ${
              provider.isAvailable ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {provider.isAvailable ? "Available" : "Busy"}
          </Text>
        </View>
      </View>

      {/* Info row */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1">
          <Text className="text-yellow-400 text-xs">★</Text>
          <Text className="text-light-100 text-xs font-medium">
            {provider.rating?.toFixed(1) || "N/A"}
          </Text>
          <Text className="text-light-300 text-xs ml-1">
            ({provider.reviewCount || 0})
          </Text>
        </View>

        <Text className="text-light-300 text-xs" numberOfLines={1}>
          📍 {provider.district || provider.city || provider.location || "—"}
        </Text>

        <View className="bg-accent/15 rounded-xl px-3 py-1">
          <Text className="text-accent text-xs font-semibold">
            {provider.fixedPriceAvailable
              ? `Rs. ${provider.fixedPrice}`
              : provider.hourlyRate
              ? `Rs. ${provider.hourlyRate}/hr`
              : "—"}
          </Text>
        </View>
      </View>

      {/* Book button */}
      <TouchableOpacity
        className="bg-accent rounded-2xl h-10 items-center justify-center mt-3"
        onPress={() =>
          router.push({
            pathname: "/booking/[providerServiceId]",
            params: { providerServiceId: provider.providerServiceId },
          })
        }
      >
        <Text className="text-white font-semibold text-sm">Book Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
