import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "@/lib/api";
import type { ProviderProfile, Review } from "@/types";

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");

  useEffect(() => {
    if (id) fetchProfile();
  }, [id]);

  async function fetchProfile() {
    try {
      setLoading(true);
      const [profileRes, reviewsRes] = await Promise.all([
        api.get(`/api/provider/${id}`),
        api.get(`/api/reviews/provider/${id}`),
      ]);
      setProfile(profileRes.data);
      setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);
    } catch (err) {
      console.error("Failed to load profile:", err);
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

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-primary items-center justify-center">
        <Text className="text-light-300 text-lg">Profile not found</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Back button */}
        <TouchableOpacity className="px-5 pt-2 pb-4" onPress={() => router.back()}>
          <Text className="text-accent font-semibold">← Back</Text>
        </TouchableOpacity>

        {/* Profile header */}
        <View className="items-center px-5 mb-6">
          <View className="w-20 h-20 rounded-full bg-accent/20 items-center justify-center mb-3">
            <Text className="text-accent text-3xl font-bold">
              {profile.fullName?.charAt(0)}
            </Text>
          </View>
          <Text className="text-light-100 text-2xl font-bold">{profile.fullName}</Text>
          <Text className="text-light-300 text-sm mt-1">{profile.skill}</Text>
          <Text className="text-light-300 text-xs mt-1">📍 {profile.location}</Text>

          <View className="flex-row items-center gap-4 mt-3">
            <View className="bg-yellow-500/15 rounded-full px-3 py-1 flex-row items-center gap-1">
              <Text className="text-yellow-400 text-sm">★</Text>
              <Text className="text-yellow-400 text-sm font-semibold">
                {profile.rating?.toFixed(1) || "N/A"}
              </Text>
            </View>
            <View
              className={`rounded-full px-3 py-1 ${
                profile.isAvailable ? "bg-emerald-500/15" : "bg-red-500/15"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  profile.isAvailable ? "text-emerald-400" : "text-red-400"
                }`}
              >
                {profile.isAvailable ? "Available" : "Not available"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab selector */}
        <View className="flex-row mx-5 bg-secondary/40 rounded-2xl p-1 mb-5">
          {(["overview", "reviews"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-3 rounded-xl ${
                activeTab === tab ? "bg-accent" : ""
              }`}
            >
              <Text
                className={`text-center text-sm font-semibold ${
                  activeTab === tab ? "text-white" : "text-light-300"
                }`}
              >
                {tab === "overview" ? "Overview" : `Reviews (${reviews.length})`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        {activeTab === "overview" ? (
          <View className="px-5">
            {profile.description && (
              <View className="mb-4">
                <Text className="text-light-100 font-semibold text-base mb-2">About</Text>
                <Text className="text-light-300 text-sm leading-5">{profile.description}</Text>
              </View>
            )}
            {profile.experience && (
              <View className="mb-4">
                <Text className="text-light-100 font-semibold text-base mb-2">
                  Experience
                </Text>
                <Text className="text-light-300 text-sm leading-5">{profile.experience}</Text>
              </View>
            )}

            <Text className="text-light-100 font-semibold text-base mb-3">Services</Text>
            {profile.services?.length > 0 ? (
              profile.services.map((svc) => (
                <View
                  key={svc.providerServiceId}
                  className="bg-secondary/40 border border-white/8 rounded-2xl p-4 mb-3 flex-row items-center justify-between"
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-light-100 font-medium">{svc.serviceTitle}</Text>
                    <Text className="text-light-300 text-xs mt-1">
                      {svc.fixedPriceAvailable
                        ? `Fixed: Rs. ${svc.fixedPrice}`
                        : svc.hourlyRate
                        ? `Rs. ${svc.hourlyRate}/hr`
                        : "—"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    className="bg-accent rounded-xl px-4 py-2"
                    onPress={() =>
                      router.push({
                        pathname: "/booking/[providerServiceId]",
                        params: { providerServiceId: svc.providerServiceId },
                      })
                    }
                  >
                    <Text className="text-white text-sm font-semibold">Book</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text className="text-light-300 text-sm">No services available</Text>
            )}
          </View>
        ) : (
          <View className="px-5">
            {reviews.length > 0 ? (
              reviews.map((review, idx) => (
                <View
                  key={review.id || idx}
                  className="bg-secondary/40 border border-white/8 rounded-2xl p-4 mb-3"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-light-100 font-semibold">
                      {review.customerName}
                    </Text>
                    <View className="flex-row items-center gap-1">
                      <Text className="text-yellow-400 text-sm">★</Text>
                      <Text className="text-light-100 text-sm">{review.rating}</Text>
                    </View>
                  </View>
                  <Text className="text-light-300 text-sm">{review.comment}</Text>
                  <Text className="text-light-300/50 text-xs mt-2">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-light-300 text-sm text-center mt-8">
                No reviews yet
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
