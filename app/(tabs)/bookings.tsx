import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useFocusEffect } from "expo-router";
import api from "@/lib/api";
import BookingCard from "@/components/BookingCard";
import type { CustomerBooking, ProviderBooking } from "@/types";

const STATUS_TABS = [
  { key: "ALL", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "PAYMENT_PENDING", label: "Pay Pending" },
  { key: "COMPLETED", label: "Completed" },
  { key: "REJECTED", label: "Rejected" },
];

const BOOKING_STATUS_PRIORITY: Record<string, number> = {
  PENDING: 1,
  ACCEPTED: 2,
  IN_PROGRESS: 3,
  PAYMENT_PENDING: 4,
  COMPLETED: 5,
  REJECTED: 6,
};

function sortBookings(bookings: any[]) {
  return [...bookings].sort((a, b) => {
    const statusDiff =
      (BOOKING_STATUS_PRIORITY[a.status] ?? 99) -
      (BOOKING_STATUS_PRIORITY[b.status] ?? 99);
    if (statusDiff !== 0) return statusDiff;
    const dateA = new Date(a.scheduledAt || a.createdAt || 0).getTime();
    const dateB = new Date(b.scheduledAt || b.createdAt || 0).getTime();
    return dateB - dateA;
  });
}

export default function BookingsScreen() {
  const { isAuthenticated, role } = useAuth();
  const router = useRouter();
  const isProvider = role === "SERVICE_PROVIDER";

  const [bookings, setBookings] = useState<(CustomerBooking | ProviderBooking)[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) fetchBookings();
    }, [isAuthenticated])
  );

  async function fetchBookings() {
    try {
      setLoading(true);
      if (isProvider) {
        const profileRes = await api.get("/api/provider/profile");
        const providerId = profileRes.data.providerId || profileRes.data.id;
        if (!providerId) throw new Error("Missing provider ID");
        const res = await api.get(`/api/provider/${providerId}/bookings`);
        setBookings(Array.isArray(res.data) ? res.data : []);
      } else {
        const res = await api.get("/api/customer/bookings");
        setBookings(Array.isArray(res.data) ? res.data : []);
      }
    } catch (err: any) {
      console.error("Failed to fetch bookings:", err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchBookings();
    setRefreshing(false);
  }

  const filteredBookings = sortBookings(
    statusFilter === "ALL"
      ? bookings
      : bookings.filter((b) => b.status === statusFilter)
  );

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-primary items-center justify-center px-6">
        <Text className="text-light-100 text-xl font-bold mb-2">
          Login Required
        </Text>
        <Text className="text-light-300 text-sm text-center mb-6">
          Sign in to view your bookings
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

  return (
    <View className="flex-1 bg-primary">
      {/* Header */}
      <View className="px-5 pt-14 pb-2">
        <Text className="text-accent text-3xl font-bold">
          {isProvider ? "Job Requests" : "My Bookings"}
        </Text>
        <Text className="text-light-300 text-sm mt-1">
          {isProvider
            ? "Manage incoming booking requests"
            : "Track your service bookings"}
        </Text>
      </View>

      {/* Status filter tabs */}
      <View className="px-2 py-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12, gap: 6 }}
        >
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            const count = tab.key === "ALL"
              ? bookings.length
              : bookings.filter((b) => b.status === tab.key).length;

            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setStatusFilter(tab.key)}
                className={`px-4 py-2 rounded-2xl border ${
                  isActive
                    ? "bg-accent/20 border-accent/40"
                    : "bg-white/5 border-white/10"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isActive ? "text-accent" : "text-light-300"
                  }`}
                >
                  {tab.label} {count > 0 ? `(${count})` : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#f66b0e" />
        </View>
      ) : (
        <FlatList
          data={filteredBookings}
          keyExtractor={(item) => item.bookingId.toString()}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#f66b0e"
            />
          }
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              isProvider={isProvider}
              onRefresh={fetchBookings}
              onPress={() => {
                if (isProvider) {
                  router.push({
                    pathname: "/provider/booking/[id]",
                    params: { id: item.bookingId, providerServiceId: (item as ProviderBooking).providerServiceId },
                  });
                }
              }}
            />
          )}
          ListEmptyComponent={
            <View className="items-center mt-20">
              <Text className="text-light-300 text-base">No bookings found</Text>
              <Text className="text-light-300/60 text-sm mt-2">
                {statusFilter !== "ALL"
                  ? "Try a different filter"
                  : isProvider
                  ? "You'll see booking requests here"
                  : "Browse services and book a professional"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
